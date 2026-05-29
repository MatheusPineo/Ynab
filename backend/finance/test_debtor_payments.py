import pytest
from decimal import Decimal
from django.contrib.auth.models import User
from django.utils import timezone
from finance.models import Account, Debtor, DebtItem, Transaction as CoreTransaction
from finance.services import DebtorPaymentService
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_debtor_payment_fifo():
    user = User.objects.create_user(username="testuser", password="password")
    subaccount = Account.objects.create(
        user=user,
        name="Mercado",
        account_type="checking",
        balance=Decimal("100.00")
    )
    debtor = Debtor.objects.create(user=user, name="Miguel")
    
    # Create debt items
    item1 = DebtItem.objects.create(
        debtor=debtor,
        origin_subaccount=subaccount,
        product_name="Cerveja",
        total_amount=Decimal("20.00"),
        paid_amount=Decimal("0.00")
    )
    item2 = DebtItem.objects.create(
        debtor=debtor,
        origin_subaccount=subaccount,
        product_name="Carne",
        total_amount=Decimal("30.00"),
        paid_amount=Decimal("5.00"),
        status="PARTIAL"
    )
    item3 = DebtItem.objects.create(
        debtor=debtor,
        origin_subaccount=subaccount,
        product_name="Carvão",
        total_amount=Decimal("15.00"),
        paid_amount=Decimal("0.00")
    )
    
    # 20€ settles item1, leaves 15€ for item2, item3 untouched.
    # Total payment = 35.00
    res = DebtorPaymentService.pay_subaccount_group(debtor.id, subaccount.id, Decimal("35.00"))
    
    # Refresh from database
    item1.refresh_from_db()
    item2.refresh_from_db()
    item3.refresh_from_db()
    subaccount.refresh_from_db()
    
    assert item1.status == "SETTLED"
    assert item1.paid_amount == Decimal("20.00")
    
    # item2 needs: 30 - 5 = 25. We have 15 left from remaining payment.
    # So item2 new paid_amount: 5 + 15 = 20.00, status should be PARTIAL.
    assert item2.status == "PARTIAL"
    assert item2.paid_amount == Decimal("20.00")
    
    # item3 should remain PENDING
    assert item3.status == "PENDING"
    assert item3.paid_amount == Decimal("0.00")
    
    # subaccount balance should be 100.00 + 35.00 = 135.00
    assert subaccount.balance == Decimal("135.00")
    
    # Check that a core transaction was created
    tx = CoreTransaction.objects.filter(account=subaccount, is_income=True).first()
    assert tx is not None
    assert tx.amount == Decimal("35.00")
    assert tx.description == f"Pagamento de dívida - {debtor.name}"

@pytest.mark.django_db
def test_grouped_debts_api():
    user = User.objects.create_user(username="testuser", password="password")
    client = APIClient()
    client.force_authenticate(user=user)
    
    subaccount = Account.objects.create(
        user=user,
        name="Mercado",
        account_type="checking",
        balance=Decimal("100.00")
    )
    debtor = Debtor.objects.create(user=user, name="Davi")
    
    DebtItem.objects.create(
        debtor=debtor,
        origin_subaccount=subaccount,
        product_name="Arroz",
        total_amount=Decimal("10.00"),
        paid_amount=Decimal("2.00")
    )
    
    DebtItem.objects.create(
        debtor=debtor,
        origin_subaccount=subaccount,
        product_name="Feijão",
        total_amount=Decimal("15.00"),
        paid_amount=Decimal("5.00")
    )
    
    response = client.get(f"/api/debtors/{debtor.id}/grouped_debts/")
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) == 1
    assert data[0]["subaccount_name"] == "Mercado"
    # Total outstanding = (10 - 2) + (15 - 5) = 8 + 10 = 18.00
    assert Decimal(str(data[0]["total_outstanding_balance"])) == Decimal("18.00")
    assert len(data[0]["items"]) == 2


@pytest.mark.django_db
def test_bulk_debt_item_creation():
    from finance.services import DebtorCreationService
    user = User.objects.create_user(username="testuser", password="password")
    subaccount = Account.objects.create(
        user=user,
        name="Mercado",
        account_type="checking",
        balance=Decimal("100.00")
    )
    debtor = Debtor.objects.create(user=user, name="Davi")
    
    payload = [
        {"product_name": "Sabão em Pó", "total_amount": 15.50},
        {"product_name": "Amaciante", "total_amount": 10.00}
    ]
    
    items = DebtorCreationService.register_itemized_debts(debtor.id, subaccount.id, payload)
    assert len(items) == 2
    assert items[0].product_name == "Sabão em Pó"
    assert items[0].total_amount == Decimal("15.50")
    assert items[0].status == "PENDING"
    assert items[0].paid_amount == Decimal("0.00")
    
    # Test via API endpoint
    client = APIClient()
    client.force_authenticate(user=user)
    
    response = client.post(
        f"/api/debtors/{debtor.id}/add_items/",
        {"subaccount_id": subaccount.id, "items": payload},
        format="json"
    )
    
    assert response.status_code == 201
    res_data = response.json()
    assert len(res_data) == 2
    assert res_data[0]["product_name"] == "Sabão em Pó"
    assert Decimal(str(res_data[1]["total_amount"])) == Decimal("10.00")

