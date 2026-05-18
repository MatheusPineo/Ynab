from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from finance.models import Account, Category, Payee, Transaction
from decimal import Decimal
from datetime import date

class LedgerAndTransferTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='ledgeruser', password='testpassword')
        
        # 1. Contas On-budget e Off-budget
        self.checking = Account.objects.create(
            user=self.user,
            name='Conta Corrente',
            account_type='checking',
            balance=Decimal('1000.00')
        )
        self.savings = Account.objects.create(
            user=self.user,
            name='Poupança',
            account_type='savings',
            balance=Decimal('500.00')
        )
        self.investment = Account.objects.create(
            user=self.user,
            name='Investimentos',
            account_type='investment',
            balance=Decimal('0.00')
        )
        
        # Categoria de teste
        self.category = Category.objects.create(user=self.user, name='Lazer')

    def test_account_properties_and_automatic_payee_creation(self):
        """
        Garante que a propriedade is_on_budget funcione corretamente
        e que a criação da conta gere automaticamente um Payee de transferência.
        """
        # Testando is_on_budget
        self.assertTrue(self.checking.is_on_budget)
        self.assertTrue(self.savings.is_on_budget)
        self.assertFalse(self.investment.is_on_budget)
        
        # Testando criação automática do Payee de transferência
        payee_checking = Payee.objects.filter(transfer_acct=self.checking).first()
        self.assertIsNotNone(payee_checking)
        self.assertEqual(payee_checking.name, "Transferência: Conta Corrente")
        
        payee_investment = Payee.objects.filter(transfer_acct=self.investment).first()
        self.assertIsNotNone(payee_investment)
        self.assertEqual(payee_investment.name, "Transferência: Investimentos")

    def test_on_budget_to_on_budget_transfer_clears_category(self):
        """
        Regra do YNAB: transferência interna (On-to-On) não pode ter categoria.
        Deve disparar ValidationError se uma categoria for informada.
        """
        payee_savings = Payee.objects.get(transfer_acct=self.savings)
        
        # Caso com categoria -> deve dar erro no clean() / save()
        tx = Transaction(
            account=self.checking,
            payee=payee_savings,
            category=self.category,
            amount=Decimal('100.00'),
            date=date.today(),
            is_income=False,
            is_applied_to_balance=True
        )
        
        with self.assertRaises(ValidationError):
            tx.save()

        # Sem categoria -> deve passar e criar a transação espelhada
        tx_ok = Transaction(
            account=self.checking,
            payee=payee_savings,
            category=None,
            amount=Decimal('100.00'),
            date=date.today(),
            is_income=False,
            is_applied_to_balance=True
        )
        tx_ok.save()
        
        self.assertIsNotNone(tx_ok.linked_transfer)
        
        # Verifica se o outro lado (espelho) foi criado
        mirror = tx_ok.linked_transfer
        self.assertEqual(mirror.account, self.savings)
        self.assertEqual(mirror.amount, Decimal('100.00'))
        self.assertTrue(mirror.is_income) # Inverteu is_income (de despesa para receita)
        self.assertIsNone(mirror.category)
        
        # Verifica o impacto dos saldos nas contas
        self.checking.refresh_from_db()
        self.savings.refresh_from_db()
        self.assertEqual(self.checking.balance, Decimal('900.00'))
        self.assertEqual(self.savings.balance, Decimal('600.00'))

    def test_on_budget_to_off_budget_transfer_requires_category(self):
        """
        Regra do YNAB: transferência saindo do orçamento (On-to-Off) representa despesa real
        e exige uma categoria ativa para consumir o envelope correspondente.
        """
        payee_investment = Payee.objects.get(transfer_acct=self.investment)
        
        # Sem categoria -> deve dar ValidationError
        tx = Transaction(
            account=self.checking,
            payee=payee_investment,
            category=None,
            amount=Decimal('200.00'),
            date=date.today(),
            is_income=False,
            is_applied_to_balance=True
        )
        
        with self.assertRaises(ValidationError):
            tx.save()

        # Com categoria -> deve passar
        tx_ok = Transaction(
            account=self.checking,
            payee=payee_investment,
            category=self.category,
            amount=Decimal('200.00'),
            date=date.today(),
            is_income=False,
            is_applied_to_balance=True
        )
        tx_ok.save()
        
        # Verifica espelhamento
        mirror = tx_ok.linked_transfer
        self.assertIsNotNone(mirror)
        self.assertEqual(mirror.account, self.investment)
        self.assertEqual(mirror.amount, Decimal('200.00'))
        self.assertTrue(mirror.is_income)
        self.assertIsNone(mirror.category) # Conta Off-budget não recebe categoria
        
        # Saldos
        self.checking.refresh_from_db()
        self.investment.refresh_from_db()
        self.assertEqual(self.checking.balance, Decimal('800.00'))
        self.assertEqual(self.investment.balance, Decimal('200.00'))

    def test_transfer_edit_synchronizes_perfectly(self):
        """
        Garante que a edição de uma transferência sincronize o valor, data, status
        e atualize os saldos em ambas as contas consistentemente.
        """
        payee_savings = Payee.objects.get(transfer_acct=self.savings)
        
        tx = Transaction(
            account=self.checking,
            payee=payee_savings,
            amount=Decimal('100.00'),
            date=date.today(),
            is_income=False,
            is_applied_to_balance=True
        )
        tx.save()
        
        # Edita valor da transferência
        tx.amount = Decimal('150.00')
        tx.save()
        
        # Verifica se o outro lado atualizou
        mirror = tx.linked_transfer
        self.assertEqual(mirror.amount, Decimal('150.00'))
        
        # Verifica se os saldos foram recalculados
        self.checking.refresh_from_db()
        self.savings.refresh_from_db()
        self.assertEqual(self.checking.balance, Decimal('850.00'))
        self.assertEqual(self.savings.balance, Decimal('650.00'))

    def test_transfer_deletion_cascade(self):
        """
        Garante que a exclusão de uma das pontas da transferência remova
        a outra ponta de forma cascateada e atômica, reajustando saldos.
        """
        payee_savings = Payee.objects.get(transfer_acct=self.savings)
        
        tx = Transaction(
            account=self.checking,
            payee=payee_savings,
            amount=Decimal('100.00'),
            date=date.today(),
            is_income=False,
            is_applied_to_balance=True
        )
        tx.save()
        
        mirror_id = tx.linked_transfer.id
        
        # Deleta a principal
        tx.delete()
        
        # Verifica se o espelho também sumiu
        self.assertFalse(Transaction.objects.filter(id=mirror_id).exists())
        
        # Verifica se os saldos voltaram aos valores originais
        self.checking.refresh_from_db()
        self.savings.refresh_from_db()
        self.assertEqual(self.checking.balance, Decimal('1000.00'))
        self.assertEqual(self.savings.balance, Decimal('500.00'))
