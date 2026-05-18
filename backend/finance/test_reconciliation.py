from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from finance.models import Account, Transaction, Payee
from finance.reconciliation import AccountReconciliationService

class AccountReconciliationTestCase(TestCase):
    def setUp(self):
        # Criação do ambiente contábil de teste
        self.user = User.objects.create_user(username="auditor", password="securepassword123")
        self.account = Account.objects.create(
            user=self.user,
            name="Conta Corrente Principal",
            account_type="checking",
            balance=Decimal('1000.00'),
            currency="EUR"
        )
        self.payee = Payee.objects.create(
            user=self.user,
            name="Supermercado Local"
        )

        # Transação líquida/compensada (cleared)
        self.t_cleared = Transaction.objects.create(
            account=self.account,
            payee=self.payee,
            amount=Decimal('150.00'),
            description="Compra de mantimentos",
            date=timezone.localdate(),
            is_income=False,
            status='realized',
            is_applied_to_balance=True,
            cleared=True,
            reconciled=False
        )

        # Transação pendente/não líquida (uncleared)
        self.t_uncleared = Transaction.objects.create(
            account=self.account,
            payee=self.payee,
            amount=Decimal('50.00'),
            description="Pagamento pendente",
            date=timezone.localdate(),
            is_income=False,
            status='realized',
            is_applied_to_balance=True,
            cleared=False,
            reconciled=False
        )

    def test_reconciliation_status_math(self):
        """
        Garante que os cálculos de saldo compensado e pendente batem com a lógica contábil.
        """
        # Saldo inicial = 1000.00
        # Transação 1 (cleared): -150.00
        # Transação 2 (uncleared): -50.00
        # Saldo real atual da conta deve ser 800.00 (1000 - 150 - 50)
        # O cleared_balance (saldo compensado) deve ser -150.00 (sem contar o saldo inicial, pois calcula soma das transações cleared)
        # Mas para reconciliação, somamos o saldo inicial? Não, as transações liquidadas afetam o saldo.
        # No YNAB, cleared_balance da conta = saldo inicial + soma das transações cleared.
        # Na nossa engine, a soma das transações cleared é calculada a partir do zero ou com o balance acumulado?
        # A engine soma as transações de forma acumulativa na conta.
        # Vamos verificar o retorno de get_reconciliation_status
        status = AccountReconciliationService.get_reconciliation_status(self.account)
        self.assertEqual(status['cleared_balance'], Decimal('-150.00'))
        self.assertEqual(status['uncleared_balance'], Decimal('-50.00'))
        self.assertEqual(status['total_balance'], Decimal('800.00'))

    def test_reconciliation_lock_impedes_mutation(self):
        """
        Verifica se transações marcadas como reconciled=True impedem fisicamente qualquer edição.
        """
        # Marca transação como reconciliada
        self.t_cleared.reconciled = True
        self.t_cleared._skip_reconciliation_lock = True
        self.t_cleared.save()

        # Tenta editar a transação reconciliada
        self.t_cleared.description = "Tentativa de alteração fraudulenta"
        self.t_cleared._skip_reconciliation_lock = False  # Ativa o lock

        with self.assertRaises(ValidationError):
            self.t_cleared.save()

        # Tenta excluir a transação reconciliada
        with self.assertRaises(ValidationError):
            self.t_cleared.delete()

    def test_adjustment_transaction_creation(self):
        """
        Valida que uma transação de ajuste é criada quando o saldo do extrato difere do saldo compensado.
        """
        # Saldo compensado = -150.00
        # Se dissermos que o saldo compensado do extrato oficial é de -100.00 (diferença de +50.00)
        statement_balance = Decimal('-100.00')
        
        adjustment_tx = AccountReconciliationService.create_adjustment_transaction(
            account=self.account,
            user=self.user,
            statement_balance=statement_balance
        )

        self.assertIsNotNone(adjustment_tx)
        self.assertEqual(adjustment_tx.amount, Decimal('50.00'))
        self.assertTrue(adjustment_tx.is_income)
        self.assertTrue(adjustment_tx.cleared)
        self.assertFalse(adjustment_tx.reconciled)
        self.assertEqual(adjustment_tx.description, "Ajuste automático de reconciliação de saldo")

    def test_finalize_reconciliation_locks_cleared_batch(self):
        """
        Verifica se a finalização da reconciliação trava todas as transações cleared e atualiza a conta.
        """
        # Executa fechamento
        updated_count = AccountReconciliationService.finalize_reconciliation(self.account)
        
        # Deve ter atualizado 1 transação (self.t_cleared)
        self.assertEqual(updated_count, 1)

        # Recarrega do banco
        self.t_cleared.refresh_from_db()
        self.t_uncleared.refresh_from_db()
        self.account.refresh_from_db()

        self.assertTrue(self.t_cleared.reconciled)
        self.assertFalse(self.t_uncleared.reconciled)
        self.assertIsNotNone(self.account.last_reconciled)

    def test_unlock_transaction_administrative_bypass(self):
        """
        Garante que uma transação reconciliada possa ser destravada para fins administrativos.
        """
        # Finaliza e trava
        AccountReconciliationService.finalize_reconciliation(self.account)
        self.t_cleared.refresh_from_db()
        self.assertTrue(self.t_cleared.reconciled)

        # Tenta destravar
        success = AccountReconciliationService.unlock_transaction(self.t_cleared)
        self.assertTrue(success)

        self.t_cleared.refresh_from_db()
        self.assertFalse(self.t_cleared.reconciled)

        # Agora a transação deve aceitar modificações novamente
        self.t_cleared.description = "Edição autorizada"
        try:
            self.t_cleared.save()
        except ValidationError:
            self.fail("Salvar falhou em transação destravada administrativamente!")
