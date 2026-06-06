import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Transaction, Account

print("=== INVESTIGAÇÃO DE SALDOS INICIAIS ===")
# Busca transações de entrada sem categoria (potenciais saldos iniciais)
ajustes = Transaction.objects.filter(is_income=True, category__isnull=True)

print(f"Encontradas {ajustes.count()} transações de entrada sem categoria.")
total_fantasmas = Decimal('0.00')

for tx in ajustes:
    print(f"- ID: {tx.id} | Conta: {tx.account.name} | Data: {tx.date} | Valor: {tx.amount} | Descrição: {tx.description}")
    total_fantasmas += tx.amount

print(f"\nTotal acumulado invisível que está afetando o Ready to Assign: {total_fantasmas}")