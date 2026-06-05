import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Category, MonthlyBudget

categories = Category.objects.filter(name__icontains="Nubank")
for cat in categories:
    print(f"ID: {cat.id} | Name: {cat.name} | Target: {cat.target_value} | Ceiling: {cat.ceiling_value} | Currency: {cat.currency}")
    mbudgets = MonthlyBudget.objects.filter(category=cat)
    for mb in mbudgets:
        print(f"  MonthlyBudget {mb.month}/{mb.year} | Amount: {mb.amount}")
