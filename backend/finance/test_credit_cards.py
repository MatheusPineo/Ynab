import pytest
from datetime import date
from decimal import Decimal
from django.contrib.auth.models import User
from finance.models import Account, Category, CreditCard, CreditCardBill, CreditCardTransaction, Installment
from finance.services import process_credit_card_transaction, process_installment_ynab

@pytest.fixture
def base_data(db):
    user = User.objects.create_user(username='tester_cc', password='pw')
    parent_acc = Account.objects.create(
        user=user, name='Conta Mestre', account_type='checking', balance=Decimal('1000.00'), currency='BRL'
    )
    cc_acc = Account.objects.create(
        user=user, name='Cartão Black', account_type='credit_card', balance=Decimal('0.00'), currency='BRL', parent=parent_acc
    )
    cc = CreditCard.objects.create(
        account=cc_acc, closing_day=20, due_day=28, credit_limit=Decimal('10000.00')
    )
    cat = Category.objects.create(user=user, name='Eletrônicos')
    return user, cc, cat

@pytest.mark.django_db
def test_cc_transaction_before_closing(base_data):
    user, cc, cat = base_data
    tx_date = date(2026, 5, 10) # Antes do fechamento (dia 20)
    
    matrix_tx, installments = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Smartwatch',
        date_tx=tx_date,
        total_amount=Decimal('500.00'),
        category_id=cat.id,
        installment_count=1
    )
    
    assert len(installments) == 1
    inst = installments[0]
    assert inst.bill.month == 5
    assert inst.bill.year == 2026
    assert inst.amount == Decimal('500.00')

@pytest.mark.django_db
def test_cc_transaction_after_closing(base_data):
    user, cc, cat = base_data
    tx_date = date(2026, 5, 22) # Após o fechamento (dia 20), vai para junho (6)
    
    matrix_tx, installments = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Notebook',
        date_tx=tx_date,
        total_amount=Decimal('3000.00'),
        category_id=cat.id,
        installment_count=3
    )
    
    assert len(installments) == 3
    assert installments[0].bill.month == 6
    assert installments[1].bill.month == 7
    assert installments[2].bill.month == 8
    for inst in installments:
        assert inst.amount == Decimal('1000.00')

@pytest.mark.django_db
def test_cc_ynab_integration(base_data):
    user, cc, cat = base_data
    
    # Cria o envelope de despesa com saldo inicial
    parent_acc = cc.account.parent
    expense_env = Account.objects.create(
        user=user, name='Eletrônicos', currency='BRL', parent=parent_acc, balance=Decimal('1000.00')
    )
    
    tx_date = date(date.today().year, date.today().month, 5) # Mesmo mês atual para ser posted
    
    matrix_tx, installments = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Fone de Ouvido',
        date_tx=tx_date,
        total_amount=Decimal('200.00'),
        category_id=cat.id,
        installment_count=1
    )
    
    # Recarrega do banco
    expense_env.refresh_from_db()
    assert expense_env.balance == Decimal('800.00') # Deduziu 200
    
    payment_env = Account.objects.get(user=user, name=f"Pagamento do Cartão {cc.account.name}", parent=parent_acc)
    assert payment_env.balance == Decimal('200.00') # Reservou 200
