import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Category

print("=== CATEGORIAS ENCONTRADAS NO BANCO ===")
for cat in Category.objects.all():
    print(f"Nome exato: '{cat.name}' | ID: {cat.id}")