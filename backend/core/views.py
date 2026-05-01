from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum
from .models import Account, Category, Transaction, Goal, MonthlyBudget
from .serializers import AccountSerializer, CategorySerializer, TransactionSerializer, GoalSerializer, MonthlyBudgetSerializer
from datetime import datetime
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .social_auth import verify_google_token, get_or_create_google_user, verify_google_access_token

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
        
        def build_tree(account_list, parent_id=None):
            branch = []
            for account in account_list:
                if account.parent_id == parent_id:
                    children = build_tree(account_list, account.id)
                    acc_dict = {
                        'id': str(account.id),
                        'name': account.name,
                        'account_type': account.account_type,
                        'balance': str(account.balance),
                        'currency': account.currency,
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

    @action(detail=False, methods=['post'])
    def auto_assign(self, request):
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
        self.sync_recurring_transactions()
        return Transaction.objects.filter(account__user=self.request.user).order_by('-date', '-created_at')

    def sync_recurring_transactions(self):
        from datetime import date, timedelta
        import calendar
        
        def add_months(sourcedate, months):
            month = sourcedate.month - 1 + months
            year = sourcedate.year + month // 12
            month = month % 12 + 1
            day = min(sourcedate.day, calendar.monthrange(year,month)[1])
            return date(year, month, day)

        today = date.today()
        recurring = Transaction.objects.filter(
            account__user=self.request.user, 
            is_recurring=True, 
            next_recurrence_date__lte=today
        )

        for template in recurring:
            while template.next_recurrence_date and template.next_recurrence_date <= today:
                new_t = Transaction.objects.create(
                    account=template.account,
                    category=template.category,
                    amount=template.amount,
                    description=template.description,
                    date=template.next_recurrence_date,
                    is_income=template.is_income,
                    is_recurring=False
                )
                
                # Update account balance
                acc = new_t.account
                if new_t.is_income:
                    acc.balance += new_t.amount
                else:
                    acc.balance -= new_t.amount
                acc.save()
                
                # Advance date
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

    @transaction.atomic
    def perform_create(self, serializer):
        instance = serializer.save()
        
        if instance.is_recurring and not instance.next_recurrence_date:
            from datetime import timedelta
            import calendar
            def add_months(sourcedate, months):
                month = sourcedate.month - 1 + months
                year = sourcedate.year + month // 12
                month = month % 12 + 1
                day = min(sourcedate.day, calendar.monthrange(year,month)[1])
                from datetime import date
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

    @action(detail=False, methods=['post'])
    def import_file(self, request):
        import csv
        from decimal import Decimal
        from datetime import datetime
        
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
                        
                        Transaction.objects.create(
                            account=account,
                            description=desc[:255],
                            amount=abs(amount),
                            date=t_date,
                            is_income=is_income
                        )
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
                import io
                
                ofx = OfxParser.parse(io.BytesIO(file.read()))
                
                with transaction.atomic():
                    for ofx_account in ofx.accounts:
                        for st in ofx_account.statement.transactions:
                            desc = st.payee or st.memo or "Importação OFX"
                            amount = st.amount
                            is_income = amount > 0
                            t_date = st.date.date()
                            
                            Transaction.objects.create(
                                account=account,
                                description=str(desc)[:255],
                                amount=abs(amount),
                                date=t_date,
                                is_income=is_income
                            )
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

from rest_framework import generics
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

from django.http import HttpResponse

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        name = request.data.get('name')
        
        if name:
            # Tenta separar o nome se possível
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            user.save()
            
        return Response({
            'message': 'Perfil atualizado com sucesso!',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        })

def ping(request):
    """Endpoint público e leve para manter o servidor acordado via Cron-job."""
    return HttpResponse("ok", content_type="text/plain", status=200)

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        with open("backend_debug.txt", "a") as f:
            f.write(f"\n--- REQUEST {datetime.now()} ---\n")
            f.write(f"Token: {token[:20]}...\n")
            f.write(f"GOOGLE_CLIENT_ID: {settings.GOOGLE_CLIENT_ID}\n")
        
        if not token:
            return Response({'error': 'Token é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Tenta verificar como ID Token primeiro, depois como Access Token
            try:
                idinfo = verify_google_token(token)
            except Exception:
                # Fallback para Access Token (usado em botões customizados)
                idinfo = verify_google_access_token(token)
            
            # Obtém ou cria o usuário baseado no email do Google
            user = get_or_create_google_user(idinfo)
            
            # Gera os tokens JWT para o usuário
            refresh = RefreshToken.for_user(user)
            
            user_data = UserSerializer(user).data
            user_data['avatar'] = getattr(user, 'google_picture', None)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data
            })
            
        except Exception as e:
            import traceback
            error_msg = f"Erro no login social: {str(e)}"
            with open("backend_debug.txt", "a") as f:
                f.write(f"\n--- {datetime.now()} ---\n")
                f.write(error_msg + "\n")
                f.write(traceback.format_exc() + "\n")
            
            return Response({
                'error': error_msg,
                'detail': traceback.format_exc()
            }, status=status.HTTP_400_BAD_REQUEST)

