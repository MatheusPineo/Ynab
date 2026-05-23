import pytest
from decimal import Decimal
from datetime import date, datetime
from django.contrib.auth.models import User
from finance.models import Account, Category, Payee, MonthlyBudget, Transaction, CategoryGoal, TransactionRule
from finance.services import YNABGoalService, TransactionRulesService

@pytest.mark.django_db
class TestCategoryGoals:
    
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.user = User.objects.create_user(username='ynab_tester', password='password123')
        self.account = Account.objects.create(
            user=self.user,
            name='Carteira',
            account_type='checking',
            balance=Decimal('1000.00'),
            exclude_from_totals=False
        )
        self.parent_category = Category.objects.create(
            user=self.user,
            name='Necessidades Diárias'
        )
        self.category = Category.objects.create(
            user=self.user,
            name='Alimentação',
            parent=self.parent_category
        )

    def test_target_savings_builder(self):
        """
        Garante que a meta Target Savings Builder exige exatamente o valor mensal fixo.
        """
        goal = CategoryGoal.objects.create(
            category=self.category,
            goal_type='target_builder',
            amount=Decimal('150.00'),
            frequency='monthly'
        )

        # 1. Sem nada alocado no mês
        underfunded = YNABGoalService.calculate_underfunded(
            category=self.category,
            month=5,
            year=2026,
            available_balance=Decimal('0.00'),
            assigned_amount=Decimal('0.00')
        )
        assert underfunded == Decimal('150.00')

        # 2. Alocado parcialmente
        underfunded = YNABGoalService.calculate_underfunded(
            category=self.category,
            month=5,
            year=2026,
            available_balance=Decimal('50.00'),
            assigned_amount=Decimal('50.00')
        )
        assert underfunded == Decimal('100.00')

        # 3. Alocado totalmente
        underfunded = YNABGoalService.calculate_underfunded(
            category=self.category,
            month=5,
            year=2026,
            available_balance=Decimal('150.00'),
            assigned_amount=Decimal('150.00')
        )
        assert underfunded == Decimal('0.00')

    def test_needed_spending_date(self):
        """
        Valida o cálculo amortizado Needed for Spending com Data Alvo.
        Se faltam R$ 300,00 e restam 3 meses (incluindo o atual), o aporte deve ser R$ 100,00.
        """
        # Meta de R$ 300,00 para Julho de 2026 (07/2026)
        goal = CategoryGoal.objects.create(
            category=self.category,
            goal_type='needed_spending_date',
            amount=Decimal('300.00'),
            target_date=date(2026, 7, 15)
        )

        # 1. Mês de referência: Maio de 2026 (05/2026).
        # Meses restantes: Maio, Junho, Julho = 3 meses. Divisor = 3.
        # Saldo disponível acumulado = R$ 0.00.
        # Necessidade mensal: 300 / 3 = 100.00.
        underfunded = YNABGoalService.calculate_underfunded(
            category=self.category,
            month=5,
            year=2026,
            available_balance=Decimal('0.00'),
            assigned_amount=Decimal('0.00')
        )
        assert underfunded == Decimal('100.00')

        # 2. Alocado R$ 40,00 neste mês
        underfunded = YNABGoalService.calculate_underfunded(
            category=self.category,
            month=5,
            year=2026,
            available_balance=Decimal('40.00'),
            assigned_amount=Decimal('40.00')
        )
        assert underfunded == Decimal('46.67')

        # 3. Saldo disponível acumulado = R$ 150,00.
        # Necessidade restante: 300 - 150 = 150. Divisor = 3. Aporte = 50.00.
        underfunded = YNABGoalService.calculate_underfunded(
            category=self.category,
            month=5,
            year=2026,
            available_balance=Decimal('150.00'),
            assigned_amount=Decimal('0.00')
        )
        assert underfunded == Decimal('50.00')

    def test_needed_spending_freq_weekly(self):
        """
        Valida a meta Needed for Spending com frequência semanal.
        """
        goal = CategoryGoal.objects.create(
            category=self.category,
            goal_type='needed_spending_freq',
            amount=Decimal('20.00'),
            frequency='weekly'
        )
        
        import calendar
        weekday = goal.created_at.weekday() if goal.created_at else 0
        cal = calendar.Calendar()
        occurrences = sum(1 for d in cal.itermonthdays2(2026, 5) if d[0] > 0 and d[1] == weekday)
        expected = Decimal('20.00') * Decimal(str(occurrences))

        underfunded = YNABGoalService.calculate_underfunded(
            category=self.category,
            month=5,
            year=2026,
            available_balance=Decimal('0.00'),
            assigned_amount=Decimal('0.00')
        )
        assert underfunded == expected


@pytest.mark.django_db
class TestScheduledTransactions:
    
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.user = User.objects.create_user(username='ynab_tester2', password='password123')
        self.account = Account.objects.create(
            user=self.user,
            name='Banco Central',
            account_type='checking',
            balance=Decimal('1500.00')
        )

    def test_scheduled_dont_affect_account_balance(self):
        """
        Garante que transações com status 'scheduled' não afetam o saldo real da conta.
        """
        tx = Transaction.objects.create(
            account=self.account,
            amount=Decimal('350.00'),
            description='Mensalidade Virtual Agendada',
            date=date(2026, 6, 1),
            is_income=False,
            status='scheduled'
        )
        
        # O saldo da conta deve permanecer intacto
        self.account.refresh_from_db()
        assert self.account.balance == Decimal('1500.00')
        
        # A transação não deve ter sido aplicada ao saldo
        tx.refresh_from_db()
        assert not tx.is_applied_to_balance

        # Ao mudar para 'realized', o saldo da conta deve ser decrementado
        tx.status = 'realized'
        tx.save()

        self.account.refresh_from_db()
        assert self.account.balance == Decimal('1150.00')
        
        tx.refresh_from_db()
        assert tx.is_applied_to_balance

        # Ao deletar a transação realizada, o saldo deve ser restabelecido
        tx.delete()
        self.account.refresh_from_db()
        assert self.account.balance == Decimal('1500.00')


@pytest.mark.django_db
class TestTransactionRulesEngine:
    
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.user = User.objects.create_user(username='ynab_tester3', password='password123')
        self.account = Account.objects.create(
            user=self.user,
            name='Checking Acc',
            account_type='checking',
            balance=Decimal('2000.00')
        )
        self.category = Category.objects.create(
            user=self.user,
            name='Transporte'
        )
        self.payee = Payee.objects.create(
            user=self.user,
            name='Uber'
        )

    def test_auto_categorization_and_payee_mapping(self):
        """
        Valida que a criação de uma transação aciona o motor de regras contábeis síncronamente
        e auto-categoriza o lançamento com base na descrição.
        """
        # Cria uma regra: se a descrição contiver 'uber', define payee_id e category_id
        rule = TransactionRule.objects.create(
            user=self.user,
            name='Regra Uber',
            stage='pre',
            conditions_op='and',
            conditions=[{
                'field': 'description',
                'op': 'contains',
                'value': 'uber'
            }],
            actions=[
                {
                    'op': 'set',
                    'field': 'payee_id',
                    'value': self.payee.id
                },
                {
                    'op': 'set',
                    'field': 'category_id',
                    'value': self.category.id
                }
            ]
        )

        # Salva uma transação sem Payee nem Categoria definidos, contendo 'uber' na descrição
        tx = Transaction.objects.create(
            account=self.account,
            amount=Decimal('28.50'),
            description='PG *UBER TRIP HELP',
            date=date.today(),
            is_income=False,
            status='realized'
        )

        # A transação deve ter sido interceptada e auto-categorizada no momento do save!
        tx.refresh_from_db()
        assert tx.payee_id == self.payee.id
        assert tx.category_id == self.category.id
        assert tx.description == 'PG *UBER TRIP HELP'
