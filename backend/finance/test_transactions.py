from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import Account, Transaction, DistributionTemplate, Category
from decimal import Decimal
from datetime import date

class TransactionsAndTransfersTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.account_a = Account.objects.create(user=self.user, name='Account A', balance=Decimal('1000.00'))
        self.account_b = Account.objects.create(user=self.user, name='Account B', balance=Decimal('500.00'))
        self.category = Category.objects.create(user=self.user, name='Test Cat')

    def test_transaction_crud_and_balance_update(self):
        # Create Income
        response = self.client.post(reverse('transaction-list'), {
            'account': self.account_a.id,
            'amount': '200.00',
            'description': 'Salary Bonus',
            'date': str(date.today()),
            'is_income': True,
            'status': 'realized'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        tx_id = response.data['id']
        
        self.account_a.refresh_from_db()
        self.assertEqual(self.account_a.balance, Decimal('1200.00'))
        
        # Update to Expense
        response = self.client.patch(reverse('transaction-detail', args=[tx_id]), {
            'is_income': False
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.account_a.refresh_from_db()
        # Original balance (1000) - 200 expense = 800
        self.assertEqual(self.account_a.balance, Decimal('800.00'))
        
        # Delete Transaction
        response = self.client.delete(reverse('transaction-detail', args=[tx_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        self.account_a.refresh_from_db()
        # Back to original balance
        self.assertEqual(self.account_a.balance, Decimal('1000.00'))

    def test_transfer(self):
        response = self.client.post('/api/transactions/transfer/', {
            'from_account': self.account_a.id,
            'to_account': self.account_b.id,
            'amount': '300.00',
            'date': str(date.today())
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.account_a.refresh_from_db()
        self.account_b.refresh_from_db()
        
        self.assertEqual(self.account_a.balance, Decimal('700.00'))
        self.assertEqual(self.account_b.balance, Decimal('800.00'))
        
        # Verify group
        transactions = Transaction.objects.filter(account__in=[self.account_a, self.account_b])
        self.assertEqual(transactions.count(), 2)
        self.assertIsNotNone(transactions.first().transfer_group)
        self.assertEqual(transactions[0].transfer_group, transactions[1].transfer_group)

    def test_bulk_transfer_distribution(self):
        account_c = Account.objects.create(user=self.user, name='Account C', balance=Decimal('0.00'))
        
        response = self.client.post('/api/transactions/bulk_transfer/', {
            'from_account': self.account_a.id,
            'total_amount': '500.00',
            'date': str(date.today()),
            'distributions': [
                {'to_account': self.account_b.id, 'amount': '300.00'},
                {'to_account': account_c.id, 'amount': '200.00'}
            ]
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.account_a.refresh_from_db()
        self.account_b.refresh_from_db()
        account_c.refresh_from_db()
        
        self.assertEqual(self.account_a.balance, Decimal('500.00'))
        self.assertEqual(self.account_b.balance, Decimal('800.00'))
        self.assertEqual(account_c.balance, Decimal('200.00'))

    def test_distribution_template_crud(self):
        response = self.client.post(reverse('distribution-template-list'), {
            'name': 'My Template',
            'items': [
                {'account': self.account_b.id, 'percentage': '50.00'}
            ]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        templates = DistributionTemplate.objects.filter(user=self.user)
        self.assertEqual(templates.count(), 1)
        self.assertEqual(templates.first().items.count(), 1)
