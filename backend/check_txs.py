import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Transaction, Account, TransactionInbox

print("=== ACCOUNTS ===")
for acc in Account.objects.all():
    print(f"ID: {acc.id} | Name: {acc.name} | Type: {acc.account_type} | Balance: {acc.balance} | Parent: {acc.parent_id}")

print("\n=== TRANSACTIONS ===")
for tx in Transaction.objects.all().order_by('-date'):
    print(f"ID: {tx.id} | Account: {tx.account.name} | Desc: {tx.description} | Amount: {tx.amount} | Date: {tx.date} | Income: {tx.is_income} | Status: {tx.status}")
