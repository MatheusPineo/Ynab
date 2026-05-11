import uuid
import calendar
import io
import csv
import traceback
from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_DOWN

from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes, inline_serializer
from rest_framework import serializers

from .models import (
    Account, Category, Transaction, Goal, MonthlyBudget, 
    DistributionTemplate, Debt, DebtPayment
)
from .serializers import (
    AccountSerializer, CategorySerializer, TransactionSerializer, GoalSerializer, 
    MonthlyBudgetSerializer, DistributionTemplateSerializer, DebtSerializer, DebtPaymentSerializer
)

def sync_recurring_transactions(user, upto_date=None):
    def add_months(sourcedate, months):
        month = sourcedate.month - 1 + months
        year = sourcedate.year + month // 12
        month = month % 12 + 1
        day = min(sourcedate.day, calendar.monthrange(year, month)[1])
        return date(year, month, day)

    today = date.today()
    if upto_date is None:
        upto_date = today

    # 1. Aplicar transações futuras que agora são atuais/passadas E estão marcadas como realizadas
    pending_current = Transaction.objects.filter(
        account__user=user,
        status='realized',
        is_applied_to_balance=False,
        date__lte=today
    )
    for t in pending_current:
        acc = t.account
        if t.is_income: acc.balance += t.amount
        else: acc.balance -= t.amount
        acc.save()
        t.is_applied_to_balance = True
        t.save()

    # 2. Criar novas instâncias de templates recorrentes
    recurring = Transaction.objects.filter(
        account__user=user, 
        is_recurring=True, 
        next_recurrence_date__lte=upto_date
    )

    for template in recurring:
        while template.next_recurrence_date and template.next_recurrence_date <= upto_date:
            new_date = template.next_recurrence_date
            
            exists = Transaction.objects.filter(
                account=template.account,
                description=template.description,
                amount=template.amount,
                date=new_date,
                is_recurring=False
            ).exists()
            
            if not exists:
                applied = (new_date <= today)
                new_t = Transaction.objects.create(
                    account=template.account,
                    category=template.category,
                    amount=template.amount,
                    description=template.description,
                    date=new_date,
                    is_income=template.is_income,
                    is_recurring=False,
                    is_applied_to_balance=applied
                )
                
                if applied:
                    acc = new_t.account
                    if new_t.is_income: acc.balance += new_t.amount
                    else: acc.balance -= new_t.amount
                    acc.save()
            
            if template.recurrence_interval == 'daily':
                template.next_recurrence_date += timedelta(days=1)
            elif template.recurrence_interval == 'weekly':
                template.next_recurrence_date += timedelta(days=7)
            elif template.recurrence_interval == 'monthly':
                template.next_recurrence_date = add_months(template.next_recurrence_date, 1)
            elif template.recurrence_interval == 'yearly':
                template.next_recurrence_date = add_months(template.next_recurrence_date, 12)
            else:
                break
        template.save()

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user).select_related('parent')

    @transaction.atomic
    def perform_create(self, serializer):
        account = serializer.save(user=self.request.user)
        
        # Se possuir saldo positivo
        if account.balance > 0:
            Transaction.objects.create(
                account=account,
                amount=account.balance,
                description=f"Saldo Inicial de {account.name}",
                date=date.today(),
                is_income=True,
                status='realized',
                is_applied_to_balance=True
            )

    @transaction.atomic
    def perform_update(self, serializer):
        old_account = self.get_object()
        old_balance = old_account.balance
        
        account = serializer.save()
        
        # Se houver alteração no saldo
        if account.balance != old_balance:
            diff = account.balance - old_balance
            if diff > 0:
                Transaction.objects.create(
                    account=account,
                    amount=diff,
                    description=f"Ajuste de Saldo (Aumento) de {account.name}",
                    date=date.today(),
                    is_income=True,
                    status='realized',
                    is_applied_to_balance=True
                )
            else:
                Transaction.objects.create(
                    account=account,
                    amount=abs(diff),
                    description=f"Ajuste de Saldo (Redução) de {account.name}",
                    date=date.today(),
                    is_income=False,
                    status='realized',
                    is_applied_to_balance=True
                )

    @extend_schema(
        summary="Retorna a árvore hierárquica de contas do usuário",
        description="Agrupa recursivamente as contas do usuário logado em nós de Contas Mestre e Subcontas, otimizando o carregamento da interface.",
        responses={200: AccountSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Retorna uma árvore aninhada de contas e subcontas do usuário ativo.
        """
        accounts = self.get_queryset()
        
        def build_tree(account_list, parent_id=None):
            branch = []
            for account in account_list:
                if account.parent_id == parent_id:
                    children = build_tree(account_list, account.id)
                    acc_dict = {
                        'id': str(account.id),
                        'name': account.name,
                        'account_type': account.account_type,
                        'balance': float(account.balance),
                        'currency': account.currency,
                        'icon_url': account.icon_url,
                        'parent': str(account.parent_id) if account.parent_id else None,
                        'ceiling': float(account.ceiling) if account.ceiling is not None else None,
                    }
                    if children:
                        acc_dict['children'] = children
                    branch.append(acc_dict)
            return branch
        
        final_tree = build_tree(accounts)
        return Response(final_tree)

    @extend_schema(
        summary="Cobre saldo negativo de uma subconta usando saldos de subcontas irmãs",
        description="Identifica déficit em uma subconta e distribui a cobertura proporcionalmente (fair share) entre subcontas irmãs com saldo positivo da mesma moeda.",
        responses={
            200: inline_serializer(
                name="CoverOverspendingSuccessResponse",
                fields={"message": serializers.CharField()}
            ),
            400: inline_serializer(
                name="CoverOverspendingErrorResponse",
                fields={"error": serializers.CharField()}
            )
        }
    )
    @action(detail=True, methods=['post'])
    def cover_overspending(self, request, pk=None):
        """
        Verifica saldo negativo da subconta informada e executa transferências compensatórias de subcontas irmãs.
        """
        account = self.get_object()
        
        if account.balance >= 0:
            return Response({"error": "A conta não possui saldo negativo."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not account.parent_id:
            return Response({"error": "Esta ação está disponível apenas para subcontas."}, status=status.HTTP_400_BAD_REQUEST)

        siblings = Account.objects.filter(
            parent_id=account.parent_id, 
            currency=account.currency,
            balance__gt=0
        ).exclude(id=account.id).order_by('balance')
        
        if not siblings.exists():
            return Response({"error": "Não há subcontas com saldo positivo para cobrir o déficit."}, status=status.HTTP_400_BAD_REQUEST)

        total_deficit = abs(account.balance)
        sibs = list(siblings)
        
        remaining_deficit = total_deficit
        deductions = {s.id: Decimal('0.00') for s in sibs}
        
        for i, s in enumerate(sibs):
            remaining_accounts = len(sibs) - i
            if remaining_accounts == 0 or remaining_deficit <= 0:
                break
                
            fair_share = round(remaining_deficit / remaining_accounts, 2)
            actual_deduction = min(Decimal(str(fair_share)), s.balance)
            
            if i == len(sibs) - 1 and s.balance >= remaining_deficit:
                actual_deduction = remaining_deficit
                
            deductions[s.id] = actual_deduction
            remaining_deficit -= actual_deduction
            
        transfer_group_uuid = uuid.uuid4()
        today = date.today()
        
        total_covered = Decimal('0.00')

        with transaction.atomic():
            for s in sibs:
                amount_to_deduct = deductions[s.id]
                if amount_to_deduct <= 0:
                    continue
                    
                Transaction.objects.create(
                    account=s,
                    amount=amount_to_deduct,
                    description=f"Cobertura de saldo da conta {account.name}",
                    date=today,
                    is_income=False,
                    is_applied_to_balance=True,
                    transfer_group=transfer_group_uuid
                )
                s.balance -= amount_to_deduct
                s.save()
                total_covered += amount_to_deduct
            
            if total_covered > 0:
                Transaction.objects.create(
                    account=account,
                    amount=total_covered,
                    description="Cobertura recebida das subcontas",
                    date=today,
                    is_income=True,
                    is_applied_to_balance=True,
                    transfer_group=transfer_group_uuid
                )
                account.balance += total_covered
                account.save()

        return Response({"message": f"Saldo negativo coberto com sucesso. Total: {total_covered}"})

    @extend_schema(
        summary="Distribui o excedente de saldo de uma subconta acima do teto estipulado",
        description="Se o saldo da subconta ultrapassar seu teto (ceiling), o excedente é distribuído proporcionalmente para as subcontas irmãs que estão abaixo de seus próprios tetos. Se ainda sobrar excedente, o saldo é depositado na conta Reserva de Excedente.",
        responses={
            200: inline_serializer(
                name="DistributeExcessSuccessResponse",
                fields={"message": serializers.CharField()}
            ),
            400: inline_serializer(
                name="DistributeExcessErrorResponse",
                fields={"error": serializers.CharField()}
            )
        }
    )
    @action(detail=True, methods=['post'])
    def distribute_excess(self, request, pk=None):
        """
        Executa o algoritmo de distribuição automática de recursos excedentes (overflow) em subcontas.
        """
        account = self.get_object()

        if account.ceiling is None:
            return Response({"error": "Esta conta não possui um teto definido."}, status=status.HTTP_400_BAD_REQUEST)

        if account.balance <= account.ceiling:
            return Response({"error": "Esta conta não está acima do seu teto."}, status=status.HTTP_400_BAD_REQUEST)

        if not account.parent_id:
            return Response({"error": "Esta ação está disponível apenas para subcontas."}, status=status.HTTP_400_BAD_REQUEST)

        excess = account.balance - account.ceiling

        # Find siblings that have a ceiling defined and are below it
        siblings = list(Account.objects.filter(
            parent_id=account.parent_id,
            currency=account.currency,
        ).exclude(id=account.id).exclude(ceiling__isnull=True).order_by('created_at'))

        # Filter to only those that still have space below their ceiling
        eligible = [s for s in siblings if s.balance < s.ceiling]

        transfer_group_uuid = uuid.uuid4()
        today = date.today()
        remaining = excess

        deposits = {}  # {account_id: Decimal}

        # Distribute equally among eligible, capped at each account's remaining space
        while eligible and remaining > Decimal('0.00'):
            per_account = (remaining / len(eligible)).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
            new_eligible = []
            for s in eligible:
                space = s.ceiling - s.balance
                take = min(per_account, space)
                take = min(take, remaining)
                if take <= 0:
                    continue
                deposits[s.id] = deposits.get(s.id, Decimal('0.00')) + take
                remaining -= take
                # If this account is now full, remove from eligible next round
                projected = s.balance + deposits[s.id]
                if projected < s.ceiling:
                    new_eligible.append(s)
            if not new_eligible or per_account == 0:
                break
            eligible = new_eligible

        RESERVE_NAME = "✦ Reserva de Excedente"

        with transaction.atomic():
            # Deposit into eligible siblings
            for s in siblings:
                amount = deposits.get(s.id, Decimal('0.00'))
                if amount <= 0:
                    continue
                Transaction.objects.create(
                    account=s,
                    amount=amount,
                    description=f"Excedente recebido da conta {account.name}",
                    date=today,
                    is_income=True,
                    is_applied_to_balance=True,
                    transfer_group=transfer_group_uuid
                )
                s.balance += amount
                s.save()

            # If there's still a remainder, send to the reserve account
            if remaining > Decimal('0.00'):
                reserve = Account.objects.filter(
                    parent_id=account.parent_id,
                    currency=account.currency,
                    name=RESERVE_NAME,
                    user=request.user
                ).first()

                if not reserve:
                    reserve = Account.objects.create(
                        user=request.user,
                        name=RESERVE_NAME,
                        parent_id=account.parent_id,
                        currency=account.currency,
                        account_type='savings',
                        balance=Decimal('0.00'),
                    )

                Transaction.objects.create(
                    account=reserve,
                    amount=remaining,
                    description=f"Excedente recebido da conta {account.name}",
                    date=today,
                    is_income=True,
                    is_applied_to_balance=True,
                    transfer_group=transfer_group_uuid
                )
                reserve.balance += remaining
                reserve.save()

            # Deduct total excess from source account
            Transaction.objects.create(
                account=account,
                amount=excess,
                description="Distribuição do excedente para subcontas",
                date=today,
                is_income=False,
                is_applied_to_balance=True,
                transfer_group=transfer_group_uuid
            )
            account.balance -= excess
            account.save()

        return Response({"message": f"Excedente de {excess} distribuído com sucesso."})

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).select_related('parent')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @extend_schema(
        summary="Retorna a árvore de categorias com orçamentos e despesas",
        description="Retorna a árvore aninhada de categorias do usuário ativo para o período informado (mês/ano), contendo os valores orçados e os gastos realizados.",
        parameters=[
            OpenApiParameter("month", OpenApiTypes.INT, description="Mês de referência (1-12). Padrão: mês atual.", required=False),
            OpenApiParameter("year", OpenApiTypes.INT, description="Ano de referência. Padrão: ano atual.", required=False),
        ],
        responses={200: CategorySerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Retorna a estrutura em árvore de categorias e subcategorias com dados orçamentários do período.
        """
        now = datetime.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        
        # Sincroniza recorrentes até o fim do mês solicitado
        last_day = calendar.monthrange(year, month)[1]
        sync_recurring_transactions(self.request.user, upto_date=date(year, month, last_day))
        
        categories = self.get_queryset()
        
        # Busca orçamentos e gastos do período
        budgets = MonthlyBudget.objects.filter(category__user=self.request.user, month=month, year=year)
        budget_map = {b.category_id: b.amount for b in budgets}
        
        transactions = Transaction.objects.filter(
            category__user=self.request.user, 
            date__month=month, 
            date__year=year,
            is_income=False # Apenas despesas contam contra o orçamento
        ).values('category_id').annotate(total_spent=Sum('amount'))
        
        spent_map = {t['category_id']: t['total_spent'] for t in transactions}
        
        def build_tree(category_list, parent_id=None):
            branch = []
            for category in category_list:
                if category.parent_id == parent_id:
                    children = build_tree(category_list, category.id)
                    
                    assigned = budget_map.get(category.id, 0)
                    spent = spent_map.get(category.id, 0)
                    
                    cat_dict = {
                        'id': str(category.id),
                        'name': category.name,
                        'assigned_amount': float(assigned),
                        'spent_amount': float(spent),
                        'parent': str(category.parent_id) if category.parent_id else None,
                    }
                    if children:
                        cat_dict['children'] = children
                    branch.append(cat_dict)
            return branch
        
        final_tree = build_tree(categories)
        return Response(final_tree)

    @extend_schema(
        summary="Executa alocação automática de orçamento (Auto-assign)",
        description="Aplica regras inteligentes para preenchimento de orçamentos mensais com base no mês anterior (valores gastos, valores orçados ou limpeza total).",
        request=inline_serializer(
            name="CategoryAutoAssignRequest",
            fields={
                "rule": serializers.ChoiceField(choices=["spent_last_month", "assigned_last_month", "clear"], help_text="Regra de preenchimento."),
                "month": serializers.IntegerField(help_text="Mês alvo (1-12)."),
                "year": serializers.IntegerField(help_text="Ano alvo.")
            }
        ),
        responses={
            200: inline_serializer(
                name="CategoryAutoAssignSuccess",
                fields={"message": serializers.CharField()}
            ),
            400: inline_serializer(
                name="CategoryAutoAssignError",
                fields={"error": serializers.CharField()}
            )
        }
    )
    @action(detail=False, methods=['post'])
    def auto_assign(self, request):
        """
        Aplica a regra selecionada para preenchimento em lote de orçamentos de categorias.
        """
        rule = request.data.get('rule')
        month = int(request.data.get('month'))
        year = int(request.data.get('year'))
        
        if not rule or not month or not year:
            return Response({'error': 'Rule, month e year são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
            
        prev_month = month - 1 if month > 1 else 12
        prev_year = year if month > 1 else year - 1
        
        with transaction.atomic():
            if rule == 'spent_last_month':
                transactions = Transaction.objects.filter(
                    category__user=self.request.user, 
                    date__month=prev_month, 
                    date__year=prev_year,
                    is_income=False
                ).values('category_id').annotate(total_spent=Sum('amount'))
                
                for t in transactions:
                    MonthlyBudget.objects.update_or_create(
                        category_id=t['category_id'],
                        month=month,
                        year=year,
                        defaults={'amount': t['total_spent']}
                    )
                    
            elif rule == 'assigned_last_month':
                prev_budgets = MonthlyBudget.objects.filter(
                    category__user=self.request.user,
                    month=prev_month,
                    year=prev_year
                )
                
                for b in prev_budgets:
                    MonthlyBudget.objects.update_or_create(
                        category_id=b.category_id,
                        month=month,
                        year=year,
                        defaults={'amount': b.amount}
                    )
                    
            elif rule == 'clear':
                MonthlyBudget.objects.filter(
                    category__user=self.request.user,
                    month=month,
                    year=year
                ).delete()
            else:
                return Response({'error': 'Regra inválida.'}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response({'message': 'Auto-assign concluído com sucesso.'})

class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MonthlyBudget.objects.filter(category__user=self.request.user)

    @extend_schema(
        summary="Cria ou atualiza uma dotação orçamentária para uma categoria",
        description="Define o valor alocado (envelope) para uma categoria de despesa em um mês e ano específicos.",
        request=inline_serializer(
            name="SetBudgetRequest",
            fields={
                "category": serializers.IntegerField(help_text="ID da Categoria."),
                "month": serializers.IntegerField(help_text="Mês de dotação (1-12)."),
                "year": serializers.IntegerField(help_text="Ano de dotação."),
                "amount": serializers.DecimalField(max_digits=12, decimal_places=2, help_text="Montante alocado.")
            }
        ),
        responses={200: MonthlyBudgetSerializer()}
    )
    @action(detail=False, methods=['post'])
    def set_budget(self, request):
        """
        Garante a criação ou atualização de limites de dotação orçamentária mensal.
        """
        category_id = request.data.get('category')
        month = request.data.get('month')
        year = request.data.get('year')
        amount = request.data.get('amount')
        
        budget, created = MonthlyBudget.objects.update_or_create(
            category_id=category_id,
            month=month,
            year=year,
            defaults={'amount': amount}
        )
        
        return Response(MonthlyBudgetSerializer(budget).data)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        
        if month and year:
            try:
                month_int = int(month)
                year_int = int(year)
                last_day = calendar.monthrange(year_int, month_int)[1]
                sync_recurring_transactions(self.request.user, upto_date=date(year_int, month_int, last_day))
            except (ValueError, TypeError):
                sync_recurring_transactions(self.request.user)
        else:
            sync_recurring_transactions(self.request.user)
            
        qs = Transaction.objects.filter(account__user=self.request.user)
        if month and year:
            try:
                qs = qs.filter(date__month=int(month), date__year=int(year))
            except (ValueError, TypeError):
                pass
        return qs.order_by('-date', '-created_at')

    @transaction.atomic
    def perform_create(self, serializer):
        instance = serializer.save()
        
        if instance.is_recurring and not instance.next_recurrence_date:
            def add_months(sourcedate, months):
                month = sourcedate.month - 1 + months
                year = sourcedate.year + month // 12
                month = month % 12 + 1
                day = min(sourcedate.day, calendar.monthrange(year,month)[1])
                return date(year, month, day)

            if instance.recurrence_interval == 'daily':
                instance.next_recurrence_date = instance.date + timedelta(days=1)
            elif instance.recurrence_interval == 'weekly':
                instance.next_recurrence_date = instance.date + timedelta(days=7)
            elif instance.recurrence_interval == 'monthly':
                instance.next_recurrence_date = add_months(instance.date, 1)
            elif instance.recurrence_interval == 'yearly':
                instance.next_recurrence_date = add_months(instance.date, 12)
            instance.save()
            
        if instance.status == 'realized' and instance.date <= date.today():
            account = instance.account
            if instance.is_income:
                account.balance += instance.amount
            else:
                account.balance -= instance.amount
            account.save()
            instance.is_applied_to_balance = True
            instance.save()

    @transaction.atomic
    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_amount = old_instance.amount
        old_is_income = old_instance.is_income
        old_account = old_instance.account
        old_applied = old_instance.is_applied_to_balance

        new_instance = serializer.save()
        today = date.today()

        # Reverter antigo se aplicado
        if old_applied:
            if old_is_income:
                old_account.balance -= old_amount
            else:
                old_account.balance += old_amount
            old_account.save()
        
        # Aplicar novo se for atual/passado e realizado
        if new_instance.status == 'realized' and new_instance.date <= today:
            account = new_instance.account
            if new_instance.is_income:
                account.balance += new_instance.amount
            else:
                account.balance -= new_instance.amount
            account.save()
            new_instance.is_applied_to_balance = True
        else:
            new_instance.is_applied_to_balance = False
        new_instance.save()

    @transaction.atomic
    def perform_destroy(self, instance):
        if instance.is_applied_to_balance:
            account = instance.account
            if instance.is_income:
                account.balance -= instance.amount
            else:
                account.balance += instance.amount
            account.save()
        
        if instance.transfer_group:
            # Encontra todas as transações do grupo para exclusão coordenada
            group_transactions = Transaction.objects.filter(transfer_group=instance.transfer_group).exclude(id=instance.id)
            for t in group_transactions:
                if t.is_applied_to_balance:
                    acc = t.account
                    if t.is_income: acc.balance -= t.amount
                    else: acc.balance += t.amount
                    acc.save()
            group_transactions.delete()
        
        instance.delete()

    @extend_schema(
        summary="Transfere fundos entre duas contas",
        description="Transfere um valor de uma conta de origem para uma conta de destino. Se as contas possuírem moedas diferentes, um valor convertido ('to_amount') pode ser especificado.",
        request=inline_serializer(
            name="TransferRequest",
            fields={
                "from_account": serializers.UUIDField(help_text="ID da conta de origem."),
                "to_account": serializers.UUIDField(help_text="ID da conta de destino."),
                "amount": serializers.DecimalField(max_digits=12, decimal_places=2, help_text="Valor retirado da conta de origem."),
                "to_amount": serializers.DecimalField(max_digits=12, decimal_places=2, required=False, help_text="Valor depositado na conta de destino (se houver conversão)."),
                "description": serializers.CharField(required=False, default="Transferência", help_text="Descrição curta da transferência."),
                "date": serializers.DateField(help_text="Data da transação (YYYY-MM-DD).")
            }
        ),
        responses={
            200: inline_serializer(
                name="TransferSuccessResponse",
                fields={"message": serializers.CharField()}
            ),
            400: inline_serializer(
                name="TransferErrorResponse",
                fields={"error": serializers.CharField()}
            ),
            404: inline_serializer(
                name="TransferNotFoundErrorResponse",
                fields={"error": serializers.CharField()}
            )
        }
    )
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def transfer(self, request):
        """
        Executa a transferência transacional em lote entre duas contas do usuário.
        """
        from_account_id = request.data.get('from_account')
        to_account_id = request.data.get('to_account')
        amount = request.data.get('amount')
        to_amount = request.data.get('to_amount', amount)
        description = request.data.get('description', 'Transferência')
        date_str = request.data.get('date')
        
        if not_from_account_id := (not from_account_id or not to_account_id or not amount or not date_str):
            return Response({'error': 'Campos obrigatórios ausentes.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from_account = Account.objects.get(id=from_account_id, user=request.user)
            to_account = Account.objects.get(id=to_account_id, user=request.user)
        except Account.DoesNotExist:
            return Response({'error': 'Conta não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            val_amount = Decimal(str(amount))
            val_to_amount = Decimal(str(to_amount))
        except Exception:
            return Response({'error': 'Valores inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

        t_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        group_id = uuid.uuid4()
        applied = (t_date <= date.today())
        
        # 1. Transação de Saída (Origem)
        Transaction.objects.create(
            account=from_account,
            description=f"{description} (Para {to_account.name})",
            amount=val_amount,
            date=t_date,
            is_income=False,
            transfer_group=group_id,
            status='realized',
            is_applied_to_balance=applied
        )
        if applied:
            from_account.balance -= val_amount
            from_account.save()
        
        # 2. Transação de Entrada (Destino)
        Transaction.objects.create(
            account=to_account,
            description=f"{description} (De {from_account.name})",
            amount=val_to_amount,
            date=t_date,
            is_income=True,
            transfer_group=group_id,
            status='realized',
            is_applied_to_balance=applied
        )
        if applied:
            to_account.balance += val_to_amount
            to_account.save()
        
        return Response({'message': 'Transferência concluída com sucesso!'})

    @extend_schema(
        summary="Realiza uma distribuição em lote de fundos para subcontas (Bulk Transfer)",
        description="Permite que um montante total seja debitado de uma conta de origem e distribuído proporcionalmente em depósitos de subcontas de destino coordenadas por um UUID de grupo.",
        request=inline_serializer(
            name="BulkTransferRequest",
            fields={
                "from_account": serializers.UUIDField(help_text="ID da conta de origem."),
                "total_amount": serializers.DecimalField(max_digits=12, decimal_places=2, help_text="Valor total a ser debitado."),
                "date": serializers.DateField(help_text="Data da distribuição (YYYY-MM-DD)."),
                "distributions": inline_serializer(
                    name="BulkTransferDistributionItem",
                    many=True,
                    fields={
                        "to_account": serializers.UUIDField(help_text="ID da subconta de destino."),
                        "amount": serializers.DecimalField(max_digits=12, decimal_places=2, help_text="Valor a ser depositado.")
                    }
                ),
                "source_transaction": serializers.UUIDField(required=False, help_text="ID da transação de origem a ser vinculada ao grupo.")
            }
        ),
        responses={
            200: inline_serializer(
                name="BulkTransferSuccessResponse",
                fields={"message": serializers.CharField()}
            ),
            400: inline_serializer(
                name="BulkTransferErrorResponse",
                fields={"error": serializers.CharField()}
            ),
            404: inline_serializer(
                name="BulkTransferNotFoundErrorResponse",
                fields={"error": serializers.CharField()}
            )
        }
    )
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def bulk_transfer(self, request):
        """
        Executa a distribuição automática do saldo de uma conta de origem para múltiplas subcontas.
        """
        from_account_id = request.data.get('from_account')
        total_amount = request.data.get('total_amount')
        date_str = request.data.get('date')
        distributions = request.data.get('distributions', [])
        source_transaction_id = request.data.get('source_transaction')
        
        if not from_account_id or not total_amount or not date_str or not distributions:
            return Response({'error': 'Campos obrigatórios ausentes.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from_account = Account.objects.get(id=from_account_id, user=request.user)
        except Account.DoesNotExist:
            return Response({'error': 'Conta de origem não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            val_total = Decimal(str(total_amount))
            t_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception:
            return Response({'error': 'Valores ou data inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

        group_id = uuid.uuid4()
        applied = (t_date <= date.today())

        # 0. Vincular a transação original (se houver)
        if source_transaction_id:
            try:
                source_t = Transaction.objects.get(id=source_transaction_id, account__user=request.user)
                source_t.transfer_group = group_id
                source_t.save()
            except Transaction.DoesNotExist:
                pass
        
        # 1. Transação de Saída (Origem)
        Transaction.objects.create(
            account=from_account,
            description="Distribuição Automática",
            amount=val_total,
            date=t_date,
            is_income=False,
            transfer_group=group_id,
            is_applied_to_balance=applied
        )
        if applied:
            from_account.balance -= val_total
            from_account.save()
        
        # 2. Transações de Entrada (Destinos)
        distributed_total = Decimal('0.00')
        for dist in distributions:
            to_account_id = dist.get('to_account')
            amount = Decimal(str(dist.get('amount', 0)))
            
            try:
                to_account = Account.objects.get(id=to_account_id, user=request.user)
            except Account.DoesNotExist:
                continue
                
            Transaction.objects.create(
                account=to_account,
                description=f"Distribuição de {from_account.name}",
                amount=amount,
                date=t_date,
                is_income=True,
                transfer_group=group_id,
                is_applied_to_balance=applied
            )
            if applied:
                to_account.balance += amount
                to_account.save()
            distributed_total += amount
            
        return Response({'message': 'Distribuição concluída com sucesso!'})

    @action(detail=False, methods=['post'])
    def import_file(self, request):
        file = request.FILES.get('file')
        account_id = request.data.get('account')
        
        if not file or not account_id:
            return Response({'error': 'Arquivo e Conta são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            account = Account.objects.get(id=account_id, user=request.user)
        except Account.DoesNotExist:
            return Response({'error': 'Conta não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            
        filename = file.name.lower()
        imported_count = 0
        
        if filename.endswith('.csv'):
            decoded_file = file.read().decode('utf-8', errors='replace').splitlines()
            reader = csv.reader(decoded_file)
            header = next(reader, None)
            
            with transaction.atomic():
                for row in reader:
                    if len(row) < 3:
                        continue
                    try:
                        date_str = row[0]
                        desc = row[1]
                        amount_str = row[2].replace(',', '.')
                        amount = Decimal(amount_str)
                        is_income = amount > 0
                        
                        try:
                            t_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                        except ValueError:
                            try:
                                t_date = datetime.strptime(date_str, '%d/%m/%Y').date()
                            except ValueError:
                                continue
                        
                        applied = (t_date <= date.today())
                        
                        Transaction.objects.create(
                            account=account,
                            description=desc[:255],
                            amount=abs(amount),
                            date=t_date,
                            is_income=is_income,
                            status='realized',
                            is_applied_to_balance=applied
                        )
                        if applied:
                            if is_income:
                                account.balance += abs(amount)
                            else:
                                account.balance -= abs(amount)
                        imported_count += 1
                    except Exception:
                        pass
                account.save()
                
        elif filename.endswith('.ofx'):
            try:
                from ofxparse import OfxParser
                
                ofx = OfxParser.parse(io.BytesIO(file.read()))
                
                with transaction.atomic():
                    for ofx_account in ofx.accounts:
                        for st in ofx_account.statement.transactions:
                            desc = st.payee or st.memo or "Importação OFX"
                            amount = st.amount
                            is_income = amount > 0
                            t_date = st.date.date()
                            
                            applied = (t_date <= date.today())
                            
                            Transaction.objects.create(
                                account=account,
                                description=str(desc)[:255],
                                amount=abs(amount),
                                date=t_date,
                                is_income=is_income,
                                status='realized',
                                is_applied_to_balance=applied
                            )
                            if applied:
                                if is_income:
                                    account.balance += abs(amount)
                                else:
                                    account.balance -= abs(amount)
                            imported_count += 1
                    account.save()
            except ImportError:
                return Response({'error': 'A biblioteca ofxparse não está instalada.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                return Response({'error': f'Falha ao ler arquivo OFX: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Formato não suportado. Envie .csv ou .ofx'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'message': f'{imported_count} transações importadas com sucesso!'})

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).order_by('deadline')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class IconUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Nenhum arquivo enviado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        import os
        icon_path = os.path.join(settings.MEDIA_ROOT, 'icons')
        if not os.path.exists(icon_path):
            os.makedirs(icon_path)
            
        from django.core.files.storage import default_storage
        filename = default_storage.save(f'icons/{file.name}', file)
        
        filename_normalized = filename.replace('\\', '/')
        file_url = request.build_absolute_uri(settings.MEDIA_URL + filename_normalized)
        
        return Response({'url': file_url})

class DistributionTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = DistributionTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DistributionTemplate.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DebtViewSet(viewsets.ModelViewSet):
    serializer_class = DebtSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Debt.objects.filter(user=self.request.user).prefetch_related('payments__account').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DebtPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = DebtPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DebtPayment.objects.filter(debt__user=self.request.user).select_related('debt', 'account').order_by('-date')

    def perform_create(self, serializer):
        debt_id = self.request.data.get('debt')
        amount = Decimal(str(self.request.data.get('amount', '0')))
        account_id = self.request.data.get('account')
        pay_date = self.request.data.get('date') or date.today().isoformat()

        debt = Debt.objects.get(id=debt_id, user=self.request.user)
        account = Account.objects.get(id=account_id) if account_id else None

        txn = None
        if account:
            if debt.is_mine:
                description = f"Pagamento de dívida para {debt.counterparty_name}"
                is_income = False
            else:
                description = f"Pagamento de dívida de {debt.counterparty_name}"
                is_income = True

            txn = Transaction.objects.create(
                account=account,
                amount=amount,
                description=description,
                date=pay_date,
                is_income=is_income,
                is_applied_to_balance=True,
            )

            if is_income:
                account.balance += amount
            else:
                account.balance -= amount
            account.save()

        serializer.save(debt=debt, transaction=txn, account=account)

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()
        if payment.transaction and payment.account:
            if payment.debt.is_mine:
                payment.account.balance += payment.amount
            else:
                payment.account.balance -= payment.amount
            payment.account.save()
            payment.transaction.delete()
        return super().destroy(request, *args, **kwargs)

class ResetDataView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Zera todos os dados financeiros do usuário logado",
        description="Exclui de forma permanente todas as transações, contas, categorias, metas, dívidas e modelos de distribuição do usuário autenticado, mantendo apenas o seu cadastro e perfil de acesso.",
        responses={
            200: inline_serializer(
                name="ResetDataSuccessResponse",
                fields={"message": serializers.CharField()}
            )
        }
    )
    @transaction.atomic
    def post(self, request):
        user = request.user
        
        Debt.objects.filter(user=user).delete()
        DistributionTemplate.objects.filter(user=user).delete()
        Goal.objects.filter(user=user).delete()
        Transaction.objects.filter(account__user=user).delete()
        Account.objects.filter(user=user).delete()
        Category.objects.filter(user=user).delete()
        
        return Response({"message": "Todos os seus dados financeiros foram excluídos com sucesso. Você pode recomeçar do zero agora!"}, status=status.HTTP_200_OK)
