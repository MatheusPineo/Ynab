import hashlib
import secrets
from django.db import models, transaction
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from decimal import Decimal

class Account(models.Model):
    ACCOUNT_TYPES = [
        ('checking', 'Conta Corrente'),
        ('savings', 'Poupança'),
        ('credit_card', 'Cartão de Crédito'),
        ('investment', 'Investimento'),
        ('LOAN_GIVEN', 'Empréstimo Concedido'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='checking')
    currency = models.CharField(max_length=3, default='EUR')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    ceiling = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    icon_url = models.URLField(max_length=500, null=True, blank=True)
    domain = models.CharField(max_length=255, null=True, blank=True, help_text="e.g., nubank.com.br, cgd.pt")
    bank_domain = models.CharField(max_length=255, null=True, blank=True, help_text="e.g., nubank.com.br, millenniumbcp.pt")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)
    exclude_from_totals = models.BooleanField(default=False)
    last_reconciled = models.DateTimeField(null=True, blank=True)
    reserved_credit_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        db_table = 'core_account'
        app_label = 'core'

    def __str__(self):
        return f"{self.name} ({self.user.username})"

    @property
    def available_balance(self):
        """
        Retorna o saldo disponível subtraindo o valor reservado para cartão de crédito.
        """
        return self.balance - self.reserved_credit_balance

    @property
    def bank_logo_url(self):
        if self.bank_domain:
            domain = self.bank_domain.strip().lower()
            if "://" in domain:
                domain = domain.split("://")[1]
            if domain.startswith("www."):
                domain = domain[4:]
            domain = domain.split("/")[0]
            return f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
        return None

    @property
    def is_on_budget(self):
        """
        Retorna se a conta participa do orçamento ativo (envelopes).
        Contas de investimento, empréstimos concedidos ou marcadas como excluídas de totais são consideradas Off-Budget (Tracking).
        """
        if self.account_type in ('investment', 'LOAN_GIVEN'):
            return False
        return not self.exclude_from_totals

    def save(self, *args, **kwargs):
        if self.bank_domain:
            import re
            from urllib.parse import urlparse
            domain = self.bank_domain.strip().lower()
            if not re.match(r'^https?://', domain):
                domain = 'http://' + domain
            try:
                parsed = urlparse(domain)
                netloc = parsed.netloc
                if netloc.startswith("www."):
                    netloc = netloc[4:]
                self.bank_domain = netloc
            except Exception:
                # Fallback em caso de falha de parser
                domain = domain.replace("http://", "").replace("https://", "").replace("www.", "")
                domain = domain.split("/")[0]
                self.bank_domain = domain

        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Criação Automática do Payee de Transferência correspondente
        if is_new:
            Payee.objects.get_or_create(
                user=self.user,
                name=f"Transferência: {self.name}",
                transfer_acct=self
            )


class Category(models.Model):
    TARGET_TYPE_CHOICES = [
        ('NEEDED_FOR_SPENDING', 'Necessário para Gastos'),
        ('SAVINGS_BUILDER', 'Acumulador de Poupança'),
        ('FIXED', 'Valor Fixo'),
        ('PERCENTAGE', 'Percentual da Receita'),
    ]
    CURRENCY_CHOICES = [
        ('EUR', 'EUR'),
        ('BRL', 'BRL'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='EUR')
    target_value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    target_type = models.CharField(max_length=30, choices=TARGET_TYPE_CHOICES, default='NEEDED_FOR_SPENDING')
    ceiling_value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    macro_rule = models.CharField(
        max_length=10,
        choices=[
            ('NEEDS', 'Necessidades'),
            ('WANTS', 'Desejos'),
            ('SAVINGS', 'Poupança'),
            ('NONE', 'Nenhum')
        ],
        default='NONE'
    )
    macro_allocation = models.CharField(
        max_length=10,
        choices=[
            ('NEEDS', 'Necessidades (50%)'),
            ('WANTS', 'Desejos (30%)'),
            ('SAVINGS', 'Poupança/Investimentos (20%)'),
            ('NONE', 'Não Monitorado')
        ],
        default='NONE'
    )

    class Meta:
        db_table = 'core_category'
        verbose_name_plural = "Categories"
        app_label = 'core'

    def __str__(self):
        return self.name


class Payee(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payees')
    name = models.CharField(max_length=150)
    transfer_acct = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='transfer_payee'
    )
    default_category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suggested_payees'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_payee'
        unique_together = ('user', 'name')
        app_label = 'core'

    def __str__(self):
        return self.name


class MonthlyBudget(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='monthly_budgets')
    month = models.PositiveSmallIntegerField(db_index=True) # 1-12
    year = models.PositiveSmallIntegerField(db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'core_monthlybudget'
        unique_together = ('category', 'month', 'year')
        app_label = 'core'

    def __str__(self):
        return f"{self.category.name} - {self.month}/{self.year}: {self.amount}"


class Transaction(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    payee = models.ForeignKey(Payee, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    date = models.DateField(db_index=True)
    is_income = models.BooleanField(default=False)
    is_recurring = models.BooleanField(default=False)
    recurrence_interval = models.CharField(
        max_length=20, null=True, blank=True,
        choices=[('daily', 'Diário'), ('weekly', 'Semanal'), ('monthly', 'Mensal'), ('yearly', 'Anual')]
    )
    next_recurrence_date = models.DateField(null=True, blank=True)
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('realized', 'Efetivada'),
        ('scheduled', 'Agendada'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='realized', db_index=True)
    is_applied_to_balance = models.BooleanField(default=False)
    cleared = models.BooleanField(default=False)
    reconciled = models.BooleanField(default=False)
    transfer_group = models.UUIDField(null=True, blank=True)
    credit_card_bill = models.ForeignKey(
        'CreditCardBill',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ledger_transactions'
    )
    
    # Vínculo para a transação "template" que gerou esta ocorrência
    recurring_parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recurring_children'
    )
    # Marca se esta ocorrência específica foi "pulada" ou "excluída"
    is_recurrence_exception = models.BooleanField(default=False, db_index=True)
    
    # Campo de auto-referência para integridade referencial física de transferências espelhadas
    linked_transfer = models.OneToOneField(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mirrored_transfer'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_transaction'
        app_label = 'core'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._skip_balance_update = False  # Por padrão, transações recomputam o saldo automaticamente

    def __str__(self):
        type_str = "Receita" if self.is_income else "Despesa"
        payee_str = f" para {self.payee.name}" if self.payee else ""
        return f"{type_str}: {self.amount} - {self.description or 'Sem descrição'}{payee_str}"

    def clean(self):
        """
        Regras de Negócio de Categoria e Orçamento do YNAB/Actual Budget:
        1. Se for uma transferência entre duas contas On-budget ou duas Off-budget, a categoria deve ser nula.
        2. Se for uma transferência mista (On-to-Off ou Off-to-On), a categoria ou sinal de receita é obrigatório.
        """
        if self.amount is not None:
            self.amount = abs(self.amount)
        super().clean()
        if self.pk:
            original = Transaction.objects.get(pk=self.pk)
            if original.reconciled and not getattr(self, '_skip_reconciliation_lock', False):
                raise ValidationError("Transações reconciliadas estão travadas e não podem ser alteradas.")

        if self.payee and self.payee.transfer_acct:
            dest_account = self.payee.transfer_acct
            
            # Caso 1: Ambas On-budget ou ambas Off-budget -> categoria DEVE ser nula
            if self.account.is_on_budget == dest_account.is_on_budget:
                if self.category is not None:
                    raise ValidationError(
                        "Transferências entre contas do mesmo tipo de orçamento (ambas On-budget ou ambas Off-budget) "
                        "não podem ter uma categoria alocada, pois o dinheiro não sai nem entra no orçamento."
                    )
            
            # Caso 2: Transferência Mista (On-to-Off ou Off-to-On) -> Exige categoria (ou tratamento especial)
            else:
                # Se sai do orçamento (On-budget -> Off-budget), precisa de uma categoria de despesa
                if self.account.is_on_budget and not dest_account.is_on_budget and not self.is_income:
                    if not self.category:
                        raise ValidationError(
                            "Transferências saindo do orçamento (On-budget para Off-budget) representam despesas reais "
                            "e exigem uma categoria ativa para deduzir dos envelopes."
                        )

    @transaction.atomic
    def save(self, *args, **kwargs):
        if self.amount is not None:
            self.amount = abs(self.amount)
        # Validação de travamento de transação reconciliada antes de qualquer processamento
        if self.pk:
            original = Transaction.objects.get(pk=self.pk)
            if original.reconciled and not getattr(self, '_skip_reconciliation_lock', False):
                raise ValidationError("Transações reconciliadas estão travadas e não podem ser alteradas.")

        # Aplica o motor de regras contábeis síncronamente antes de persistir e validar
        from .services import TransactionRulesService
        TransactionRulesService.apply_rules(self)

        if self.is_recurring:
            self.is_applied_to_balance = False
        elif self.status == 'scheduled':
            self.is_applied_to_balance = False
        elif self.status == 'realized':
            self.is_applied_to_balance = True

        self.full_clean()
        
        # Evita loops de recursão infinita na sincronização espelhada
        is_syncing = kwargs.pop('_syncing', False)
        
        # Antes de salvar, gerencia a aplicação do saldo da transação antiga se for uma edição
        if self.pk:
            old_self = Transaction.objects.get(pk=self.pk)
            if old_self.is_applied_to_balance and not getattr(self, '_skip_balance_update', False):
                # Reverte saldo antigo da conta
                if old_self.is_income:
                    old_self.account.balance = Decimal(str(old_self.account.balance)) - Decimal(str(old_self.amount))
                else:
                    old_self.account.balance = Decimal(str(old_self.account.balance)) + Decimal(str(old_self.amount))
                old_self.account.save()
                
                # Sincroniza a instância de conta em memória com o saldo revertido
                if self.account_id == old_self.account_id:
                    self.account.balance = old_self.account.balance
        
        # 1. Salva a transação atual
        super().save(*args, **kwargs)
        
        # Ajusta e aplica o HTML/novo saldo na conta
        if self.is_applied_to_balance and not getattr(self, '_skip_balance_update', False):
            if self.is_income:
                self.account.balance = Decimal(str(self.account.balance)) + Decimal(str(self.amount))
            else:
                self.account.balance = Decimal(str(self.account.balance)) - Decimal(str(self.amount))
            self.account.save()
            
        # 2. Lógica de Sincronização de Transferência Espelhada (semelhante ao loot-core/transfer.ts)
        if not is_syncing and self.payee and self.payee.transfer_acct:
            dest_account = self.payee.transfer_acct
            
            # Localiza o Payee de retorno (de volta para a conta de origem)
            from_payee, _ = Payee.objects.get_or_create(
                user=self.account.user,
                name=f"Transferência: {self.account.name}",
                transfer_acct=self.account
            )
            
            # Se já existir uma transação espelhada vinculada, atualiza-a
            if self.linked_transfer:
                mirror = self.linked_transfer
                
                mirror.account = dest_account
                mirror.payee = from_payee
                mirror.amount = self.amount  # Valor positivo no nosso sistema
                mirror.is_income = not self.is_income  # Inverte direção
                mirror.date = self.date
                mirror.status = self.status
                mirror.is_applied_to_balance = self.is_applied_to_balance
                mirror.description = self.description
                mirror.transfer_group = self.transfer_group
                
                mirror._skip_balance_update = False  # Espelhos sempre atualizam saldo da conta de destino
                mirror.save(_syncing=True)
            
            # Caso contrário, cria a nova transação espelhada do zero
            else:
                mirror = Transaction(
                    account=dest_account,
                    payee=from_payee,
                    amount=self.amount,
                    is_income=not self.is_income,
                    date=self.date,
                    status=self.status,
                    is_applied_to_balance=self.is_applied_to_balance,
                    description=self.description,
                    category=None,
                    transfer_group=self.transfer_group,
                    linked_transfer=self  # Aponta de volta para esta transação
                )
                mirror._skip_balance_update = False  # Espelhos sempre atualizam saldo da conta de destino
                mirror.save(_syncing=True)
                
                # Vincula bidirecionalmente e atualiza sem disparar sinais/save recursivos
                self.linked_transfer = mirror
                Transaction.objects.filter(pk=self.pk).update(linked_transfer=mirror)

    @transaction.atomic
    def delete(self, *args, **kwargs):
        # Validação de travamento contábil
        if self.reconciled and not getattr(self, '_skip_reconciliation_lock', False):
            raise ValidationError("Transações reconciliadas estão travadas e não podem ser excluídas.")

        # Remove o impacto no saldo da conta
        if self.is_applied_to_balance and not getattr(self, '_skip_balance_update', False):
            if self.is_income:
                self.account.balance = Decimal(str(self.account.balance)) - Decimal(str(self.amount))
            else:
                self.account.balance = Decimal(str(self.account.balance)) + Decimal(str(self.amount))
            self.account.save()
            
        # Armazena a referência do espelho antes que a deleção quebre o vínculo
        mirror = self.linked_transfer
        
        # Deleta a transação atual
        super().delete(*args, **kwargs)
        
        # Deleta a transação espelhada correspondente de forma atômica
        if mirror:
            mirror.linked_transfer = None  # Evita loop de deleção
            mirror._skip_balance_update = False  # Espelhos devem reverter saldo na deleção
            mirror.delete()


class Goal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField(max_length=100)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='EUR')
    deadline = models.DateField(null=True, blank=True)
    emoji = models.CharField(max_length=20, default="🎯")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_goal'
        app_label = 'core'

    def __str__(self):
        return f"Meta: {self.name} ({self.current_amount}/{self.target_amount})"

class DistributionTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='distribution_templates')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_distributiontemplate'
        app_label = 'core'

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class DistributionTemplateItem(models.Model):
    template = models.ForeignKey(DistributionTemplate, on_delete=models.CASCADE, related_name='items')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'core_distributiontemplateitem'
        app_label = 'core'

    def __str__(self):
        target_name = self.account.name if self.account else (self.category.name if self.category else "Nenhum")
        return f"{target_name} - {self.percentage}% or {self.fixed_amount}"

class CreditCard(models.Model):
    COUNTRY_CHOICES = [
        ('BR', 'Brasil'),
        ('PT', 'Portugal'),
    ]
    
    SETTLEMENT_CHOICES = [
        ('FULL_REIMBURSEMENT', '100% de Reembolso (Fim do Mês)'),
        ('REVOLVING_CREDIT', 'Crédito Rotativo (Pagamento Parcial)'),
        ('FRACTIONED', 'Pagamento Fracionado / Parcelamento'),
    ]

    account = models.OneToOneField(Account, on_delete=models.CASCADE, related_name='credit_card_config')
    closing_day = models.PositiveSmallIntegerField()  # 1-31
    due_day = models.PositiveSmallIntegerField()      # 1-31
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    brand = models.CharField(max_length=50, null=True, blank=True)
    country_of_issue = models.CharField(max_length=2, choices=COUNTRY_CHOICES, default='BR')
    settlement_mode = models.CharField(max_length=20, choices=SETTLEMENT_CHOICES, default='FULL_REIMBURSEMENT')
    revolving_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'core_creditcard'
        app_label = 'core'

    def __str__(self):
        return f"Cartão {self.account.name} (Fechamento: {self.closing_day}, Vencimento: {self.due_day}, País: {self.country_of_issue})"


class CreditCardBill(models.Model):
    credit_card = models.ForeignKey(CreditCard, on_delete=models.CASCADE, related_name='bills')
    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    is_closed = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=False)

    class Meta:
        db_table = 'core_creditcardbill'
        unique_together = ('credit_card', 'month', 'year')
        app_label = 'core'

    def __str__(self):
        status = "Fechada" if self.is_closed else "Aberta"
        return f"Fatura {self.month}/{self.year} - {self.credit_card.account.name} ({status})"


class CreditCardTransaction(models.Model):
    credit_card = models.ForeignKey(CreditCard, on_delete=models.CASCADE, related_name='matrix_transactions')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=False, related_name='credit_card_transactions')
    description = models.CharField(max_length=255)
    date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    installment_count = models.PositiveSmallIntegerField(default=1)
    
    # Suporte Multi-moeda e Spread
    original_currency = models.CharField(max_length=3, default='BRL')
    original_amount = models.DecimalField(max_digits=12, decimal_places=2)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, default=1.0000)
    iof_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_creditcardtransaction'
        app_label = 'core'

    def __str__(self):
        return f"Compra Matriz: {self.description} ({self.total_amount} em {self.installment_count}x)"


class Installment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('posted', 'Lançada'),
        ('paid', 'Paga'),
        ('anticipated', 'Antecipada'),
    ]

    transaction = models.ForeignKey(CreditCardTransaction, on_delete=models.CASCADE, related_name='installments')
    bill = models.ForeignKey(CreditCardBill, on_delete=models.CASCADE, related_name='installments')
    number = models.PositiveSmallIntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)

    class Meta:
        db_table = 'core_installment'
        unique_together = ('transaction', 'number')
        app_label = 'core'

    def __str__(self):
        return f"Parcela {self.number}/{self.transaction.installment_count} - {self.transaction.description} ({self.amount})"
    
    
def transaction_inbox_upload_path(instance, filename):
    return f"users/{instance.user.id}/inbox/{filename}"


class TransactionInbox(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('processing', 'Processando'),
        ('ready', 'Pronto'),
        ('failed', 'Falhou'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transaction_inbox_items')
    file = models.FileField(upload_to=transaction_inbox_upload_path, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    ai_suggestions = models.JSONField(default=dict, blank=True, null=True)
    error_message = models.TextField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    validated_transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inbox_sources'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_transactioninbox'
        app_label = 'core'

    def __str__(self):
        filename = self.file.name if self.file else "Sem arquivo"
        return f"Inbox {self.id}: {filename} ({self.get_status_display()}) para {self.user.username}"

    @property
    def suggested_amount_decimal(self):
        """Retorna o valor sugerido como um objeto Decimal do Python para maior precisão financeira."""
        if not self.ai_suggestions:
            return None
        
        # Suporte a múltiplas transações (v1.25.0+)
        transactions = self.ai_suggestions.get('transactions', [])
        if transactions:
            amount = transactions[0].get('amount')
        else:
            amount = self.ai_suggestions.get('amount')
            
        if amount is not None:
            from decimal import Decimal, InvalidOperation
            try:
                return Decimal(str(amount))
            except (ValueError, TypeError, InvalidOperation):
                return None
        return None

    @property
    def suggested_date_object(self):
        """Retorna a data sugerida convertida para um objeto datetime.date."""
        if not self.ai_suggestions:
            return None
            
        # Suporte a múltiplas transações (v1.25.0+)
        transactions = self.ai_suggestions.get('transactions', [])
        if transactions:
            date_str = transactions[0].get('date')
        else:
            date_str = self.ai_suggestions.get('date')
            
        if date_str:
            from datetime import date
            try:
                return date.fromisoformat(str(date_str))
            except (ValueError, TypeError):
                return None
        return None


class CategoryGoal(models.Model):
    GOAL_TYPE_CHOICES = [
        ('target_builder', 'Target Savings Builder (Meta Mensal Fixa)'),
        ('needed_spending_date', 'Needed for Spending por Prazo (Meta com Data Alvo)'),
        ('needed_spending_freq', 'Needed for Spending Periódico (Meta por Frequência)'),
    ]
    
    FREQUENCY_CHOICES = [
        ('weekly', 'Semanal'),
        ('monthly', 'Mensal'),
        ('yearly', 'Anual'),
    ]

    category = models.OneToOneField(Category, on_delete=models.CASCADE, related_name='active_goal')
    goal_type = models.CharField(max_length=30, choices=GOAL_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    target_date = models.DateField(null=True, blank=True)
    frequency = models.CharField(max_length=15, choices=FREQUENCY_CHOICES, default='monthly')
    frequency_interval = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_categorygoal'
        app_label = 'core'

    def __str__(self):
        return f"Meta ({self.get_goal_type_display()}): {self.category.name} - {self.amount}"


class TransactionRule(models.Model):
    STAGE_CHOICES = [
        ('pre', 'Pre-processamento (Limpeza/Categorização)'),
        ('post', 'Post-processamento'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transaction_rules')
    name = models.CharField(max_length=150)
    stage = models.CharField(max_length=10, choices=STAGE_CHOICES, default='pre')
    conditions_op = models.CharField(max_length=3, choices=[('and', 'AND'), ('or', 'OR')], default='and')
    conditions = models.JSONField(default=list)
    actions = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_transactionrule'
        app_label = 'core'

    def __str__(self):
        return f"Regra: {self.name} ({self.stage})"


class InvestmentAsset(models.Model):
    ASSET_TYPES = [
        ('STOCK', 'Stock'),
        ('FIXED_INCOME', 'Fixed Income'),
        ('TREASURY', 'Tesouro Direto'),
        ('FII', 'FIIs'),
        ('ETF', 'ETFs'),
        ('CRYPTO', 'Crypto'),
        ('BOND', 'Bonds'),
        ('MUTUAL_FUND', 'Fundo de Investimento'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investment_assets')
    ticker = models.CharField(max_length=50) # Ex: AAPL, BOVA11
    name = models.CharField(max_length=150)
    market_country = models.CharField(max_length=2, default='BR')
    asset_category = models.CharField(max_length=100, null=True, blank=True)
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPES) # Ex: STOCK, CRYPTO, FII, BOND
    currency = models.CharField(max_length=3, default='BRL')
    macro_category = models.CharField(max_length=100, null=True, blank=True)
    
    # Renda Fixa / Tesouro Fields
    issuer = models.CharField(max_length=150, null=True, blank=True)
    title_type = models.CharField(max_length=50, null=True, blank=True)
    indexer = models.CharField(max_length=50, null=True, blank=True)
    rate_type = models.CharField(max_length=50, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    liquidity_daily = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_investmentasset'
        app_label = 'core'

    def __str__(self) -> str:
        return f"{self.ticker} - {self.name}"


class InvestmentActivity(models.Model):
    ACTIVITY_TYPES = [
        ('BUY', 'Compra'),
        ('SELL', 'Venda'),
        ('DIVIDEND', 'Dividendo'),
        ('SPLIT', 'Desdobramento'),
        ('YIELD', 'Rendimento/Ajuste Manual')
    ]
    asset = models.ForeignKey(InvestmentAsset, on_delete=models.CASCADE, related_name='activities')
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    date = models.DateField()
    quantity = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True) # 8 casas para suportar cripto
    unit_price = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    principal_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    cdi_percentage = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    fees = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_investmentactivity'
        app_label = 'core'

    def __str__(self) -> str:
        return f"{self.get_activity_type_display()} - {self.asset.ticker}"


class DailyAssetPrice(models.Model):
    asset = models.ForeignKey(InvestmentAsset, on_delete=models.CASCADE, related_name='daily_prices')
    date = models.DateField()
    price = models.DecimalField(max_digits=18, decimal_places=8)

    class Meta:
        db_table = 'core_dailyassetprice'
        app_label = 'core'
        unique_together = ('asset', 'date')

    def __str__(self) -> str:
        return f"{self.asset.ticker} at {self.date}: {self.price}"


class DailyCDIRate(models.Model):
    date = models.DateField(unique=True)
    annual_rate = models.DecimalField(max_digits=7, decimal_places=4)
    daily_rate = models.DecimalField(max_digits=18, decimal_places=10, blank=True)

    class Meta:
        db_table = 'core_dailycdirate'
        app_label = 'core'

    def save(self, *args, **kwargs) -> None:
        from decimal import Decimal
        if self.annual_rate is not None:
            annual = float(self.annual_rate) / 100.0
            daily = ((1.0 + annual) ** (1.0 / 252.0)) - 1.0
            self.daily_rate = Decimal(str(daily))
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"CDI {self.date}: {self.annual_rate}% a.a."


class LearnedTransactionRule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learned_transaction_rules')
    keyword = models.CharField(max_length=100)
    assigned_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='learned_rules')
    assigned_category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='learned_rules')
    is_income = models.BooleanField(default=False)

    class Meta:
        db_table = 'core_learnedtransactionrule'
        app_label = 'core'
        unique_together = ('user', 'keyword')

    def __str__(self):
        type_str = "Receita" if self.is_income else "Despesa"
        return f"Regra Aprendida ({self.user.username}): {self.keyword} -> {self.assigned_account.name} ({type_str})"

class TrustedDevice(models.Model):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="trusted_devices"
    )
    device_name = models.CharField(max_length=255)
    os_browser_info = models.CharField(max_length=255, default="Chrome on Windows")
    custom_name = models.CharField(max_length=255, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    location_string = models.CharField(max_length=255, null=True, blank=True)
    token_key = models.CharField(
        max_length=8, 
        unique=True, 
        db_index=True,
        help_text="Prefixo público do token para lookup rápido"
    )
    token_hash = models.CharField(
        max_length=64, 
        unique=True,
        help_text="Hash SHA-256 do token gerado"
    )
    is_active = models.BooleanField(default=True)
    last_used = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_trusteddevice'
        app_label = 'core'

    def __str__(self):
        return f"{self.device_name} ({self.user.username})"

    @staticmethod
    def generate_token():
        # Gera um token seguro de 40 caracteres (20 bytes em hexadecimal)
        return secrets.token_hex(20)

    @staticmethod
    def hash_token(token):
        return hashlib.sha256(token.encode('utf-8')).hexdigest()


class Asset(models.Model):
    LIQUIDITY_TIER_CHOICES = [
        ('IMMEDIATE', 'Liquidez Imediata'),
        ('MEDIUM', 'Liquidez Média'),
        ('ILLIQUID', 'Ilíquido / Sem Liquidez'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=150)
    purchase_value = models.DecimalField(max_digits=12, decimal_places=2)
    current_market_value = models.DecimalField(max_digits=12, decimal_places=2)
    liquidity_tier = models.CharField(
        max_length=20, 
        choices=LIQUIDITY_TIER_CHOICES, 
        default='IMMEDIATE'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_asset'
        app_label = 'core'

    def __str__(self):
        return f"{self.name} ({self.get_liquidity_tier_display()}): {self.current_market_value}"



