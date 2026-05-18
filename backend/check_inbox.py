import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import TransactionInbox, Transaction, Account

print("=== INBOX ITEMS ===")
for item in TransactionInbox.objects.all():
    print(f"ID: {item.id} | Status: {item.status} | User: {item.user.username} | Suggestions: {item.ai_suggestions}")
