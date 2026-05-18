import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.contrib.auth.models import User
from finance.models import Account

print("=== ALL USERS AND THEIR ACCOUNTS ===")
for user in User.objects.all():
    print(f"User: {user.username} (ID: {user.id})")
    accounts = Account.objects.filter(user=user)
    print(f"  Accounts: {accounts.count()}")
    for acc in accounts:
        print(f"    ID: {acc.id} | Name: {acc.name} | Balance: {acc.balance} | Parent: {acc.parent.name if acc.parent else None}")
