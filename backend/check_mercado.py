import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Account, Transaction

print("=== SEARCHING FOR MERCADO ACCOUNT ===")
accounts = Account.objects.filter(name__icontains='Mercado')
print(f"Found {accounts.count()} accounts matching 'Mercado'")
for acc in accounts:
    print(f"User: {acc.user.username} (ID: {acc.user.id}) | ID: {acc.id} | Name: {acc.name} | Balance: {acc.balance}")
    print("--- Transactions for this account ---")
    txs = Transaction.objects.filter(account=acc).order_by('-date', '-created_at')
    for tx in txs:
        print(f"  ID: {tx.id} | Desc: {tx.description} | Amount: {tx.amount} | Date: {tx.date} | Status: {tx.status} | Applied: {tx.is_applied_to_balance}")
