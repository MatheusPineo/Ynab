import logging
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from finance.models import Category, MonthlyBudget

logger = logging.getLogger(__name__)
User = get_user_model()

class Command(BaseCommand):
    help = "Surgically fixes the currency separation mess and restores original BRL values."

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Filter restoration for a specific user ID'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate operations without writing to database'
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run')
        user_id = options.get('user-id')
        
        users = User.objects.all()
        if user_id:
            users = users.filter(id=user_id)
            
        self.stdout.write(self.style.WARNING(f"Starting fix_currency_mess command. Dry-run: {dry_run}"))
        
        factor = Decimal('6.000857')

        for user in users:
            self.stdout.write(f"\nProcessing User: {user.email} (ID: {user.id})")
            
            with transaction.atomic():
                # 1. Obter ou criar os grupos de categorias de destino
                if dry_run:
                    eur_group = None
                    brl_group = None
                    self.stdout.write("Would create or fetch CategoryGroups 'Sub-contas (EUR)' and 'Sub-contas (BRL)'")
                else:
                    eur_group, _ = Category.objects.get_or_create(
                        user=user,
                        name="Sub-contas (EUR)",
                        parent=None,
                        defaults={"currency": "EUR"}
                    )
                    brl_group, _ = Category.objects.get_or_create(
                        user=user,
                        name="Sub-contas (BRL)",
                        parent=None,
                        defaults={"currency": "BRL"}
                    )

                # 2. Processar todas as categorias deste usuário
                categories = Category.objects.filter(user=user)
                
                for category in categories:
                    name = category.name
                    
                    # IF name contains "Novo Banco": Set currency='EUR' and parent to "Sub-contas (EUR)"
                    if "Novo Banco" in name:
                        self.stdout.write(f"Routing '{name}' -> EUR group")
                        if not dry_run:
                            category.currency = 'EUR'
                            category.parent = eur_group
                            category.save()

                    # IF name contains "Nubank": Set currency='BRL', parent to "Sub-contas (BRL)" and apply reverse math
                    elif "Nubank" in name:
                        old_target = category.target_value
                        old_ceiling = category.ceiling_value
                        
                        new_target = (old_target * factor).quantize(Decimal('0.01'))
                        new_ceiling = (old_ceiling * factor).quantize(Decimal('0.01'))
                        
                        self.stdout.write(
                            f"Routing and Restoring '{name}' -> BRL group. "
                            f"Target: {old_target} -> {new_target}. "
                            f"Ceiling: {old_ceiling} -> {new_ceiling}."
                        )
                        
                        if not dry_run:
                            category.currency = 'BRL'
                            category.parent = brl_group
                            category.target_value = new_target
                            category.ceiling_value = new_ceiling
                            category.save()
                            
                            # Também reverter valores dos MonthlyBudget relacionados
                            budgets = MonthlyBudget.objects.filter(category=category)
                            for budget in budgets:
                                old_amount = budget.amount
                                new_amount = (old_amount * factor).quantize(Decimal('0.01'))
                                self.stdout.write(f"  MonthlyBudget for {category.name} in {budget.month}/{budget.year}: {old_amount} -> {new_amount}")
                                budget.amount = new_amount
                                budget.save()

            self.stdout.write(self.style.SUCCESS(f"Finished user {user.email}"))
            
        self.stdout.write(self.style.SUCCESS("\nFix currency mess command completed successfully!"))
