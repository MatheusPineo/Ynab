import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()
from finance.serializers import CreditCardBillSerializer
from finance.models import CreditCardBill
from rest_framework.renderers import JSONRenderer

try:
    print(JSONRenderer().render(CreditCardBillSerializer(CreditCardBill.objects.all(), many=True).data))
except Exception as e:
    import traceback
    traceback.print_exc()
