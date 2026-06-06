import os
import django
from finance.models import Transaction, Category

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

# Coloque aqui o ID da categoria de destino que você quer usar
# Você pode consultar o ID no banco via django-admin ou ver a lista abaixo
TARGET_CATEGORY_ID = 1 

# Lista de IDs das transações que o script anterior listou
ids_to_fix = [1, 2, 4, 8, 12, 15, 19, 21, 25, 27, 31, 33, 45, 49]

print(f"Categorizando {len(ids_to_fix)} transações para a Categoria ID {TARGET_CATEGORY_ID}...")

for tx_id in ids_to_fix:
    try:
        tx = Transaction.objects.get(id=tx_id)
        tx.category_id = TARGET_CATEGORY_ID
        tx.save()
        print(f"Sucesso: Transação {tx_id} ({tx.description}) atualizada.")
    except Transaction.DoesNotExist:
        print(f"Erro: Transação {tx_id} não encontrada.")

print("Processo concluído.")