import pytest
from decimal import Decimal
from datetime import date
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from finance.models import Account, Category, Transaction, Debt, DebtPayment, SplitRule

@pytest.mark.django_db
def test_transaction_split_creation_creates_debts():
    # Setup user
    user = User.objects.create_user(username="testuser", password="password")
    client = APIClient()
    client.force_authenticate(user=user)

    # Setup account and category
    account = Account.objects.create(user=user, name="Checking", balance=Decimal("1000.00"), currency="EUR")
    category = Category.objects.create(user=user, name="Food", currency="EUR")

    # Call transactions API with splits payload
    payload = {
        "account": account.id,
        "amount": "50.00",
        "description": "Lunch with roommates",
        "date": date.today().strftime("%Y-%m-%d"),
        "category": category.id,
        "is_income": False,
        "status": "realized",
        "splits": [
            {"debtor_id": "Alice", "amount": "20.00"},
            {"debtor_id": "Bob", "amount": "30.00"}
        ]
    }

    response = client.post("/api/transactions/", payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED

    # Verify transaction created
    tx = Transaction.objects.get(id=response.data["id"])
    assert tx.amount == Decimal("50.00")

    # Verify debt tickets created
    debts = Debt.objects.filter(origin_transaction=tx)
    assert debts.count() == 2
    
    alice_debt = debts.get(counterparty_name="Alice")
    assert alice_debt.original_amount == Decimal("20.00")
    assert alice_debt.origin_category == category
    assert alice_debt.is_mine is True

    bob_debt = debts.get(counterparty_name="Bob")
    assert bob_debt.original_amount == Decimal("30.00")


@pytest.mark.django_db
def test_debt_payment_lifecycle():
    # Setup user
    user = User.objects.create_user(username="testuser", password="password")
    client = APIClient()
    client.force_authenticate(user=user)

    account = Account.objects.create(user=user, name="Checking", balance=Decimal("1000.00"), currency="EUR")
    
    # Create manual debt ticket
    debt = Debt.objects.create(
        user=user,
        counterparty_name="Charlie",
        original_amount=Decimal("100.00"),
        currency="EUR",
        is_mine=True,
        notes="Loan for concert tickets"
    )

    # Verify initial debt state via API
    response = client.get(f"/api/debts/{debt.id}/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["amount_remaining"] == 100.00
    assert response.data["amount_paid"] == 0.00

    # Pay the debt
    pay_payload = {
        "debt": debt.id,
        "amount": "40.00",
        "date": date.today().strftime("%Y-%m-%d"),
        "account": account.id
    }
    pay_res = client.post("/api/debt-payments/", pay_payload, format="json")
    assert pay_res.status_code == status.HTTP_201_CREATED

    # Verify debt remaining amount updated
    response = client.get(f"/api/debts/{debt.id}/")
    assert response.data["amount_remaining"] == 60.00
    assert response.data["amount_paid"] == 40.00

    # Verify linked transaction created automatically
    payment = DebtPayment.objects.get(id=pay_res.data["id"])
    assert payment.transaction is not None
    assert payment.transaction.amount == Decimal("40.00")
    assert payment.transaction.is_income is True # Charlie paid us back, so it is an income!
