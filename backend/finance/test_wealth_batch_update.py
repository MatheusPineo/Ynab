import pytest
from decimal import Decimal
from datetime import date
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from finance.models import InvestmentAsset, InvestmentActivity
from finance.services import NetWorthCalculator

@pytest.mark.django_db
def test_simplified_yield_calculation():
    # Setup do usuário e ativo
    user = User.objects.create_user(username="testuser", password="password")
    asset = InvestmentAsset.objects.create(
        user=user,
        ticker="VALE3",
        name="Vale S.A.",
        asset_type="STOCK",
        macro_category="Ações"
    )
    
    # 1. Cria atividade BUY
    InvestmentActivity.objects.create(
        asset=asset,
        activity_type="BUY",
        date=date(2026, 1, 1),
        quantity=Decimal("100"),
        unit_price=Decimal("70.00"),
        principal_amount=Decimal("7000.00")
    )
    
    # 2. Cria atividade YIELD (rendimento manual)
    InvestmentActivity.objects.create(
        asset=asset,
        activity_type="YIELD",
        date=date(2026, 2, 1),
        quantity=Decimal("0.00000000"),
        unit_price=Decimal("0.00"),
        principal_amount=Decimal("500.00")
    )
    
    # 3. Cria atividade SELL
    InvestmentActivity.objects.create(
        asset=asset,
        activity_type="SELL",
        date=date(2026, 3, 1),
        quantity=Decimal("50"),
        unit_price=Decimal("80.00"),
        principal_amount=Decimal("4000.00")
    )
    
    # O valor bruto final deve ser: 7000 (BUY) - 4000 (SELL) + 500 (YIELD) = 3500
    holdings = NetWorthCalculator.calculate_holdings(user)
    assert len(holdings) == 1
    holding = holdings[0]
    
    assert holding["quantity"] == Decimal("50")
    assert holding["gross_value"] == Decimal("3500.00")
    assert holding["net_value"] == Decimal("3500.00")
    assert holding["macro_category"] == "Ações"


@pytest.mark.django_db
def test_batch_update_endpoint():
    user = User.objects.create_user(username="testuser2", password="password")
    asset = InvestmentAsset.objects.create(
        user=user,
        ticker="PETR4",
        name="Petrobras S.A.",
        asset_type="STOCK"
    )
    
    # Saldo inicial = 1000
    InvestmentActivity.objects.create(
        asset=asset,
        activity_type="BUY",
        date=date(2026, 1, 1),
        quantity=Decimal("10"),
        unit_price=Decimal("100.00"),
        principal_amount=Decimal("1000.00")
    )
    
    client = APIClient()
    client.force_authenticate(user=user)
    
    # Enviar saldo declarado = 1200 (deve criar YIELD de +200)
    response = client.post("/api/wealth/batch-update/", [{
        "asset_id": asset.id,
        "declared_balance": 1200.00
    }], format="json")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["updated_assets"]) == 1
    assert data["updated_assets"][0]["adjustment_created"] == 200.0
    
    # Verifica no banco se a atividade YIELD foi criada
    yields = InvestmentActivity.objects.filter(asset=asset, activity_type="YIELD")
    assert yields.count() == 1
    assert yields.first().principal_amount == Decimal("200.00")
