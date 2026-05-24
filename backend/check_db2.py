import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()
from finance.models import CreditCardBill, CreditCardTransaction, Installment
print('Bills:', CreditCardBill.objects.count())
print('Tx:', CreditCardTransaction.objects.count())
print('Inst:', Installment.objects.count())
