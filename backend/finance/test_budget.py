from django.test import TestCase
from django.contrib.auth.models import User
from finance.models import Account, Category, Transaction, MonthlyBudget
from finance.services import YNABBudgetService
from decimal import Decimal
from datetime import date

class YNABBudgetEngineTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='budgetuser', password='testpassword')
        
        # Contas On-budget (Checking e Credit)
        self.checking = Account.objects.create(
            user=self.user,
            name='Conta Corrente',
            account_type='checking',
            balance=Decimal('1000.00')
        )
        self.credit_card = Account.objects.create(
            user=self.user,
            name='Cartão de Crédito',
            account_type='credit_card',
            balance=Decimal('0.00')
        )
        
        # Categorias
        self.parent_cat = Category.objects.create(user=self.user, name='Estilo de Vida')
        self.food_cat = Category.objects.create(user=self.user, name='Alimentação', parent=self.parent_cat)
        self.leisure_cat = Category.objects.create(user=self.user, name='Lazer', parent=self.parent_cat)

    def test_envelope_positive_rollover(self):
        """
        Mês 1: Aloca 100, gasta 40 -> Sobra 60.
        Mês 2: Aloca 50, gasta 0 -> Disponível deve ser 110 (60 rollover + 50 alocado).
        """
        # Mês 1 (Maio de 2026)
        MonthlyBudget.objects.create(
            category=self.food_cat,
            month=5,
            year=2026,
            amount=Decimal('100.00')
        )
        Transaction.objects.create(
            account=self.checking,
            category=self.food_cat,
            amount=Decimal('40.00'),
            date=date(2026, 5, 15),
            is_income=False,
            is_applied_to_balance=True
        )
        
        # Mês 2 (Junho de 2026)
        MonthlyBudget.objects.create(
            category=self.food_cat,
            month=6,
            year=2026,
            amount=Decimal('50.00')
        )
        
        # Executa o cálculo para o Mês 2
        state_m2 = YNABBudgetService.calculate_envelope_states(self.user, 6, 2026)
        
        food_state_m2 = state_m2['envelope_states'][self.food_cat.id]
        self.assertEqual(food_state_m2['rollover'], Decimal('60.00'))
        self.assertEqual(food_state_m2['assigned'], Decimal('50.00'))
        self.assertEqual(food_state_m2['spent'], Decimal('0.00'))
        self.assertEqual(food_state_m2['available'], Decimal('110.00'))
        self.assertIsNone(food_state_m2['overspending_type'])

    def test_cash_overspending_reduces_subsequent_rta(self):
        """
        Mês 1: Receita On-budget de 1000. Aloca 200 em Alimentação. Gasta 250 em dinheiro.
               Disponível = -50 (Cash Overspending).
        Mês 2: O envelope Alimentação começa em 0. O RTA do Mês 2 deve ser reduzido em 50.
               RTA M1 = 1000 (receita) - 200 (alocado) = 800.
               RTA M2 = RTA M1 (800) - CashOverspending M1 (50) = 750.
        """
        # Mês 1 (Maio de 2026)
        # Receita no RTA (sem categoria, is_income=True)
        Transaction.objects.create(
            account=self.checking,
            category=None,
            amount=Decimal('1000.00'),
            date=date(2026, 5, 1),
            is_income=True,
            is_applied_to_balance=True
        )
        
        MonthlyBudget.objects.create(
            category=self.food_cat,
            month=5,
            year=2026,
            amount=Decimal('200.00')
        )
        
        # Despesa em dinheiro (checking) que gera estouro
        Transaction.objects.create(
            account=self.checking,
            category=self.food_cat,
            amount=Decimal('250.00'),
            date=date(2026, 5, 10),
            is_income=False,
            is_applied_to_balance=True
        )
        
        # Executa o cálculo para o Mês 1
        state_m1 = YNABBudgetService.calculate_envelope_states(self.user, 5, 2026)
        self.assertEqual(state_m1['ready_to_assign'], Decimal('800.00'))
        self.assertEqual(state_m1['envelope_states'][self.food_cat.id]['available'], Decimal('-50.00'))
        self.assertEqual(state_m1['envelope_states'][self.food_cat.id]['overspending_type'], 'cash')
        
        # Executa o cálculo para o Mês 2 (Junho de 2026)
        state_m2 = YNABBudgetService.calculate_envelope_states(self.user, 6, 2026)
        self.assertEqual(state_m2['ready_to_assign'], Decimal('750.00'))
        # O envelope Alimentação no Mês 2 zera e não carrega o saldo negativo
        self.assertEqual(state_m2['envelope_states'][self.food_cat.id]['rollover'], Decimal('0.00'))
        self.assertEqual(state_m2['envelope_states'][self.food_cat.id]['available'], Decimal('0.00'))

    def test_credit_overspending_creates_debt_without_reducing_rta(self):
        """
        Mês 1: Receita On-budget de 1000. Aloca 100 em Alimentação. Gasta 150 no Cartão de Crédito.
               Disponível = -50 (Credit Overspending).
        Mês 2: O envelope Alimentação começa em 0. O RTA do Mês 2 NÃO deve ser reduzido (continua 900).
        """
        # Mês 1 (Maio de 2026)
        Transaction.objects.create(
            account=self.checking,
            category=None,
            amount=Decimal('1000.00'),
            date=date(2026, 5, 1),
            is_income=True,
            is_applied_to_balance=True
        )
        MonthlyBudget.objects.create(
            category=self.food_cat,
            month=5,
            year=2026,
            amount=Decimal('100.00')
        )
        
        # Despesa em cartão de crédito (credit) gerando estouro
        Transaction.objects.create(
            account=self.credit_card,
            category=self.food_cat,
            amount=Decimal('150.00'),
            date=date(2026, 5, 12),
            is_income=False,
            is_applied_to_balance=True
        )
        
        # Executa o cálculo para o Mês 1
        state_m1 = YNABBudgetService.calculate_envelope_states(self.user, 5, 2026)
        self.assertEqual(state_m1['ready_to_assign'], Decimal('900.00'))
        self.assertEqual(state_m1['envelope_states'][self.food_cat.id]['available'], Decimal('-50.00'))
        self.assertEqual(state_m1['envelope_states'][self.food_cat.id]['overspending_type'], 'credit')
        
        # Executa o cálculo para o Mês 2 (Junho de 2026)
        state_m2 = YNABBudgetService.calculate_envelope_states(self.user, 6, 2026)
        # O RTA não reduziu, continua sendo 900
        self.assertEqual(state_m2['ready_to_assign'], Decimal('900.00'))
        self.assertEqual(state_m2['envelope_states'][self.food_cat.id]['rollover'], Decimal('0.00'))

    def test_hybrid_split_overspending(self):
        """
        Mês 1: Receita de 1000. Aloca 100 em Alimentação.
               Gasta 120 em dinheiro (checking) e 50 no cartão de crédito (credit).
               Total gasto = 170. Estouro total = 70.
               Gastos em cartão = 50.
               Credit Overspending = min(70, 50) = 50.
               Cash Overspending = 70 - 50 = 20.
        Mês 2: RTA deve ser reduzido apenas em 20 (RTA M2 = 900 - 20 = 880).
        """
        # Mês 1 (Maio de 2026)
        Transaction.objects.create(
            account=self.checking,
            category=None,
            amount=Decimal('1000.00'),
            date=date(2026, 5, 1),
            is_income=True,
            is_applied_to_balance=True
        )
        MonthlyBudget.objects.create(
            category=self.food_cat,
            month=5,
            year=2026,
            amount=Decimal('100.00')
        )
        
        # Gasto em dinheiro de 120
        Transaction.objects.create(
            account=self.checking,
            category=self.food_cat,
            amount=Decimal('120.00'),
            date=date(2026, 5, 10),
            is_income=False,
            is_applied_to_balance=True
        )
        
        # Gasto em cartão de 50
        Transaction.objects.create(
            account=self.credit_card,
            category=self.food_cat,
            amount=Decimal('50.00'),
            date=date(2026, 5, 15),
            is_income=False,
            is_applied_to_balance=True
        )
        
        # Executa o cálculo para o Mês 1
        state_m1 = YNABBudgetService.calculate_envelope_states(self.user, 5, 2026)
        self.assertEqual(state_m1['envelope_states'][self.food_cat.id]['available'], Decimal('-70.00'))
        self.assertEqual(state_m1['envelope_states'][self.food_cat.id]['overspending_type'], 'split')
        
        # Executa o cálculo para o Mês 2 (Junho de 2026)
        state_m2 = YNABBudgetService.calculate_envelope_states(self.user, 6, 2026)
        # RTA reduz em exatamente 20
        self.assertEqual(state_m2['ready_to_assign'], Decimal('880.00'))
        self.assertEqual(state_m2['envelope_states'][self.food_cat.id]['available'], Decimal('0.00'))

    def test_multi_currency_budget_conversion(self):
        """
        Verifica se receitas e despesas em moedas diferentes (BRL) são corretamente
        convertidas para a moeda base (EUR) no cálculo do RTA e estado de envelopes.
        Taxa: 1 EUR = 6 BRL.
        """
        # Criar conta em BRL
        brl_account = Account.objects.create(
            user=self.user,
            name='Conta BRL',
            account_type='checking',
            currency='BRL',
            balance=Decimal('6000.00')
        )
        
        # Receita em BRL de R$ 6.000,00 (deve converter para 1000.00 EUR)
        Transaction.objects.create(
            account=brl_account,
            category=None,
            amount=Decimal('6000.00'),
            date=date(2026, 5, 1),
            is_income=True,
            is_applied_to_balance=True
        )
        
        # Aloca 200.00 EUR em Alimentação
        MonthlyBudget.objects.create(
            category=self.food_cat,
            month=5,
            year=2026,
            amount=Decimal('200.00')
        )
        
        # Gasto em BRL de R$ 300,00 (deve converter para 50.00 EUR)
        Transaction.objects.create(
            account=brl_account,
            category=self.food_cat,
            amount=Decimal('300.00'),
            date=date(2026, 5, 10),
            is_income=False,
            is_applied_to_balance=True
        )
        
        state_m1 = YNABBudgetService.calculate_envelope_states(self.user, 5, 2026)
        
        # RTA = 1000.00 EUR (receita convertida) - 200.00 EUR (alocado) = 800.00 EUR
        self.assertEqual(state_m1['ready_to_assign'], Decimal('800.00'))
        
        # Envelope Alimentação:
        # Alocado = 200.00 EUR
        # Gasto = 50.00 EUR (despesa convertida)
        # Disponível = 150.00 EUR
        food_state = state_m1['envelope_states'][self.food_cat.id]
        self.assertEqual(food_state['assigned'], Decimal('200.00'))
        self.assertEqual(food_state['spent'], Decimal('-50.00'))
        self.assertEqual(food_state['available'], Decimal('150.00'))

    def test_category_macro_allocation(self):
        """
        Verifica se a categoria criada com o novo campo macro_allocation
        expõe o valor correto por meio do CategorySerializer.
        """
        from finance.serializers import CategorySerializer
        new_cat = Category.objects.create(
            user=self.user,
            name='Mercado Avançado',
            parent=self.parent_cat,
            macro_allocation='NEEDS'
        )
        serializer = CategorySerializer(new_cat)
        self.assertEqual(serializer.data['macro_allocation'], 'NEEDS')

