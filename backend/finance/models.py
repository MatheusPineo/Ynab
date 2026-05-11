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

    class Meta:
        db_table = 'core_account'

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')

    class Meta:
        db_table = 'core_category'
        verbose_name_plural = "Categories"

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

    def __str__(self):
        return f"Meta: {self.name} ({self.current_amount}/{self.target_amount})"

class DistributionTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='distribution_templates')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_distributiontemplate'

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class DistributionTemplateItem(models.Model):
    template = models.ForeignKey(DistributionTemplate, on_delete=models.CASCADE, related_name='items')
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'core_distributiontemplateitem'

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

    def __str__(self):
        return f"Pagamento de {self.amount} em {self.date} - {self.debt.counterparty_name}"
