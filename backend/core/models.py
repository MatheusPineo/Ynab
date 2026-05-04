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
    icon_url = models.URLField(max_length=500, null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class MonthlyBudget(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='monthly_budgets')
    month = models.PositiveSmallIntegerField() # 1-12
    year = models.PositiveSmallIntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
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

    def __str__(self):
        return f"Meta: {self.name} ({self.current_amount}/{self.target_amount})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True, default="Organizando o futuro...")
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    
    # 2FA Fields
    two_factor_secret = models.CharField(max_length=32, null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    
    # Preferences
    preferred_currency = models.CharField(max_length=3, default='EUR')
    language = models.CharField(max_length=10, default='pt-BR')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"

class DistributionTemplate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='distribution_templates')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class DistributionTemplateItem(models.Model):
    template = models.ForeignKey(DistributionTemplate, on_delete=models.CASCADE, related_name='items')
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.account.name} - {self.percentage}% or {self.fixed_amount}"
