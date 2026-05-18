import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from finance.models import Account, Transaction, TransactionInbox

User = get_user_model()
u = User.objects.get(username='matheuskrx@gmail.com')

print(f"Transactions for user {u.username}:")
txs = Transaction.objects.filter(account__user=u).order_by('-created_at')
for tx in txs:
    print(f"ID: {tx.id} | Account: {tx.account.name} (ID: {tx.account_id}) | Parent Account: {tx.account.parent_id} | Category: {tx.category.name if tx.category else 'None'} | Description: {tx.description} | Amount: {tx.amount} | Date: {tx.date} | Status: {tx.status} | Applied: {tx.is_applied_to_balance}")
