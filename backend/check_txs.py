import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from finance.models import Transaction, CreditCardTransaction, Account

print("=== CONTAS FINANCEIRAS ===")
for acc in Account.objects.all():
    print(f"ID: {acc.id} | Nome: {acc.name} | Tipo: {acc.account_type} | Saldo: {acc.balance}")

print("\n=== TRANSAÇÕES CORE (Transaction) ===")
for tx in Transaction.objects.order_by('-id')[:20]:
    print(f"ID: {tx.id} | Conta: {tx.account.name} (ID: {tx.account.id}) | Desc: {tx.description} | Valor: {tx.amount} | Data: {tx.date} | Status: {tx.status} | Aplicado Saldo: {tx.is_applied_to_balance}")

print("\n=== TRANSAÇÕES DE CARTÃO (CreditCardTransaction) ===")
for cc_tx in CreditCardTransaction.objects.order_by('-id')[:10]:
    print(f"ID: {cc_tx.id} | Cartão: {cc_tx.credit_card.name} | Desc: {cc_tx.description} | Valor Total: {cc_tx.total_amount} | Parc: {cc_tx.installment_count}")
