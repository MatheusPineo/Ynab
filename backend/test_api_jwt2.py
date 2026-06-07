import os
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.test import Client
from finance.models import CreditCard, Account
from django.contrib.auth.models import User
from datetime import date
from rest_framework_simplejwt.tokens import RefreshToken

card = None
if __name__ == "__main__":
    card = CreditCard.objects.first()
user = card.account.user
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

client = Client()

exp_acc = Account.objects.filter(account_type='savings', user=user).first()

payload = {
    "description": "microsoft 365 test API",
    "total_amount": 40.9,
    "total_installments": 1,
    "starting_installment": 1,
    "date": date.today().strftime('%Y-%m-%d'),
    "expense_account_id": exp_acc.id if exp_acc else None,
    "currency": "BRL",
    "exchange_rate": 1,
    "iof_amount": 0
}

response = client.post(
    f'/api/credit-cards/{card.id}/create_transaction/', 
    data=json.dumps(payload), 
    content_type='application/json',
    HTTP_AUTHORIZATION=f'Bearer {access_token}'
)

print("Status Code:", response.status_code)
if response.status_code != 204:
    try:
        print("Response:", response.json())
    except:
        print("Response text:", response.content)
