from django.contrib import admin
from .models import Account, Category, Transaction, Goal, MonthlyBudget, DistributionTemplate, Debt, DebtPayment

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'account_type', 'balance')
    list_filter = ('account_type', 'user')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    list_filter = ('user',)

@admin.register(MonthlyBudget)
class MonthlyBudgetAdmin(admin.ModelAdmin):
    list_display = ('category', 'month', 'year', 'amount')
    list_filter = ('month', 'year', 'category__user')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'date', 'account', 'category', 'is_income')
    list_filter = ('date', 'account', 'category', 'is_income')

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'target_amount', 'current_amount', 'deadline')
    list_filter = ('user', 'deadline')

@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ('counterparty_name', 'user', 'original_amount', 'currency', 'is_mine')
    list_filter = ('user', 'is_mine')

@admin.register(DebtPayment)
class DebtPaymentAdmin(admin.ModelAdmin):
    list_display = ('debt', 'amount', 'date', 'account')
    list_filter = ('date', 'account')
