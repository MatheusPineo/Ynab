import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.contrib.auth.models import User
from finance.models import TransactionInbox

user = User.objects.get(username='matheuskrx@gmail.com')

# Limpa itens antigos da inbox para começar limpo
TransactionInbox.objects.filter(user=user).delete()

inbox = TransactionInbox.objects.create(
    user=user,
    status='ready',
    ai_suggestions={
        'amount': 75.30,
        'date': '2026-05-18',
        'merchant': 'Posto Ipiranga',
        'currency': 'BRL'
    }
)
print("INBOX ITEM CREATED WITH ID:", inbox.id)
print("File name:", inbox.file.name if inbox.file else "No file")
