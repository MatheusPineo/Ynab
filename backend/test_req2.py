import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()
from finance.services import process_credit_card_transaction
from finance.models import CreditCard, Account
from decimal import Decimal
from datetime import date
import traceback
from django.contrib.auth.models import User

user = User.objects.first()
card = None
if __name__ == "__main__":
    card = CreditCard.objects.first()

# Create a root account (no parent) to simulate user selecting a root account
root_acc, _ = Account.objects.get_or_create(user=user, name='Root Checking', account_type='checking', parent=None)

if card:
    print("Testing create transaction with ROOT account as expense envelope...")
    try:
        process_credit_card_transaction(
            credit_card_id=card.id,
            description="microsoft 365 root",
            date_tx=date.today(),
            total_amount=Decimal('40.90'),
            category_id=None,
            expense_account_id=root_acc.id,
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
