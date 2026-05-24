import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import CreditCard
from finance.serializers import CreditCardSerializer

card = CreditCard.objects.first()
serializer = CreditCardSerializer(card)
print(f"Available Limit before: {serializer.data['available_limit']}")

# The transaction was already created by test_api_jwt2.py!
print(f"Let's see if the bills have the installment.")
bills = card.bills.filter(is_paid=False)
for b in bills:
    print(f"Bill {b.month}/{b.year}")
    for i in b.installments.all():
        print(f"  Installment {i.number}: {i.amount} (status: {i.status})")

# Let's re-run get_available_limit explicitly
total_used = sum(
    i.amount for bill in card.bills.filter(is_paid=False) 
    for i in bill.installments.filter(status__in=['pending', 'posted'])
)
print(f"Total Used: {total_used}")
print(f"Credit Limit: {card.credit_limit}")
