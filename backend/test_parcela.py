import os
import sys
sys.path.append('c:\\Users\\mathe\\PROJETO-YNAB\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
import django
django.setup()

from finance.models import CreditCard, Account
from finance.services import process_credit_card_transaction
from decimal import Decimal
from datetime import date

# Get a valid user and credit card
card = CreditCard.objects.first()

if not card:
    print('No credit card found.')
else:
    tx, installments = process_credit_card_transaction(
        credit_card_id=card.id,
        description='Test PARCELA logic',
        date_tx=date.today(),
        total_amount=Decimal('40.90'),
        installment_count=10,
        starting_installment=9,
        input_type='PARCELA'
    )
    
    print(f'Total Transaction Amount: {tx.total_amount}')
    for inst in installments:
        print(f'Installment {inst.number}: {inst.amount}')
        
    # Re-fetch the card and calculate the available limit manually
    card.refresh_from_db()
    from finance.serializers import CreditCardSerializer
    serializer = CreditCardSerializer(card)
    print(f'Available Limit AFTER: {serializer.data["available_limit"]}')
