from django.db import models
from django.contrib.auth.models import User

class Account(models.Model):
    ACCOUNT_TYPES = [
        ('checking', 'Conta Corrente'),
        ('savings', 'Poupança'),
        ('credit_card', 'Cartão de Crédito'),
        ('investment', 'Investimento'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='checking')
    currency = models.CharField(max_length=3, default='EUR')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    ceiling = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    icon_url = models.URLField(max_length=500, null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)
    exclude_from_totals = models.BooleanField(default=False)

    class Meta:
        db_table = 'core_account'
        app_label = 'core'

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')

    class Meta:
        db_table = 'core_category'
        verbose_name_plural = "Categories"
        app_label = 'core'

    def __str__(self):
        return self.name

class MonthlyBudget(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='monthly_budgets')
    month = models.PositiveSmallIntegerField() # 1-12
    year = models.PositiveSmallIntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'core_monthlybudget'
        unique_together = ('category', 'month', 'year')
        app_label = 'core'

    def __str__(self):
        return f"{self.category.name} - {self.month}/{self.year}: {self.amount}"

class Transaction(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255)
    date = models.DateField()
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
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='realized')
    is_applied_to_balance = models.BooleanField(default=False)
    transfer_group = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_transaction'
        app_label = 'core'

    def __str__(self):
        type_str = "Receita" if self.is_income else "Despesa"
        return f"{type_str}: {self.amount} - {self.description}"

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
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'core_distributiontemplateitem'
        app_label = 'core'

    def __str__(self):
        return f"{self.account.name} - {self.percentage}% or {self.fixed_amount}"

class Debt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debts')
    counterparty_name = models.CharField(max_length=100)
    original_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='BRL')
    is_mine = models.BooleanField(default=False)  # True = I owe, False = they owe me
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_debt'
        app_label = 'core'

    def __str__(self):
        direction = "Devo para" if self.is_mine else "Me deve"
        return f"{direction} {self.counterparty_name}: {self.original_amount} {self.currency}"

class DebtPayment(models.Model):
    debt = models.ForeignKey(Debt, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='debt_payments')
    transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='debt_payment')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_debtpayment'
        app_label = 'core'

    def __str__(self):
        return f"Pagamento de {self.amount} em {self.date} - {self.debt.counterparty_name}"


class CreditCard(models.Model):
    account = models.OneToOneField(Account, on_delete=models.CASCADE, related_name='credit_card_config')
    closing_day = models.PositiveSmallIntegerField()  # 1-31
    due_day = models.PositiveSmallIntegerField()      # 1-31
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'core_creditcard'
        app_label = 'core'

    def __str__(self):
        return f"Cartão {self.account.name} (Fechamento: {self.closing_day}, Vencimento: {self.due_day})"


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
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_card_transactions')
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

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

