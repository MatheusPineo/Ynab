from django.db import migrations
from django.db.models import Sum

def recalculate_reserved_balances(apps, schema_editor):
    Account = apps.get_model('core', 'Account')
    Installment = apps.get_model('core', 'Installment')
    
    # Zerar tudo primeiro
    Account.objects.update(reserved_credit_balance=0)
    
    # Recalcular com base nas parcelas pendentes
    for acc in Account.objects.all():
        total = Installment.objects.filter(
            subaccount=acc,
            status__in=['pending', 'unpaid']
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        if total > 0:
            acc.reserved_credit_balance = total
            acc.save(update_fields=['reserved_credit_balance'])

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0047_alter_account_id_alter_category_id_and_more'),
    ]

    operations = [
        migrations.RunPython(recalculate_reserved_balances, migrations.RunPython.noop),
    ]
