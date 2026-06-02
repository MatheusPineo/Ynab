import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from .models import Account, Category, Transaction, CreditCard, CreditCardTransaction

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    user = User.objects.create_user(username="testuser_reports", email="reports@test.com", password="password")
    return user

@pytest.mark.django_db
def test_monthly_cashflow_empty(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    response = api_client.get(reverse('reports-monthly-cashflow'), {'month': 5, 'year': 2026})
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.django_db
def test_monthly_cashflow_math(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    account = Account.objects.create(user=test_user, name="Corrente", account_type="checking", balance=0)
    
    # Entradas no dia 1
    Transaction.objects.create(
        account=account, amount=Decimal('100.50'), date=date(2026, 5, 1),
        is_income=True, status='realized'
    )
    # Saídas no dia 1
    Transaction.objects.create(
        account=account, amount=Decimal('20.00'), date=date(2026, 5, 1),
        is_income=False, status='realized'
    )
    
    response = api_client.get(reverse('reports-monthly-cashflow'), {'month': 5, 'year': 2026})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['name'] == '01/05'
    assert data[0]['Entradas'] == 100.50
    assert data[0]['Saídas'] == 20.00

@pytest.mark.django_db
def test_expenses_by_category_empty(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    response = api_client.get(reverse('reports-expenses-by-category'), {'month': 5, 'year': 2026})
    assert response.status_code == 200
    assert response.json() == {"chartData": [], "total": 0, "highSpendAlerts": []}

@pytest.mark.django_db
def test_expenses_by_category_math(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    account = Account.objects.create(user=test_user, name="Corrente", account_type="checking", balance=0)
    cat_food = Category.objects.create(user=test_user, name="Food")
    cat_rent = Category.objects.create(user=test_user, name="Rent")
    
    Transaction.objects.create(
        account=account, category=cat_food, amount=Decimal('30.00'), 
        date=date(2026, 5, 10), is_income=False, status='realized'
    )
    Transaction.objects.create(
        account=account, category=cat_rent, amount=Decimal('70.00'), 
        date=date(2026, 5, 10), is_income=False, status='realized'
    )
    
    response = api_client.get(reverse('reports-expenses-by-category'), {'month': 5, 'year': 2026})
    assert response.status_code == 200
    data = response.json()
    assert data['total'] == 100.00
    assert len(data['chartData']) == 2
    
    # Verifica ordem
    assert data['chartData'][0]['name'] == 'Rent'
    assert data['chartData'][0]['value'] == 70.00
    assert data['chartData'][0]['percent'] == '70.0%'
    
    assert data['chartData'][1]['name'] == 'Food'
    assert data['chartData'][1]['value'] == 30.00
    assert data['chartData'][1]['percent'] == '30.0%'
    
    assert 'Rent' in data['highSpendAlerts']

@pytest.mark.django_db
def test_net_worth_evolution(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    
    # Saldo atual = 1000 Ativo, -200 Cartao
    account = Account.objects.create(user=test_user, name="Corrente", account_type="checking", balance=1000)
    card = Account.objects.create(user=test_user, name="Nubank", account_type="credit_card", balance=-200)
    
    # Transação no mês ATUAL (muda saldo de trás pra frente)
    # Ex: no mês passado o saldo devia ser 900 (porque teve entrada de 100 hoje)
    Transaction.objects.create(
        account=account, amount=Decimal('100.00'), 
        date=date.today(), is_income=True, status='realized', is_applied_to_balance=True
    )
    
    response = api_client.get(reverse('reports-net-worth-evolution'), {'months': 2})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # O mês atual (índice 1) deve refletir o saldo bruto total: 1100 de ativo, 200 de passivo
    current_month = data[-1]
    assert current_month['Ativos'] == 1100.0
    assert current_month['Passivos'] == 200.0
    assert current_month['Patrimônio Líquido'] == 900.0

    # O mês passado (índice 0) tinha 100 a menos de entrada (foi no mês atual), então ativos eram 1000
    prev_month = data[-2]
    assert prev_month['Ativos'] == 1000.0
    assert prev_month['Passivos'] == 200.0
    assert prev_month['Patrimônio Líquido'] == 800.0

@pytest.mark.django_db
def test_credit_card_usage_empty(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    response = api_client.get(reverse('reports-credit-card-usage'), {'month': 5, 'year': 2026})
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.django_db
def test_credit_card_usage_math(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    card_acc = Account.objects.create(user=test_user, name="Visa", account_type="credit_card", balance=0)
    exp_acc, _ = Account.objects.get_or_create(user=test_user, name="Expense", account_type="expense", balance=0)
    config = CreditCard.objects.create(account=card_acc, credit_limit=1000, closing_day=1, due_day=10)

    CreditCardTransaction.objects.create(
        credit_card=config, description="Compra 1", date=date(2026, 5, 5, expense_account=exp_acc), expense_account=exp_acc,
        total_amount=Decimal('45.00'), original_amount=Decimal('45.00'), installment_count=1, original_currency='BRL'
    )
    CreditCardTransaction.objects.create(
        credit_card=config, description="Compra 2", date=date(2026, 5, 10, expense_account=exp_acc), expense_account=exp_acc,
        total_amount=Decimal('55.00'), original_amount=Decimal('55.00'), installment_count=1, original_currency='BRL'
    )
    
    response = api_client.get(reverse('reports-credit-card-usage'), {'month': 5, 'year': 2026})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['card_name'] == 'Visa'
    assert data[0]['total_spent'] == 100.00
