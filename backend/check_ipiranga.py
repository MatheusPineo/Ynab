import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Transaction, Account

print("=== TRANSACTIONS WITH 'IPIRANGA' ===")
txs = Transaction.objects.filter(description__icontains='Ipiranga')
print(f"Found {txs.count()} transactions")
for tx in txs:
    print(f"ID: {tx.id} | Account: {tx.account.name} (ID: {tx.account.id}) | Desc: {tx.description} | Amount: {tx.amount} | Date: {tx.date} | Status: {tx.status} | Applied: {tx.is_applied_to_balance}")
