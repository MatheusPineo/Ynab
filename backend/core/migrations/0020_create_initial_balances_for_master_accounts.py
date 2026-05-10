from django.db import migrations

def create_retroactive_master_transactions(apps, schema_editor):
    Account = apps.get_model('core', 'Account')
    Transaction = apps.get_model('core', 'Transaction')
    from datetime import date
    
    # Selecionar todas as contas mestre (não possuem parent_id) que possuem saldo > 0
    master_accounts = Account.objects.filter(parent__isnull=True, balance__gt=0)
    
    for acc in master_accounts:
        # Verificar se essa conta já possui alguma transação vinculada a ela
        # para evitar duplicar transações se o usuário rodar a migração
        # em um banco que já tem transações.
        has_transactions = Transaction.objects.filter(account=acc).exists()
        if not has_transactions:
            # Criamos a transação de receita para o saldo inicial dela
            Transaction.objects.create(
                account=acc,
                amount=acc.balance,
                description=f"Saldo Inicial de {acc.name}",
                date=date.today(),
                is_income=True,
                status='realized',
                is_applied_to_balance=True
            )

def reverse_retroactive_master_transactions(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0019_create_initial_balances_for_subaccounts'),
    ]

    operations = [
        migrations.RunPython(create_retroactive_master_transactions, reverse_retroactive_master_transactions),
    ]
