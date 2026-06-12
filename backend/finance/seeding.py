from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction
from django.contrib.auth.models import User
from finance.models import (
    Category, Account, Transaction, Payee, 
    InvestmentAsset, InvestmentActivity
)

@transaction.atomic
def reset_user_data(user: User):
    """
    Deleta recursivamente todos os dados financeiros criados pelo usuário
    para retornar a um estado totalmente em branco (exceto o próprio usuário e perfil).
    """
    # Deletando contas exclui também transações em cascata (dependendo do on_delete)
    # Mas para segurança, forçamos as remoções principais:
    from finance.models import Goal, DistributionTemplate
    DistributionTemplate.objects.filter(user=user).delete()
    Goal.objects.filter(user=user).delete()
    Transaction.objects.filter(account__user=user).delete()
    
    Account.objects.filter(user=user).delete()
    Category.objects.filter(user=user).delete()
    Payee.objects.filter(user=user).delete()
    InvestmentAsset.objects.filter(user=user).delete()
    # Chama o seed de categorias para restaurar a taxonomia padrão limpa
    seed_default_categories(user)

@transaction.atomic
def seed_default_categories(user: User):
    """
    Cria a taxonomia de categorias padrão YNAB para um usuário novo.
    """
    # Se já existirem categorias para esse usuário, ignora para não duplicar.
    if Category.objects.filter(user=user).exists():
        return

    default_structure = {
        "Habitação": ["Aluguel / Condomínio", "Água e Esgoto", "Energia Elétrica", "Internet / Celular", "Manutenção e Reparos"],
        "Alimentação": ["Supermercado e Padaria", "Restaurantes e Delivery", "Lanches e Cafés"],
        "Transporte": ["Combustível", "Uber / Táxi", "Transporte Público", "Manutenção e IPVA"],
        "Saúde": ["Plano de Saúde", "Farmácia", "Consultas e Exames", "Academia e Bem-estar"],
        "Lazer e Estilo de Vida": ["Assinaturas (Netflix, Spotify)", "Cinema e Saídas", "Hobbies e Pets"],
        "Educação": ["Faculdade / Escola", "Cursos e Livros"],
        "Prioridades Fiscais": ["Impostos e Taxas"],
        "Metas e Reservas": ["Reserva de Emergência", "Férias e Viagens"]
    }

    for group_name, categories in default_structure.items():
        # Cria a categoria PAI (Grupo)
        group = Category.objects.create(user=user, name=group_name, parent=None)
        
        # Cria as categorias FILHAS
        for cat_name in categories:
            Category.objects.create(user=user, name=cat_name, parent=group)

@transaction.atomic
def seed_demo_environment(user: User):
    """
    Gera um ambiente rico e interativo com dados fictícios
    para permitir que o usuário experimente os recursos da plataforma.
    """
    # 1. Limpar os dados atuais para evitar sujeira na recriação
    reset_user_data(user)
    
    # Garantir que categorias existem
    seed_default_categories(user)

    # 2. Criar Contas Bancárias (On-Budget)
    checking_account = Account.objects.create(
        user=user,
        name="Conta Corrente Principal",
        type="checking",
        balance=Decimal("4500.00"),
        is_on_budget=True,
        currency="BRL",
        icon_url="Bank"
    )

    savings_account = Account.objects.create(
        user=user,
        name="Poupança Itaú",
        type="savings",
        balance=Decimal("15000.00"),
        is_on_budget=True,
        currency="BRL",
        icon_url="PiggyBank"
    )

    # 3. Criar Cartão de Crédito
    credit_card = Account.objects.create(
        user=user,
        name="Cartão Nubank Ultravioleta",
        type="credit_card",
        balance=Decimal("-1250.50"), # Fatura devendo
        is_on_budget=True,
        currency="BRL",
        icon_url="CreditCard",
        closing_day=10,
        due_day=20,
        credit_limit=Decimal("8000.00")
    )

    # 4. Adicionar Algumas Transações Históricas (Backtracking para gráficos)
    today = date.today()
    supermercado_cat = Category.objects.filter(user=user, name="Supermercado e Padaria").first()
    luz_cat = Category.objects.filter(user=user, name="Energia Elétrica").first()
    salario_cat = None # Receitas não precisam de categoria (ou usam none logic no backend)
    restaurante_cat = Category.objects.filter(user=user, name="Restaurantes e Delivery").first()
    assinatura_cat = Category.objects.filter(user=user, name="Assinaturas (Netflix, Spotify)").first()

    payee_acme = Payee.objects.create(user=user, name="ACME Corp (Salário)")
    payee_pao = Payee.objects.create(user=user, name="Pão de Açúcar")
    payee_enel = Payee.objects.create(user=user, name="Enel")
    payee_ifood = Payee.objects.create(user=user, name="iFood")
    payee_netflix = Payee.objects.create(user=user, name="Netflix")

    # Mês atual: Salário e Gastos
    Transaction.objects.create(
        user=user, account=checking_account, payee=payee_acme, category=salario_cat,
        amount=Decimal("8500.00"), date=today.replace(day=5), is_income=True,
        description="Salário Mensal", status="realized", is_applied_to_balance=True
    )
    Transaction.objects.create(
        user=user, account=checking_account, payee=payee_enel, category=luz_cat,
        amount=Decimal("185.30"), date=today - timedelta(days=2), is_income=False,
        description="Conta de Luz", status="realized", is_applied_to_balance=True
    )
    Transaction.objects.create(
        user=user, account=credit_card, payee=payee_pao, category=supermercado_cat,
        amount=Decimal("450.00"), date=today - timedelta(days=5), is_income=False,
        description="Compra do mês", status="realized", is_applied_to_balance=True
    )
    Transaction.objects.create(
        user=user, account=credit_card, payee=payee_ifood, category=restaurante_cat,
        amount=Decimal("85.90"), date=today - timedelta(days=1), is_income=False,
        description="Jantar", status="realized", is_applied_to_balance=True
    )
    Transaction.objects.create(
        user=user, account=credit_card, payee=payee_netflix, category=assinatura_cat,
        amount=Decimal("39.90"), date=today - timedelta(days=10), is_income=False,
        description="Assinatura", status="realized", is_applied_to_balance=True
    )

    # Mês Anterior (Backtracking)
    last_month_date = today.replace(day=1) - timedelta(days=15)
    Transaction.objects.create(
        user=user, account=checking_account, payee=payee_acme, category=salario_cat,
        amount=Decimal("8500.00"), date=last_month_date.replace(day=5), is_income=True,
        description="Salário Mensal", status="realized", is_applied_to_balance=True
    )
    Transaction.objects.create(
        user=user, account=credit_card, payee=payee_pao, category=supermercado_cat,
        amount=Decimal("620.00"), date=last_month_date, is_income=False,
        description="Compra grande", status="realized", is_applied_to_balance=True
    )

    # 5. Adicionar Ativos de Investimentos (Mocked Wealth)
    asset_nvda = InvestmentAsset.objects.create(
        user=user, ticker="NVDA", name="NVIDIA Corp",
        market_country="US", asset_category="STOCK", currency="USD"
    )
    InvestmentActivity.objects.create(
        user=user, asset=asset_nvda, activity_type="BUY",
        date=today - timedelta(days=60), quantity=Decimal("10"), unit_price=Decimal("115.00"),
        total_amount=Decimal("1150.00")
    )

    asset_tesouro = InvestmentAsset.objects.create(
        user=user, ticker="TD-SELIC", name="Tesouro Selic 2029",
        market_country="BR", asset_category="TREASURY", currency="BRL",
        due_date=date(2029, 3, 1)
    )
    InvestmentActivity.objects.create(
        user=user, asset=asset_tesouro, activity_type="BUY",
        date=today - timedelta(days=120), quantity=Decimal("1"), unit_price=Decimal("14500.00"),
        total_amount=Decimal("14500.00")
    )
