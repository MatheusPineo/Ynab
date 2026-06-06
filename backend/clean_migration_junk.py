import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Transaction

print("=== INICIANDO LIMPEZA DE ARTEFATOS ===")

# 1. Deletar apenas o que tem descrição "Saldo Inicial de..."
junk_txs = Transaction.objects.filter(description__startswith="Saldo Inicial de")
count = junk_txs.count()
print(f"Removendo {count} transações de saldo inicial de migração...")
junk_txs.delete()
print("Limpeza de artefatos concluída.")

# 2. Listar o que sobrou (receitas reais que precisam de categoria)
print("\n=== RECEITAS REAIS QUE PRECISAM DE CATEGORIA ===")
reais = Transaction.objects.filter(is_income=True, category__isnull=True)
for tx in reais:
    print(f"ID: {tx.id} | Descrição: {tx.description} | Valor: {tx.amount} | Data: {tx.date}")

print("\nConcluído. Agora as duplicatas de saldo inicial foram removidas.")