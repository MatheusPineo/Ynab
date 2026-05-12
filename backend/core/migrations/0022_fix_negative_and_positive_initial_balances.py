from django.db import migrations
import datetime

def fix_initial_balances(apps, schema_editor):
    Account = apps.get_model('core', 'Account')
    Transaction = apps.get_model('core', 'Transaction')
    
    for account in Account.objects.all():
        # Se a conta não possuir nenhuma transação, mas seu saldo for diferente de zero
        if account.transactions.count() == 0 and account.balance != 0:
            Transaction.objects.create(
                account=account,
                amount=abs(account.balance),
                description=f"Saldo Inicial de {account.name}",
                date=datetime.date.today(),
                is_income=account.balance > 0,
                status='realized',
                is_applied_to_balance=True
            )

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0021_account_exclude_from_totals_alter_account_table_and_more'),
    ]

    operations = [
        migrations.RunPython(fix_initial_balances),
    ]
