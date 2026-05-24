import os
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.test import Client
from finance.models import CreditCard
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

card = CreditCard.objects.first()
user = card.account.user
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

client = Client()

response = client.get(
    f'/api/credit-cards/{card.id}/bills/', 
    HTTP_AUTHORIZATION=f'Bearer {access_token}'
)

print("Bills Status Code:", response.status_code)
try:
    print("Bills Response:", response.json())
except:
    pass
