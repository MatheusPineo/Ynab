import uuid
import logging

logger = logging.getLogger(__name__)
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
    Account, Category, Payee, Transaction, Goal, MonthlyBudget, 
    DistributionTemplate, Debt, DebtPayment, CategoryGoal, TransactionRule
)
from .serializers import (
    AccountSerializer, CategorySerializer, TransactionSerializer, GoalSerializer, 
    MonthlyBudgetSerializer, DistributionTemplateSerializer, DebtSerializer, DebtPaymentSerializer
)
from .reconciliation import AccountReconciliationService

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
        is_recurring=False,
        date__lte=today
    )
    for t in pending_current:
        acc = t.account
        if t.is_income: acc.balance += t.amount
        else: acc.balance -= t.amount
        acc.save()
        t.is_applied_to_balance = True
        t._skip_balance_update = True
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
                # Herda o status do template: pendentes continuam pendentes
                inherited_status = template.status if template.status in ('pending', 'realized', 'scheduled') else 'realized'
                applied = (new_date <= today and inherited_status == 'realized')
                new_t = Transaction(
                    account=template.account,
                    category=template.category,
                    amount=template.amount,
                    description=template.description,
                    date=new_date,
                    is_income=template.is_income,
                    is_recurring=False,
                    status=inherited_status,
                    is_applied_to_balance=applied
                )
                new_t._skip_balance_update = True
                new_t.save()
                
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
        
        # Se possuir saldo (positivo ou negativo)
        if account.balance != 0:
            tx = Transaction(
                account=account,
                amount=abs(account.balance),
                description=f"Saldo Inicial de {account.name}",
                date=date.today(),
                is_income=account.balance > 0,
                status='realized',
                is_applied_to_balance=True
            )
            tx._skip_balance_update = True
            tx.save()

    @transaction.atomic
    def perform_update(self, serializer):
        old_account = self.get_object()
        old_balance = old_account.balance
        
        account = serializer.save()
        
        # Se houver alteração no saldo
        if account.balance != old_balance:
            diff = account.balance - old_balance
            if diff > 0:
                tx = Transaction(
                    account=account,
                    amount=diff,
                    description=f"Ajuste de Saldo (Aumento) de {account.name}",
                    date=date.today(),
                    is_income=True,
                    status='realized',
                    is_applied_to_balance=True
                )
                tx._skip_balance_update = True
                tx.save()
            else:
                tx = Transaction(
                    account=account,
                    amount=abs(diff),
                    description=f"Ajuste de Saldo (Redução) de {account.name}",
                    date=date.today(),
                    is_income=False,
                    status='realized',
                    is_applied_to_balance=True
                )
                tx._skip_balance_update = True
                tx.save()

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
                        'exclude_from_totals': account.exclude_from_totals,
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
                    
                tx = Transaction(
                    account=s,
                    amount=amount_to_deduct,
                    description=f"Cobertura de saldo da conta {account.name}",
                    date=today,
                    is_income=False,
                    is_applied_to_balance=True,
                    transfer_group=transfer_group_uuid
                )
                tx._skip_balance_update = True
                tx.save()
                s.balance -= amount_to_deduct
                s.save()
                total_covered += amount_to_deduct
            
            if total_covered > 0:
                tx_recv = Transaction(
                    account=account,
                    amount=total_covered,
                    description="Cobertura recebida das subcontas",
                    date=today,
                    is_income=True,
                    is_applied_to_balance=True,
                    transfer_group=transfer_group_uuid
                )
                tx_recv._skip_balance_update = True
                tx_recv.save()
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
                tx_sib = Transaction(
                    account=s,
                    amount=amount,
                    description=f"Excedente recebido da conta {account.name}",
                    date=today,
                    is_income=True,
                    is_applied_to_balance=True,
                    transfer_group=transfer_group_uuid
                )
                tx_sib._skip_balance_update = True
                tx_sib.save()
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

                tx_res = Transaction(
                    account=reserve,
                    amount=remaining,
                    description=f"Excedente recebido da conta {account.name}",
                    date=today,
                    is_income=True,
                    is_applied_to_balance=True,
                    transfer_group=transfer_group_uuid
                )
                tx_res._skip_balance_update = True
                tx_res.save()
                reserve.balance += remaining
                reserve.save()

            # Deduct total excess from source account
            tx_src = Transaction(
                account=account,
                amount=excess,
                description="Distribuição do excedente para subcontas",
                date=today,
                is_income=False,
                is_applied_to_balance=True,
                transfer_group=transfer_group_uuid
            )
            tx_src._skip_balance_update = True
            tx_src.save()
            account.balance -= excess
            account.save()

        return Response({"message": f"Excedente de {excess} distribuído com sucesso."})

    @action(detail=True, methods=['get', 'post'])
    def reconcile_status(self, request, pk=None):
        """
        Retorna as métricas contábeis da conta (soma das transações cleared vs uncleared vs total).
        """
        account = self.get_object()
        metrics = AccountReconciliationService.get_reconciliation_status(account)
        return Response({
            "cleared_balance": float(metrics['cleared_balance']),
            "uncleared_balance": float(metrics['uncleared_balance']),
            "total_balance": float(metrics['total_balance']),
            "last_reconciled": metrics['last_reconciled']
        })

    @action(detail=True, methods=['post'])
    def reconcile_adjust(self, request, pk=None):
        """
        Gera uma transação de ajuste automático de reconciliação de saldo se a soma de transações cleared
        for diferente do saldo informado no extrato físico/PDF real.
        """
        account = self.get_object()
        statement_balance = request.data.get('statement_balance')
        if statement_balance is None:
            return Response({"error": "O campo 'statement_balance' é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            statement_balance_dec = Decimal(str(statement_balance))
        except (TypeError, ValueError):
            return Response({"error": "O campo 'statement_balance' deve ser um valor numérico válido."}, status=status.HTTP_400_BAD_REQUEST)

        adjustment_tx = AccountReconciliationService.create_adjustment_transaction(
            account=account,
            user=request.user,
            statement_balance=statement_balance_dec
        )
        if adjustment_tx:
            return Response({
                "message": "Transação de ajuste automático criada com sucesso.",
                "transaction_id": adjustment_tx.id,
                "amount": float(adjustment_tx.amount),
                "is_income": adjustment_tx.is_income
            })
        return Response({"message": "Nenhum ajuste necessário, o saldo compensado já bate perfeitamente com o extrato."})

    @action(detail=True, methods=['post'])
    def reconcile_finalize(self, request, pk=None):
        """
        Fecha a reconciliação e trava todas as transações da conta que têm cleared=True de forma ACID.
        """
        account = self.get_object()
        updated_count = AccountReconciliationService.finalize_reconciliation(account)
        return Response({
            "message": "Reconciliação finalizada com sucesso. Lote contábil travado contra alterações acidentais.",
            "locked_transactions_count": updated_count
        })

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
        Retorna a estrutura em árvore de categorias e subcategorias com dados orçamentários do período,
        integrando com o YNABBudgetService para computar rollover acumulado de envelopes e atividade líquida mensal.
        """
        from .services import YNABBudgetService
        
        now = datetime.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        
        # Sincroniza recorrentes até o fim do mês solicitado
        last_day = calendar.monthrange(year, month)[1]
        sync_recurring_transactions(self.request.user, upto_date=date(year, month, last_day))
        
        categories = self.get_queryset()
        
        # Calcula a malha contábil do orçamento usando o YNABBudgetService
        budget_data = YNABBudgetService.calculate_envelope_states(self.request.user, month, year)
        rta = budget_data['ready_to_assign']
        envelope_states = budget_data['envelope_states']
        
        def build_tree(category_list, parent_id=None):
            branch = []
            for category in category_list:
                if category.parent_id == parent_id:
                    children = build_tree(category_list, category.id)
                    
                    # Categoria folha (subcategoria de despesa)
                    if not children:
                        state = envelope_states.get(category.id, {
                            'assigned': Decimal('0.00'),
                            'spent': Decimal('0.00'),
                            'rollover': Decimal('0.00'),
                            'available': Decimal('0.00'),
                            'overspending_type': None
                        })
                        assigned = state['assigned']
                        spent = state['spent']
                        rollover = state['rollover']
                        available = state['available']
                        overspending_type = state['overspending_type']
                        
                        # Computa a necessidade de metas (Goals) usando o YNABGoalService
                        from .services import YNABGoalService
                        underfunded = YNABGoalService.calculate_underfunded(category, month, year, available, assigned)
                        
                        # Obtém o Goal ativo se houver
                        active_goal = getattr(category, 'active_goal', None)
                        goal_type = active_goal.goal_type if active_goal else None
                        goal_amount = float(active_goal.amount) if active_goal else 0.00
                        
                        cat_dict = {
                            'id': str(category.id),
                            'name': category.name,
                            'assigned_amount': float(assigned),
                            'spent_amount': float(spent),
                            'rollover_amount': float(rollover),
                            'available_amount': float(available),
                            'overspending_type': overspending_type,
                            'goal_type': goal_type,
                            'goal_amount': goal_amount,
                            'underfunded_amount': float(underfunded),
                            'parent': str(category.parent_id) if category.parent_id else None,
                        }
                    # Categoria pai (grupo de categorias) -> consolida a soma das subcategorias
                    else:
                        sum_assigned = sum(child['assigned_amount'] for child in children)
                        sum_spent = sum(child['spent_amount'] for child in children)
                        sum_rollover = sum(child['rollover_amount'] for child in children)
                        sum_available = sum(child['available_amount'] for child in children)
                        sum_underfunded = sum(child.get('underfunded_amount', 0.00) for child in children)
                        
                        cat_dict = {
                            'id': str(category.id),
                            'name': category.name,
                            'assigned_amount': float(sum_assigned),
                            'spent_amount': float(sum_spent),
                            'rollover_amount': float(sum_rollover),
                            'available_amount': float(sum_available),
                            'overspending_type': None,
                            'goal_type': None,
                            'goal_amount': 0.00,
                            'underfunded_amount': float(sum_underfunded),
                            'parent': str(category.parent_id) if category.parent_id else None,
                            'children': children
                        }
                    
                    branch.append(cat_dict)
            return branch
        
        final_tree = build_tree(categories)
        
        # Para manter compatibilidade instantânea com o frontend React (que espera um array bruto raiz),
        # nós retornamos a lista final_tree diretamente e injetamos o ready_to_assign
        # através de um cabeçalho HTTP customizado 'X-Ready-To-Assign'.
        response = Response(final_tree)
        response['X-Ready-To-Assign'] = str(rta)
        return response

    @action(detail=False, methods=['get'])
    def ready_to_assign(self, request):
        """
        Retorna o valor do Ready to Assign para o período solicitado.
        """
        from .services import YNABBudgetService
        
        now = datetime.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        
        budget_data = YNABBudgetService.calculate_envelope_states(self.request.user, month, year)
        return Response({'ready_to_assign': float(budget_data['ready_to_assign'])})

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
        today = date.today()
        status_data = serializer.validated_data.get('status', 'realized')
        date_data = serializer.validated_data.get('date', today)
        is_applied = (status_data == 'realized' and date_data <= today)
        
        instance = serializer.save(is_applied_to_balance=is_applied)
        
        # Gerenciamento do agendamento recorrente
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

    @transaction.atomic
    def perform_update(self, serializer):
        today = date.today()
        status_data = serializer.validated_data.get('status', 'realized')
        date_data = serializer.validated_data.get('date', today)
        is_applied = (status_data == 'realized' and date_data <= today)
        
        # O save() do modelo Transaction cuida automaticamente de ajustar
        # e aplicar o novo saldo na conta e sincronizar a transferência
        serializer.save(is_applied_to_balance=is_applied)

    @transaction.atomic
    def perform_destroy(self, instance):
        # O delete() do modelo Transaction reverte saldos
        # e remove de forma atômica e cascateada qualquer espelho vinculado
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
        Executa a transferência transacional usando a nova engine robusta e atômica.
        """
        from_account_id = request.data.get('from_account')
        to_account_id = request.data.get('to_account')
        amount = request.data.get('amount')
        to_amount = request.data.get('to_amount', amount)
        description = request.data.get('description', 'Transferência')
        date_str = request.data.get('date')
        
        if not from_account_id or not to_account_id or not amount or not date_str:
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
        applied = (t_date <= date.today())
        
        # Localiza ou cria o Payee de transferência
        dest_payee, _ = Payee.objects.get_or_create(
            user=request.user,
            name=f"Transferência: {to_account.name}",
            transfer_acct=to_account
        )
        
        # Cria a transação de origem vinculada ao Payee de transferência.
        # A engine do modelo Transaction cuida de todo o espelhamento de forma 100% ACID.
        tx = Transaction.objects.create(
            account=from_account,
            payee=dest_payee,
            description=f"{description} (Para {to_account.name})",
            amount=val_amount,
            date=t_date,
            is_income=False,
            status='realized',
            is_applied_to_balance=applied,
            transfer_group=uuid.uuid4()
        )
        
        # Caso haja conversão de moeda com valor de destino diferente, ajusta a transação espelhada
        if val_to_amount != val_amount and tx.linked_transfer:
            mirror = tx.linked_transfer
            if mirror.is_applied_to_balance:
                # Reverte saldo com o valor antigo
                mirror.account.balance -= mirror.amount
                mirror.account.save()
            
            mirror.amount = val_to_amount
            mirror.save(_syncing=True)
            
            if mirror.is_applied_to_balance:
                # Aplica com o valor correto convertido
                mirror.account.balance += val_to_amount
                mirror.account.save()
        
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
        
        # 1. Transação de Saída (Origem) - O saldo é ajustado pelo hook do save()
        Transaction.objects.create(
            account=from_account,
            description="Distribuição Automática",
            amount=val_total,
            date=t_date,
            is_income=False,
            transfer_group=group_id,
            is_applied_to_balance=applied
        )
        
        # 2. Transações de Entrada (Destinos) - Os saldos são ajustados pelos hooks do save()
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
                        
                        tx = Transaction(
                            account=account,
                            description=desc[:255],
                            amount=abs(amount),
                            date=t_date,
                            is_income=is_income,
                            status='realized',
                            is_applied_to_balance=applied
                        )
                        tx._skip_balance_update = True
                        tx.save()
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
                            
                            tx = Transaction(
                                account=account,
                                description=str(desc)[:255],
                                amount=abs(amount),
                                date=t_date,
                                is_income=is_income,
                                status='realized',
                                is_applied_to_balance=applied
                            )
                            tx._skip_balance_update = True
                            tx.save()
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
        return Response({'message': f'{imported_count} transações importadas com sucesso!'})

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        """
        Destrava excepcionalmente uma transação que está reconciliada.
        """
        transaction_instance = self.get_object()
        success = AccountReconciliationService.unlock_transaction(transaction_instance)
        if success:
            return Response({"message": "Transação destravada com sucesso para edições administrativas."})
        return Response({"message": "Esta transação não estava reconciliada."}, status=status.HTTP_400_BAD_REQUEST)

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

    @action(detail=True, methods=['post'])
    def add_debt_amount(self, request, pk=None):
        debt = self.get_object()
        amount = Decimal(str(request.data.get('amount', '0')))
        account_id = request.data.get('account')
        pay_date = request.data.get('date') or date.today().isoformat()

        if amount <= 0:
            return Response({"detail": "O valor do débito deve ser maior que zero."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Atualiza o original_amount somando o acréscimo
            debt.original_amount += amount
            
            # Cria a transação correspondente caso seja vinculada a uma conta
            account = Account.objects.get(id=account_id) if account_id else None
            if account:
                if debt.is_mine:
                    # Minha dívida: recebi mais dinheiro (empréstimo contraído) -> Receita (is_income = True)
                    description = f"Acréscimo de dívida (empréstimo de {debt.counterparty_name})"
                    is_income = True
                else:
                    # Eles me devem: emprestei mais dinheiro -> Despesa (is_income = False)
                    description = f"Acréscimo de dívida (dinheiro emprestado para {debt.counterparty_name})"
                    is_income = False

                # Cria a transação real
                tx = Transaction(
                    account=account,
                    amount=amount,
                    description=description,
                    date=pay_date,
                    is_income=is_income,
                    is_applied_to_balance=True,
                )
                tx._skip_balance_update = True
                tx.save()

                # Aplica o ajuste de saldo
                if is_income:
                    account.balance += amount
                else:
                    account.balance -= amount
                account.save()

                # Adiciona notas explicativas para auditoria
                notes_append = f"\n[Acréscimo de {amount} {debt.currency} em {pay_date} via {account.name}]"
                debt.notes = (debt.notes + notes_append).strip()

            debt.save()

        # Retornar o serializer atualizado
        serializer = self.get_serializer(debt)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

            txn = Transaction(
                account=account,
                amount=amount,
                description=description,
                date=pay_date,
                is_income=is_income,
                is_applied_to_balance=True,
            )
            txn._skip_balance_update = True
            txn.save()

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
            
            # Blindagem contábil: ativa a flag de bypass antes de deletar
            payment.transaction._skip_balance_update = True
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

from .models import CreditCard, CreditCardBill, CreditCardTransaction, Installment
from .serializers import CreditCardSerializer, CreditCardBillSerializer, CreditCardTransactionSerializer, InstallmentSerializer
from .services import process_credit_card_transaction

class CreditCardViewSet(viewsets.ModelViewSet):
    serializer_class = CreditCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CreditCard.objects.filter(account__user=self.request.user)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'account' not in data or not data['account']:
            name = data.get('name', 'Cartão de Crédito')
            currency = data.get('currency', 'BRL')
            account = Account.objects.create(
                user=request.user,
                name=name,
                account_type='credit_card',
                currency=currency,
                balance=Decimal('0.00')
            )
            data['account'] = account.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @extend_schema(
        summary="Retorna as faturas de um cartão de crédito específico",
        description="Lista todas as faturas geradas para o cartão informado, incluindo suas respectivas parcelas e montante total.",
        responses={200: CreditCardBillSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def bills(self, request, pk=None):
        card = self.get_object()
        bills_qs = CreditCardBill.objects.filter(credit_card=card).order_by('-year', '-month')
        serializer = CreditCardBillSerializer(bills_qs, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Cadastra uma nova compra no cartão (Compra Matriz)",
        description="Lança uma transação no cartão, calculando automaticamente as faturas e datas com base no dia de fechamento (closing_day) e alocando as parcelas e reservas no YNAB.",
        request=inline_serializer(
            name="CreateCreditCardTransactionRequest",
            fields={
                "description": serializers.CharField(help_text="Descrição da compra."),
                "date": serializers.DateField(help_text="Data da transação."),
                "total_amount": serializers.DecimalField(max_digits=12, decimal_places=2, help_text="Valor total."),
                "category_id": serializers.IntegerField(required=False, allow_null=True, help_text="ID da Categoria."),
                "installment_count": serializers.IntegerField(default=1, help_text="Número de parcelas."),
                "original_currency": serializers.CharField(default='BRL', help_text="Moeda original da transação."),
                "original_amount": serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True),
                "exchange_rate": serializers.DecimalField(max_digits=10, decimal_places=4, default=1.0000, help_text="Taxa de conversão / Spread."),
                "iof_amount": serializers.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="IOF adicionado.")
            }
        ),
        responses={201: CreditCardTransactionSerializer()}
    )
    @action(detail=True, methods=['post'])
    def create_transaction(self, request, pk=None):
        card = self.get_object()
        data = request.data
        
        try:
            date_tx = datetime.strptime(data['date'], '%Y-%m-%d').date()
            matrix_tx, _ = process_credit_card_transaction(
                credit_card_id=card.id,
                description=data['description'],
                date_tx=date_tx,
                total_amount=Decimal(str(data['total_amount'])),
                category_id=data.get('category_id'),
                installment_count=int(data.get('installment_count', 1)),
                original_currency=data.get('original_currency', 'BRL'),
                original_amount=Decimal(str(data['original_amount'])) if data.get('original_amount') else None,
                exchange_rate=Decimal(str(data.get('exchange_rate', '1.0000'))),
                iof_amount=Decimal(str(data.get('iof_amount', '0.00')))
            )
            serializer = CreditCardTransactionSerializer(matrix_tx)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Antecipa uma parcela futura de cartão de crédito",
        description="Marca uma parcela futura como antecipada ('anticipated'), trazendo o saldo para a fatura aberta do mês atual.",
        request=inline_serializer(
            name="AnticipateInstallmentRequest",
            fields={"installment_id": serializers.IntegerField(help_text="ID da parcela a ser antecipada.")}
        ),
        responses={
            200: inline_serializer(
                name="AnticipateInstallmentSuccess",
                fields={"message": serializers.CharField()}
            ),
            400: inline_serializer(
                name="AnticipateInstallmentError",
                fields={"error": serializers.CharField()}
            )
        }
    )
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def anticipate_installment(self, request, pk=None):
        card = self.get_object()
        installment_id = request.data.get('installment_id')
        
        try:
            inst = Installment.objects.get(id=installment_id, transaction__credit_card=card)
            if inst.status in ['paid', 'anticipated']:
                return Response({'error': 'Parcela já paga ou antecipada.'}, status=status.HTTP_400_BAD_REQUEST)
                
            inst.status = 'anticipated'
            inst.save()

            # Executa a transferência de envelopes YNAB e registra transação/saldo se aplicável
            from .services import process_installment_ynab
            process_installment_ynab(inst)

            return Response({'message': f'Parcela {inst.number} antecipada com sucesso.'})
        except Installment.DoesNotExist:
            return Response({'error': 'Parcela não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

from rest_framework.parsers import MultiPartParser, FormParser
from .models import TransactionInbox
from .serializers import TransactionInboxSerializer
from .tasks import process_inbox_document

class InboxUploadView(APIView):
    """
    Endpoint DRF para upload em lote (bulk upload) de recibos e comprovantes.
    Aceita múltiplos arquivos sob o parâmetro 'files' (multipart/form-data)
    e inicia o processamento assíncrono em segundo plano via Celery.
    Retorna HTTP 202 Accepted instantaneamente.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload em lote de recibos/comprovantes para área de staging",
        description="Recebe uma lista de arquivos (imagens/PDFs) via multipart/form-data e despacha tarefas assíncronas para extração multimodal em lote. Retorna HTTP 202 Accepted com as informações iniciais das instâncias criadas.",
        responses={
            202: inline_serializer(
                name="InboxUploadSuccess",
                fields={
                    "message": serializers.CharField(),
                    "items": serializers.ListField(
                        child=inline_serializer(
                            name="InboxUploadItem",
                            fields={
                                "id": serializers.UUIDField(),
                                "filename": serializers.CharField(),
                                "status": serializers.CharField(),
                            }
                        )
                    )
                }
            ),
            400: inline_serializer(
                name="InboxUploadError",
                fields={"error": serializers.CharField()}
            )
        }
    )
    def post(self, request, *args, **kwargs):
        files = request.FILES.getlist('files')
        
        # Se for um único arquivo sob 'file', suportamos também para compatibilidade
        if not files and 'file' in request.FILES:
            files = [request.FILES['file']]

        if not files:
            return Response(
                {"error": "Nenhum arquivo enviado sob a chave 'files' ou 'file'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_items = []
        
        # Executamos a criação sob transação para consistência
        with transaction.atomic():
            for f in files:
                # Instancia o inbox para o usuário autenticado
                inbox = TransactionInbox.objects.create(
                    user=request.user,
                    file=f,
                    status='pending'
                )
                
                # Despacha a tarefa assíncrona pós-commit de forma extremamente resiliente
                def dispatch_task(inbox_id=inbox.id):
                    try:
                        process_inbox_document.delay(inbox_id)
                        logger.info(f"[Inbox] Tarefa Celery despachada pós-commit com sucesso para ID {inbox_id}")
                    except Exception as celery_err:
                        logger.warning(
                            f"[Inbox] Falha ao despachar tarefa via Celery (Redis offline?). "
                            f"Iniciando processamento alternativo via Thread local para ID {inbox_id}. Erro: {celery_err}"
                        )
                        import threading
                        threading.Thread(
                            target=process_inbox_document,
                            args=(inbox_id,),
                            daemon=True
                        ).start()

                transaction.on_commit(dispatch_task)
                
                created_items.append({
                    "id": str(inbox.id),
                    "filename": f.name,
                    "status": inbox.status
                })

        return Response(
            {
                "message": "Upload de arquivos concluído. Processamento assíncrono iniciado com sucesso.",
                "items": created_items
            },
            status=status.HTTP_202_ACCEPTED
        )


class TransactionInboxViewSet(viewsets.ModelViewSet):
    """
    ViewSet DRF para gerenciar os itens na área de staging (inbox).
    Garante o isolamento multitenant estrito e fornece uma ação atômica para
    aprovar o recibo, criando a transação financeira real correspondente.
    """
    serializer_class = TransactionInboxSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], authentication_classes=[])
    def debug_key(self, request):
        import os
        import requests
        from django.conf import settings
        env_key = os.environ.get('GEMINI_API_KEY', '')
        settings_key = getattr(settings, 'GEMINI_API_KEY', '')
        
        test_status = None
        test_response_body = None
        if env_key:
            test_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={env_key}"
            test_payload = {
                "contents": [{"parts": [{"text": "Diga OK."}]}]
            }
            try:
                res = requests.post(test_url, json=test_payload, headers={"Content-Type": "application/json"}, timeout=10)
                test_status = res.status_code
                try:
                    test_response_body = res.json()
                except Exception:
                    test_response_body = res.text
            except Exception as test_err:
                test_status = "Erro de Conexão"
                test_response_body = str(test_err)

        return Response({
            "env_key_configured": bool(env_key),
            "env_key_length": len(env_key),
            "env_key_prefix": env_key[:5] if env_key else "",
            "env_key_suffix": env_key[-5:] if env_key else "",
            "settings_key_configured": bool(settings_key),
            "settings_key_length": len(settings_key),
            "settings_key_prefix": settings_key[:5] if settings_key else "",
            "settings_key_suffix": settings_key[-5:] if settings_key else "",
            "gemini_test_status": test_status,
            "gemini_test_response": test_response_body
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], authentication_classes=[])
    def debug_tx(self, request):
        """Endpoint TEMPORÁRIO de diagnóstico para investigar transações sumidas. REMOVER após resolução."""
        from django.contrib.auth.models import User
        from .models import Transaction, Account, TransactionInbox
        
        email = request.query_params.get('email', 'matheuskrx@gmail.com')
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": f"Usuário {email} não encontrado"})
        
        # 1. Buscar transações com Aldi/Amanhecer/Continente no banco
        search_terms = ['aldi', 'amanhecer', 'continente', 'poupança', 'poupanca', 'distribuição', 'distribuicao']
        found_txs = []
        for term in search_terms:
            txs = Transaction.objects.filter(
                account__user=user,
                description__icontains=term
            ).order_by('-date')
            for t in txs:
                found_txs.append({
                    "id": t.id,
                    "description": t.description,
                    "amount": str(t.amount),
                    "date": str(t.date),
                    "account_id": t.account_id,
                    "account_name": t.account.name,
                    "is_income": t.is_income,
                    "status": t.status,
                    "is_applied_to_balance": t.is_applied_to_balance,
                    "created_at": str(t.created_at),
                    "matched_term": term,
                })
        
        # 2. Buscar TODOS os items de inbox do usuário (aprovados e pendentes)
        all_inbox = TransactionInbox.objects.filter(user=user).order_by('-created_at')[:20]
        inbox_items = []
        for item in all_inbox:
            inbox_items.append({
                "id": str(item.id),
                "status": item.status,
                "created_at": str(item.created_at),
                "has_validated_tx": item.validated_transaction_id is not None,
                "validated_tx_id": item.validated_transaction_id,
                "ai_suggestions_keys": list(item.ai_suggestions.keys()) if item.ai_suggestions else [],
                "ai_suggestions_tx_count": len(item.ai_suggestions.get('transactions', [])) if item.ai_suggestions else 0,
                "ai_suggestions_preview": str(item.ai_suggestions)[:500] if item.ai_suggestions else None,
                "error_message": item.error_message,
            })
        
        # 3. Contas do usuário
        accounts = []
        for acc in Account.objects.filter(user=user).order_by('id'):
            accounts.append({
                "id": acc.id,
                "name": acc.name,
                "parent_id": acc.parent_id,
                "balance": str(acc.balance),
            })
        
        # 4. Total de transações maio 2026
        may_count = Transaction.objects.filter(
            account__user=user,
            date__month=5,
            date__year=2026
        ).count()
        
        total_count = Transaction.objects.filter(account__user=user).count()
        
        return Response({
            "user_id": user.id,
            "user_email": user.email,
            "total_transactions": total_count,
            "may_2026_transactions": may_count,
            "search_results": found_txs,
            "inbox_items": inbox_items,
            "accounts": accounts,
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], authentication_classes=[])
    def fix_dates(self, request):
        """Endpoint TEMPORÁRIO para corrigir datas erradas (2024→2026) e duplicatas da IA. REMOVER após uso."""
        from django.contrib.auth.models import User
        from .models import Transaction
        from datetime import date as dt_date
        from decimal import Decimal
        
        email = request.data.get('email', 'matheuskrx@gmail.com')
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": f"Usuário {email} não encontrado"})
        
        fixed = []
        deleted = []
        
        # 1. Buscar transações com ano 2024 que foram criadas em 2026 (bug da IA)
        wrong_year_txs = Transaction.objects.filter(
            account__user=user,
            date__year=2024,
            created_at__year=2026
        ).order_by('description', 'date', 'created_at')
        
        # 2. Agrupar por (description, amount, account_id) para encontrar duplicatas
        groups = {}
        for t in wrong_year_txs:
            key = (t.description.strip().upper(), str(t.amount), t.account_id)
            if key not in groups:
                groups[key] = []
            groups[key].append(t)
        
        for key, txs in groups.items():
            # Manter apenas a primeira (mais antiga), deletar as outras
            keeper = txs[0]
            
            # Corrigir a data: 2024 → 2026
            old_date = keeper.date
            new_date = dt_date(2026, old_date.month, old_date.day)
            keeper.date = new_date
            keeper._skip_balance_update = True
            keeper._skip_reconciliation_lock = True
            keeper.save()
            
            fixed.append({
                "id": keeper.id,
                "description": keeper.description,
                "old_date": str(old_date),
                "new_date": str(new_date),
                "amount": str(keeper.amount),
            })
            
            # Deletar duplicatas (todas exceto a keeper)
            for dup in txs[1:]:
                # Reverter o saldo se a duplicata estava aplicada
                if dup.is_applied_to_balance:
                    acc = dup.account
                    if dup.is_income:
                        acc.balance -= dup.amount
                    else:
                        acc.balance += dup.amount
                    acc.save()
                
                deleted.append({
                    "id": dup.id,
                    "description": dup.description,
                    "amount": str(dup.amount),
                    "date": str(dup.date),
                    "account_name": dup.account.name,
                })
                dup.delete()
        
        return Response({
            "fixed_dates": fixed,
            "deleted_duplicates": deleted,
            "total_fixed": len(fixed),
            "total_deleted": len(deleted),
        })

    def get_queryset(self):
        # Garante o isolamento multitenant estrito ordenando por mais recentes e exibindo apenas itens pendentes de homologação completa
        return TransactionInbox.objects.filter(user=self.request.user, validated_transaction__isnull=True).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Aprova o item da inbox de forma atômica, criando a transação correspondente no banco de dados.
        """
        inbox = self.get_object()

        account_id = request.data.get('account')
        category_id = request.data.get('category')
        amount = request.data.get('amount')
        description = request.data.get('description', '')
        date_str = request.data.get('date')
        is_income = request.data.get('is_income', False)
        index = request.data.get('index')  # Novo parâmetro (opcional)

        if not account_id or amount is None or not date_str:
            return Response(
                {"error": "Campos obrigatórios ausentes: conta, valor ou data da transação."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from django.db import transaction
            from django.core.exceptions import ValidationError
            from .models import Account, Category, Transaction
            
            try:
                account_id_int = int(str(account_id).strip())
                account = Account.objects.get(id=account_id_int, user=request.user)
            except (Account.DoesNotExist, ValidationError, ValueError, TypeError):
                return Response({"error": "Conta selecionada inválida ou não encontrada."}, status=status.HTTP_400_BAD_REQUEST)

            category = None
            if category_id and str(category_id).strip().lower() != 'none':
                try:
                    category_id_int = int(str(category_id).strip())
                    category = Category.objects.get(id=category_id_int, user=request.user)
                except (Category.DoesNotExist, ValidationError, ValueError, TypeError):
                    category = None

            with transaction.atomic():
                from decimal import Decimal
                from datetime import datetime, date
                
                try:
                    amount_dec = Decimal(str(amount))
                except Exception:
                    amount_dec = Decimal('0.00')

                try:
                    tx_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                except Exception:
                    tx_date = date.today()

                # 1. Cria a transação real ou compra de cartão de crédito
                if account.account_type == 'credit_card':
                    from .services import process_credit_card_transaction
                    credit_card = getattr(account, 'credit_card_config', None)
                    if not credit_card:
                        # Fallback caso a configuração não esteja presente
                        transaction_obj = Transaction.objects.create(
                            account=account,
                            category=category,
                            amount=amount_dec,
                            description=description,
                            date=tx_date,
                            is_income=is_income,
                            status='realized',
                            is_applied_to_balance=(tx_date <= date.today())
                        )
                    else:
                        # Processa como compra de cartão oficial YNAB
                        matrix_tx, installments = process_credit_card_transaction(
                            credit_card_id=credit_card.id,
                            description=description,
                            date_tx=tx_date,
                            total_amount=amount_dec,
                            category_id=category.id if category else None,
                            installment_count=1,
                            original_currency=account.currency or 'BRL'
                        )
                        
                        # Busca transação de envelope ou core criada no cartão
                        transaction_obj = Transaction.objects.filter(
                            account=account,
                            description__icontains=matrix_tx.description,
                            amount=amount_dec,
                            date=tx_date
                        ).first()
                        
                        if not transaction_obj:
                            # Fallback para associar com o inbox
                            transaction_obj = Transaction.objects.create(
                                account=account,
                                category=category,
                                amount=amount_dec,
                                description=description,
                                date=tx_date,
                                is_income=is_income,
                                status='realized',
                                is_applied_to_balance=(tx_date <= date.today())
                            )
                else:
                    transaction_obj = Transaction.objects.create(
                        account=account,
                        category=category,
                        amount=amount_dec,
                        description=description,
                        date=tx_date,
                        is_income=is_income,
                        status='realized',
                        is_applied_to_balance=(tx_date <= date.today())
                    )

                # 2. Se for um lote de múltiplas transações, atualiza o status de aprovação do item específico
                has_transactions = inbox.ai_suggestions and 'transactions' in inbox.ai_suggestions
                all_approved = True
                
                if index is not None and has_transactions:
                    try:
                        idx = int(index)
                        txs = inbox.ai_suggestions.get('transactions', [])
                        if 0 <= idx < len(txs):
                            txs[idx]['approved'] = True
                            inbox.ai_suggestions['transactions'] = txs
                            
                        # Verifica se todas as transações do lote foram aprovadas
                        all_approved = all(tx.get('approved', False) for tx in txs)
                    except (ValueError, TypeError) as e:
                        logger.error(f"[Inbox Approve] Erro ao processar o índice {index}: {str(e)}")

                # 3. Transiciona status e vincula transação apenas se todas as transações do lote estiverem aprovadas
                if all_approved:
                    inbox.validated_transaction = transaction_obj
                    inbox.status = 'ready'
                
                inbox.save(update_fields=['validated_transaction', 'status', 'ai_suggestions', 'updated_at'])

            return Response(
                {
                    "message": "Transação criada e comprovante homologado com sucesso!",
                    "transaction_id": str(transaction_obj.id),
                    "all_approved": all_approved
                },
                status=status.HTTP_201_CREATED
            )

        except Account.DoesNotExist:
            return Response({"error": "Conta selecionada inválida ou não encontrada."}, status=status.HTTP_400_BAD_REQUEST)
        except Category.DoesNotExist:
            return Response({"error": "Categoria selecionada inválida ou não encontrada."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Erro ao processar aprovação: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CategoryGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryGoal
        fields = ['id', 'category', 'goal_type', 'amount', 'target_date', 'frequency', 'frequency_interval', 'created_at']
        read_only_fields = ['id', 'created_at']

class CategoryGoalViewSet(viewsets.ModelViewSet):
    serializer_class = CategoryGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CategoryGoal.objects.filter(category__user=self.request.user)

    def perform_create(self, serializer):
        # Garante que a categoria pertence ao usuário ativo
        category_id = self.request.data.get('category')
        if category_id:
            try:
                category = Category.objects.get(id=category_id, user=self.request.user)
            except Category.DoesNotExist:
                raise serializers.ValidationError("A categoria fornecida não existe ou não pertence a este usuário.")
        serializer.save()


class TransactionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionRule
        fields = ['id', 'name', 'stage', 'conditions_op', 'conditions', 'actions', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class TransactionRuleViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TransactionRule.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)



