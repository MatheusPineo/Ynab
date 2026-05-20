"""
Debug script para simular o que TransactionViewSet.get_queryset() retorna
para o usuário matheuskrx@gmail.com com month=5 e year=2026.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.contrib.auth.models import User
from finance.models import Transaction, Account

# Buscar o usuário principal
user = User.objects.filter(email='matheuskrx@gmail.com').first()
if not user:
    print("ERRO: Usuário matheuskrx@gmail.com não encontrado!")
    exit(1)

print(f"=== Usuário: {user.username} (ID: {user.id}) ===")
print()

# 1. Contas desse usuário
accounts = Account.objects.filter(user=user)
print(f"Total de contas do usuário: {accounts.count()}")
for a in accounts:
    print(f"  Conta ID: {a.id} | Nome: {a.name} | Parent: {a.parent_id}")
print()

# 2. Transações de Maio 2026 (exatamente como faz o ViewSet)
qs = Transaction.objects.filter(account__user=user)
total_all = qs.count()
print(f"Total de transações do usuário (sem filtro de mês): {total_all}")

qs_may = qs.filter(date__month=5, date__year=2026).order_by('-date', '-created_at')
total_may = qs_may.count()
print(f"Total de transações filtradas para Maio 2026: {total_may}")
print()

# 3. Listar todas para Maio 2026
print("=== TRANSAÇÕES MAIO 2026 ===")
for t in qs_may:
    print(f"  ID: {t.id:>4} | Date: {t.date} | AccID: {t.account_id:>3} | Acc: {t.account.name:<30} | Desc: {t.description:<50} | Amount: {t.amount:>10} | Income: {t.is_income} | Status: {t.status}")
print()

# 4. Verificar se existem transações de maio que NÃO pertencem a esse user
orphans = Transaction.objects.filter(date__month=5, date__year=2026).exclude(account__user=user)
print(f"Transações de Maio 2026 de OUTROS usuários: {orphans.count()}")
for t in orphans:
    print(f"  ID: {t.id:>4} | AccUser: {t.account.user.username} | AccID: {t.account_id} | Desc: {t.description}")
