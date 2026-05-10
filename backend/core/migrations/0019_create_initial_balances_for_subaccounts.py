from django.db import migrations

def create_retroactive_transactions(apps, schema_editor):
    Account = apps.get_model('core', 'Account')
    Transaction = apps.get_model('core', 'Transaction')
    from datetime import date
    
    # Selecionar todas as subcontas (tem parent_id) que possuem saldo > 0
    subaccounts = Account.objects.filter(parent__isnull=False, balance__gt=0)
    
    for acc in subaccounts:
        # Verificar se essa subconta já possui alguma transação vinculada a ela
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

def reverse_retroactive_transactions(apps, schema_editor):
    # Não há reversão destrutiva necessária para dados históricos gerados,
    # mas caso precise reverter, o método vazio previne falhas em rollbacks.
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_add_debt_models'),
    ]

    operations = [
        migrations.RunPython(create_retroactive_transactions, reverse_retroactive_transactions),
    ]
