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
    
    # Recarrega do banco. O saldo do envelope de despesas deve continuar Decimal('1000.00')
    # porque a transação é criada como 'pending' com is_applied_to_balance=False
    expense_env.refresh_from_db()
    assert expense_env.balance == Decimal('1000.00')
    
    # O saldo da conta do cartão de crédito deve ter reduzido em 200
    cc.account.refresh_from_db()
    assert cc.account.balance == Decimal('-200.00')

@pytest.mark.django_db
def test_cc_portuguese_regional_bypass(base_data):
    user, cc, cat = base_data
    
    # Define o cartão como emitido em Portugal (PT)
    cc.country_of_issue = 'PT'
    cc.save()
    
    tx_date = date(2026, 5, 10)
    
    # Tenta lançar uma compra parcelada em 3x
    matrix_tx, installments = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Compra em Portugal',
        date_tx=tx_date,
        total_amount=Decimal('300.00'),
        category_id=cat.id,
        installment_count=3
    )
    
    # A nossa lógica regional (bypass) deve forçar a transação a ter apenas 1 parcela
    assert len(installments) == 1
    assert installments[0].amount == Decimal('300.00')
    assert matrix_tx.installment_count == 1


@pytest.mark.django_db
def test_pay_bill_itemized(base_data):
    user, cc, cat = base_data
    parent_acc = cc.account.parent
    
    expense_env = Account.objects.create(
        user=user, name='Eletrônicos', currency='BRL', parent=parent_acc, balance=Decimal('1000.00')
    )
    
    # Processa transação
    matrix_tx, installments = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Teclado Mecânico',
        date_tx=date(date.today().year, date.today().month, 10),
        total_amount=Decimal('400.00'),
        category_id=cat.id,
        installment_count=2
    )
    
    # Verifica reservas iniciais
    expense_env.refresh_from_db()
    assert expense_env.reserved_credit_balance == Decimal('400.00')
    assert expense_env.balance == Decimal('1000.00')
    
    bill = installments[0].bill
    
    # Paga a primeira parcela no modo ITEMIZED
    from finance.services import pay_bill
    pay_bill(
        bill_id=bill.id,
        payment_mode='ITEMIZED',
        payload_data={'installment_ids': [installments[0].id]},
        payment_account_id=parent_acc.id
    )
    
    # Valida desconto do saldo real e reservado no envelope de despesas
    expense_env.refresh_from_db()
    assert expense_env.balance == Decimal('800.00') # 1000 - 200
    assert expense_env.reserved_credit_balance == Decimal('200.00') # 400 - 200
    
    # Valida saldo da conta mestre (checking) descontado
    parent_acc.refresh_from_db()
    assert parent_acc.balance == Decimal('800.00') # 1000 - 200 (total_paid)
    
    # Primeira parcela deve estar paga, segunda pendente
    installments[0].refresh_from_db()
    installments[1].refresh_from_db()
    assert installments[0].status == 'paid'
    assert installments[1].status == 'pending'


@pytest.mark.django_db
def test_pay_bill_fifo_partial_split(base_data):
    user, cc, cat = base_data
    parent_acc = cc.account.parent
    
    expense_env = Account.objects.create(
        user=user, name='Eletrônicos', currency='BRL', parent=parent_acc, balance=Decimal('500.00')
    )
    
    # Processa duas transações de 1 parcela cada na mesma fatura (Maio 2026)
    matrix_tx1, installments1 = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Teclado',
        date_tx=date(2026, 5, 10),
        total_amount=Decimal('100.00'),
        category_id=cat.id,
        installment_count=1
    )
    matrix_tx2, installments2 = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Mouse',
        date_tx=date(2026, 5, 11),
        total_amount=Decimal('100.00'),
        category_id=cat.id,
        installment_count=1
    )
    
    bill = installments1[0].bill
    
    # Paga 150 no modo FIFO. O primeiro (100) deve ser totalmente pago.
    # O segundo (100) deve ser dividido em 50 pago e 50 empurrado para a próxima fatura.
    from finance.services import pay_bill
    total_paid = pay_bill(
        bill_id=bill.id,
        payment_mode='FIFO',
        payload_data={'amount': Decimal('150.00')},
        payment_account_id=parent_acc.id
    )
    
    assert total_paid == Decimal('150.00')
    
    # Verifica saldos do envelope
    expense_env.refresh_from_db()
    assert expense_env.balance == Decimal('350.00') # 500 - 150
    assert expense_env.reserved_credit_balance == Decimal('50.00') # 200 - 150
    
    # Verifica as parcelas do mês atual
    inst1 = installments1[0]
    inst1.refresh_from_db()
    assert inst1.status == 'paid'
    assert inst1.amount == Decimal('100.00')
    
    inst2 = installments2[0]
    inst2.refresh_from_db()
    assert inst2.status == 'paid'
    assert inst2.amount == Decimal('50.00')
    
    # Uma parcela residual deve ter sido gerada na fatura seguinte (Junho)
    residual = Installment.objects.get(
        transaction=matrix_tx2,
        bill__month=6,
        bill__year=2026,
        status='pending',
        amount=Decimal('50.00')
    )
    assert residual is not None


@pytest.mark.django_db
def test_pay_bill_percentage(base_data):
    user, cc, cat = base_data
    parent_acc = cc.account.parent
    
    expense_env = Account.objects.create(
        user=user, name='Eletrônicos', currency='BRL', parent=parent_acc, balance=Decimal('500.00')
    )
    
    # Processa duas transações de 1 parcela na mesma fatura
    matrix_tx1, installments1 = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Cabo HDMI',
        date_tx=date(2026, 5, 10),
        total_amount=Decimal('100.00'),
        category_id=cat.id,
        installment_count=1
    )
    matrix_tx2, installments2 = process_credit_card_transaction(
        credit_card_id=cc.id,
        description='Adaptador',
        date_tx=date(2026, 5, 11),
        total_amount=Decimal('100.00'),
        category_id=cat.id,
        installment_count=1
    )
    
    bill = installments1[0].bill
    
    # Paga 25% (fator 0.25) das parcelas da fatura
    from finance.services import pay_bill
    total_paid = pay_bill(
        bill_id=bill.id,
        payment_mode='PERCENTAGE',
        payload_data={'percentage': Decimal('0.25')},
        payment_account_id=parent_acc.id
    )
    
    # Cada uma das 2 parcelas de 100 deve pagar 25 (total 50)
    assert total_paid == Decimal('50.00')
    
    # Verifica saldos
    expense_env.refresh_from_db()
    assert expense_env.balance == Decimal('450.00') # 500 - 50
    assert expense_env.reserved_credit_balance == Decimal('150.00') # 200 - 50
    
    # Verifica as parcelas do mês atual (devem ter sido reduzidas e marcadas como pagas)
    inst1 = installments1[0]
    inst1.refresh_from_db()
    assert inst1.status == 'paid'
    assert inst1.amount == Decimal('25.00')
    
    inst2 = installments2[0]
    inst2.refresh_from_db()
    assert inst2.status == 'paid'
    assert inst2.amount == Decimal('25.00')
        
    # E as parcelas residuais (75.00 cada) devem estar na fatura seguinte (Junho)
    res1 = Installment.objects.get(transaction=matrix_tx1, bill__month=6, bill__year=2026, status='pending')
    res2 = Installment.objects.get(transaction=matrix_tx2, bill__month=6, bill__year=2026, status='pending')
    assert res1.amount == Decimal('75.00')
    assert res2.amount == Decimal('75.00')
