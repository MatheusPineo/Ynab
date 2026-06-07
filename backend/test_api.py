import os
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.test import Client
from finance.models import CreditCard, Account
from django.contrib.auth.models import User
from datetime import date

user = None
if __name__ == "__main__":
    user = None
if __name__ == "__main__":
    user = None
if __name__ == "__main__":
    user, _ = User.objects.get_or_create(username='testuser')
user.set_password('1234')
user.save()

client = Client()
client.force_login(user)

acc, _ = Account.objects.get_or_create(user=user, name='CC Account API', account_type='credit_card')
card, _ = CreditCard.objects.get_or_create(account=acc, closing_day=20, due_day=28, credit_limit=1000)

exp_acc, _ = Account.objects.get_or_create(user=user, name='Despesas API', account_type='checking')

payload = {
    "description": "microsoft 365",
    "total_amount": 40.9,
    "total_installments": 1,
    "starting_installment": 1,
    "date": date.today().strftime('%Y-%m-%d'),
    "expense_account_id": exp_acc.id,
    "currency": "BRL",
    "exchange_rate": 1,
    "iof_amount": 0
}

print("Payload:", json.dumps(payload, indent=2))
response = client.post(
    f'/api/credit-cards/{card.id}/create_transaction/', 
    data=json.dumps(payload), 
    content_type='application/json'
)
print("Status Code:", response.status_code)
print("Response:", response.json() if response.status_code != 204 else 'No Content')
