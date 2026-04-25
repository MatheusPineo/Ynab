from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum
from .models import Account, Category, Transaction, Goal, MonthlyBudget
from .serializers import AccountSerializer, CategorySerializer, TransactionSerializer, GoalSerializer, MonthlyBudgetSerializer
from datetime import datetime

class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user).select_related('parent')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        accounts = self.get_queryset()
        
        def build_tree(account_list, parent=None):
            branch = []
            for account in account_list:
                if account['parent'] == parent:
                    children = build_tree(account_list, account['id'])
                    acc_dict = {
                        'id': str(account.id),
                        'name': account.name,
                        'account_type': account.account_type,
                        'balance': str(account.balance),
                        'parent': str(account.parent_id) if account.parent_id else None,
                    }
                    if children:
                        acc_dict['children'] = children
                    branch.append(acc_dict)
            return branch
        
        final_tree = build_tree(accounts)
        return Response(final_tree)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).select_related('parent')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        # Pega mês e ano da query string ou usa o atual
        now = datetime.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        
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
        
        def build_tree(category_list, parent=None):
            branch = []
            for category in category_list:
                if category['parent'] == parent:
                    children = build_tree(category_list, category['id'])
                    
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

class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MonthlyBudget.objects.filter(category__user=self.request.user)

    @action(detail=False, methods=['post'])
    def set_budget(self, request):
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
        return Transaction.objects.filter(account__user=self.request.user).order_by('-date', '-created_at')

    @transaction.atomic
    def perform_create(self, serializer):
        instance = serializer.save()
        account = instance.account
        if instance.is_income:
            account.balance += instance.amount
        else:
            account.balance -= instance.amount
        account.save()

    @transaction.atomic
    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_amount = old_instance.amount
        old_is_income = old_instance.is_income
        old_account = old_instance.account

        new_instance = serializer.save()
        
        if old_account != new_instance.account:
            if old_is_income:
                old_account.balance -= old_amount
            else:
                old_account.balance += old_amount
            old_account.save()
            
            if new_instance.is_income:
                new_instance.account.balance += new_instance.amount
            else:
                new_instance.account.balance -= new_instance.amount
            new_instance.account.save()
        else:
            account = new_instance.account
            if old_is_income:
                account.balance -= old_amount
            else:
                account.balance += old_amount
            
            if new_instance.is_income:
                account.balance += new_instance.amount
            else:
                account.balance -= new_instance.amount
            account.save()

    @transaction.atomic
    def perform_destroy(self, instance):
        account = instance.account
        if instance.is_income:
            account.balance -= instance.amount
        else:
            account.balance += instance.amount
        account.save()
        instance.delete()

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).order_by('deadline')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
