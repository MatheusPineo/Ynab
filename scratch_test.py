import os
import django
import sys

# Setup django environment
sys.path.append(r"C:\Users\mathe\PROJETO-YNAB\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ynab_backend.settings")
django.setup()

from finance.serializers import AccountSerializer

print("Testing invalid choices:")
for val in ['loan_given', 'tracking', 'checking']:
    data = {
        'name': f'Test {val}',
        'balance': '100.00',
        'account_type': val,
        'currency': 'BRL'
    }
    serializer = AccountSerializer(data=data)
    print(f"Validation for {val}: {serializer.is_valid()}")
    if not serializer.is_valid():
        print("Errors:", serializer.errors)
