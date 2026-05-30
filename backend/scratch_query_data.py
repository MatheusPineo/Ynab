import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from finance.models import Debt, DebtItem, Debtor

User = get_user_model()
for u in User.objects.all():
    print(f"User: {u.username} (ID: {u.id})")
    debts = Debt.objects.filter(user=u)
    print(f"  Debts count: {debts.count()}")
    for d in debts:
        print(f"    Debt: {d.counterparty_name} | {d.original_amount}")
        
    debtors = Debtor.objects.filter(user=u)
    print(f"  Debtors count: {debtors.count()}")
    for dr in debtors:
        print(f"    Debtor: {dr.name}")
        items = DebtItem.objects.filter(debtor=dr)
        print(f"      DebtItems count: {items.count()}")
        for item in items:
            print(f"        Item: {item.product_name} | {item.total_amount}")
