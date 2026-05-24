import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()
from finance.serializers import CreditCardTransactionSerializer
from finance.models import CreditCardTransaction

tx = CreditCardTransaction.objects.filter(category__isnull=True).first()
if tx:
    print("Testing serialization with None category...")
    try:
        data = CreditCardTransactionSerializer(tx).data
        print("Success:", data['id'])
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("No tx with null category found")
