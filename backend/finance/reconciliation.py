from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Account, Transaction, Payee

class AccountReconciliationService:
    @staticmethod
    def get_reconciliation_status(account: Account):
        """
        Retorna as métricas contábeis da conta para reconciliação:
        - cleared_balance: Soma das transações líquidas (cleared=True e status='realized').
        - uncleared_balance: Soma das transações pendentes (cleared=False ou status='pending').
        - total_balance: Saldo real contábil atual da conta.
        """
        # Apenas transações que afetam o saldo real da conta (is_applied_to_balance=True)
        # Transações liquidadas (cleared=True)
        cleared_txs = Transaction.objects.filter(
            account=account,
            cleared=True,
            is_applied_to_balance=True
        )
        cleared_balance = Decimal('0.00')
        for tx in cleared_txs:
            if tx.is_income:
                cleared_balance += Decimal(str(tx.amount))
            else:
                cleared_balance -= Decimal(str(tx.amount))

        # Transações não liquidadas (cleared=False)
        uncleared_txs = Transaction.objects.filter(
            account=account,
            cleared=False,
            is_applied_to_balance=True
        )
        uncleared_balance = Decimal('0.00')
        for tx in uncleared_txs:
            if tx.is_income:
                uncleared_balance += Decimal(str(tx.amount))
            else:
                uncleared_balance -= Decimal(str(tx.amount))

        return {
            'cleared_balance': cleared_balance,
            'uncleared_balance': uncleared_balance,
            'total_balance': account.balance,
            'last_reconciled': account.last_reconciled,
        }

    @staticmethod
    @transaction.atomic
    def create_adjustment_transaction(account: Account, user, statement_balance: Decimal):
        """
        Calcula a diferença contábil e gera automaticamente uma transação de ajuste de reconciliação
        se o saldo informado pelo usuário (statement_balance) diferir do saldo compensado (cleared_balance).
        """
        status = AccountReconciliationService.get_reconciliation_status(account)
        cleared_balance = status['cleared_balance']
        difference = Decimal(str(statement_balance)) - cleared_balance

        if difference == Decimal('0.00'):
            return None

        # Localiza ou cria o Payee correspondente para Ajuste de Reconciliação
        adjustment_payee, _ = Payee.objects.get_or_create(
            user=user,
            name="Ajuste de Reconciliação",
            defaults={'transfer_acct': None}
        )

        # Determina a direção (Receita/Despesa) e o valor absoluto
        is_income = difference > 0
        absolute_amount = abs(difference)

        # Cria a transação de ajuste
        # Marcada como cleared=True e reconciled=False para ser travada na finalização
        adjustment_tx = Transaction(
            account=account,
            payee=adjustment_payee,
            category=None,
            amount=absolute_amount,
            description="Ajuste automático de reconciliação de saldo",
            date=timezone.localdate(),
            is_income=is_income,
            status='realized',
            is_applied_to_balance=True,
            cleared=True,
            reconciled=False
        )
        # Permite bypass de locks contábeis para transações geradas pelo sistema
        adjustment_tx._skip_reconciliation_lock = True
        adjustment_tx.save()

        return adjustment_tx

    @staticmethod
    @transaction.atomic
    def finalize_reconciliation(account: Account):
        """
        Finaliza a reconciliação fechando o lote de auditoria:
        - Marca todas as transações liquidadas (cleared=True, reconciled=False) como reconciliadas (reconciled=True).
        - Atualiza a data da última reconciliação da conta (last_reconciled).
        """
        # Atualiza em lote diretamente via ORM update para otimização contábil
        # Como o update() do Django não chama o save() nem o clean() de cada registro,
        # contornamos as validações de travamento sem risco de ValidationError!
        updated_count = Transaction.objects.filter(
            account=account,
            cleared=True,
            reconciled=False
        ).update(reconciled=True)

        # Atualiza a data e hora do fechamento da reconciliação na conta
        account.last_reconciled = timezone.now()
        account.save()

        return updated_count

    @staticmethod
    @transaction.atomic
    def unlock_transaction(transaction_instance: Transaction):
        """
        Destrava excepcionalmente uma transação reconciliada permitindo auditorias manuais.
        """
        if not transaction_instance.reconciled:
            return False

        transaction_instance.reconciled = False
        transaction_instance._skip_reconciliation_lock = True
        transaction_instance.save()
        return True
