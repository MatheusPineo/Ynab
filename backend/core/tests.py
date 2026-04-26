from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import Account, Category, Transaction, MonthlyBudget
from datetime import date, timedelta
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile

class FinanceAppTests(TestCase):
    def setUp(self):
        # Configuração do banco de dados de teste (executado antes de cada teste)
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.account = Account.objects.create(
            user=self.user,
            name='Test Account',
            account_type='checking',
            currency='BRL',
            balance=Decimal('1000.00')
        )
        
        self.category = Category.objects.create(
            user=self.user,
            name='Test Category'
        )

    def test_recurring_transactions(self):
        """
        Verifica se o sistema gera transações recorrentes automaticamente
        quando a data de recorrência é atingida.
        """
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Cria uma transação recorrente modelo
        template_tx = Transaction.objects.create(
            account=self.account,
            category=self.category,
            amount=Decimal('50.00'),
            description='Assinatura',
            date=yesterday,
            is_income=False,
            is_recurring=True,
            recurrence_interval='monthly',
            next_recurrence_date=yesterday # Deveria ter disparado ontem
        )
        
        # Guarda o balanço original (1000)
        original_balance = self.account.balance
        
        # Fazer uma requisição GET para transações deve disparar o gatilho
        url = reverse('transaction-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica se o modelo foi avançado
        template_tx.refresh_from_db()
        self.assertTrue(template_tx.next_recurrence_date > today)
        
        # Verifica se a nova transação foi criada
        # Deveria haver 2 transações agora (o modelo e a instância gerada)
        self.assertEqual(Transaction.objects.count(), 2)
        
        new_tx = Transaction.objects.filter(is_recurring=False).first()
        self.assertIsNotNone(new_tx)
        self.assertEqual(new_tx.description, 'Assinatura')
        self.assertEqual(new_tx.amount, Decimal('50.00'))
        
        # Verifica se o balanço da conta foi debitado (1000 - 50 = 950)
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('950.00'))

    def test_auto_assign(self):
        """
        Verifica a lógica de Auto-Assign baseada no mês passado.
        """
        today = date.today()
        prev_month = today.month - 1 if today.month > 1 else 12
        prev_year = today.year if today.month > 1 else today.year - 1
        
        # Registra um gasto de 200 na categoria no mês passado
        Transaction.objects.create(
            account=self.account,
            category=self.category,
            amount=Decimal('200.00'),
            description='Mercado',
            date=date(prev_year, prev_month, 15),
            is_income=False
        )
        
        # Chama a rota de auto-assign
        url = reverse('category-auto-assign')
        data = {
            'rule': 'spent_last_month',
            'month': today.month,
            'year': today.year
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica se o MonthlyBudget foi criado com 200
        budget = MonthlyBudget.objects.get(
            category=self.category,
            month=today.month,
            year=today.year
        )
        self.assertEqual(budget.amount, Decimal('200.00'))

    def test_import_csv(self):
        """
        Testa se o endpoint de importação aceita e processa um CSV.
        """
        csv_content = "Date,Description,Amount\n2026-04-20,Salario,3000.00\n2026-04-21,Luz,-150.00"
        csv_file = SimpleUploadedFile(
            "extrato.csv", 
            csv_content.encode('utf-8'), 
            content_type="text/csv"
        )
        
        url = reverse('transaction-import-file')
        
        response = self.client.post(url, {'file': csv_file, 'account': self.account.id}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica as transações criadas (Salário e Luz)
        self.assertEqual(Transaction.objects.count(), 2)
        
        # O saldo original era 1000. Saldo final = 1000 + 3000 - 150 = 3850.
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('3850.00'))
