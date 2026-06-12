import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from decimal import Decimal
from finance.models import Asset, Account, Transaction
from datetime import date, timedelta

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user(db):
    return User.objects.create_user(username="testuser", password="password123")

@pytest.fixture
def auth_client(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    return api_client

@pytest.mark.django_db
def test_create_asset(auth_client, test_user):
    url = reverse('asset-list')
    data = {
        "name": "Apartamento na Praia",
        "purchase_value": "150000.00",
        "current_market_value": "180000.00",
        "liquidity_tier": "ILLIQUID"
    }
    response = auth_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data['name'] == "Apartamento na Praia"
    assert response.data['effective_asset_value'] == 180000.00



@pytest.mark.django_db
def test_asset_runway_calculation(auth_client, test_user):
    # Criar ativos com liquidez e sem liquidez
    Asset.objects.create(
        user=test_user,
        name="Reserva Imediata",
        purchase_value=Decimal('10000.00'),
        current_market_value=Decimal('10000.00'),
        liquidity_tier="IMMEDIATE"
    )

    Asset.objects.create(
        user=test_user,
        name="Ações de Média Liquidez",
        purchase_value=Decimal('15000.00'),
        current_market_value=Decimal('15000.00'),
        liquidity_tier="MEDIUM"
    )

    Asset.objects.create(
        user=test_user,
        name="Terreno Ilíquido",
        purchase_value=Decimal('50000.00'),
        current_market_value=Decimal('50000.00'),
        liquidity_tier="ILLIQUID"
    )

    # Criar conta para transações
    account = Account.objects.create(
        user=test_user,
        name="Conta Principal",
        account_type="checking",
        balance=Decimal('5000.00')
    )

    # Criar despesas nos últimos 90 dias
    # Média mensal esperada baseada em 3 meses: Total despesas / 3
    # Vamos gerar R$ 6000 de despesas totais nos últimos 90 dias -> R$ 2000 por mês
    Transaction.objects.create(
        account=account,
        amount=Decimal('3000.00'),
        date=date.today() - timedelta(days=10),
        is_income=False,
        status='realized',
        is_applied_to_balance=True
    )
    Transaction.objects.create(
        account=account,
        amount=Decimal('3000.00'),
        date=date.today() - timedelta(days=40),
        is_income=False,
        status='realized',
        is_applied_to_balance=True
    )

    url = reverse('asset-runway')
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    
    # Ativos líquidos: 10000 + 15000 = 25000
    # Despesa mensal média: 6000 / 3 = 2000
    # Runway: 25000 / 2000 = 12.5 meses
    assert response.data['total_liquid_assets'] == 25000.00
    assert response.data['average_monthly_expenses'] == 2000.00
    assert response.data['runway_months'] == 12.5
