import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()
from finance.services import process_credit_card_transaction
from finance.models import CreditCard, Account
from decimal import Decimal
from datetime import date
import traceback

card = CreditCard.objects.first()
if card:
    exp_acc = Account.objects.filter(account_type='savings').first()
    print("Testing create transaction...")
    try:
        process_credit_card_transaction(
            credit_card_id=card.id,
            description="microsoft 365",
            date_tx=date.today(),
            total_amount=Decimal('40.90'),
            category_id=None,
            expense_account_id=exp_acc.id if exp_acc else None,
            installment_count=1,
            starting_installment=1,
            original_currency='BRL',
            original_amount=Decimal('40.90'),
            exchange_rate=Decimal('1.0000'),
            iof_amount=Decimal('0.00')
        )
        print("Success")
    except Exception as e:
        traceback.print_exc()
else:
    print("No cards found")
