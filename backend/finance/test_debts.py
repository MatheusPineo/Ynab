from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Account, Debt, DebtPayment, Transaction
import datetime


class DebtTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='debtuser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.account = Account.objects.create(
            user=self.user, name='Conta Principal', currency='BRL', balance=1000.00
        )

    def test_create_debt_receivable(self):
        """Create a debt where someone owes me money."""
        response = self.client.post(reverse('debt-list'), {
            'counterparty_name': 'João',
            'original_amount': '500.00',
            'currency': 'BRL',
            'is_mine': False,
            'notes': 'Empréstimo de maio',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['counterparty_name'], 'João')
        self.assertEqual(float(response.data['original_amount']), 500.00)
        self.assertEqual(float(response.data['amount_paid']), 0.00)
        self.assertEqual(float(response.data['amount_remaining']), 500.00)

    def test_create_debt_payable(self):
        """Create a debt where I owe someone money."""
        response = self.client.post(reverse('debt-list'), {
            'counterparty_name': 'Maria',
            'original_amount': '200.00',
            'currency': 'BRL',
            'is_mine': True,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['is_mine'], True)

    def test_payment_creates_income_transaction(self):
        """Payment on a receivable debt should create an income transaction."""
        debt = Debt.objects.create(
            user=self.user, counterparty_name='Carlos', original_amount=300.00,
            currency='BRL', is_mine=False
        )
        initial_balance = float(self.account.balance)

        response = self.client.post(reverse('debt-payment-list'), {
            'debt': debt.id,
            'amount': '100.00',
            'date': datetime.date.today().isoformat(),
            'account': self.account.id,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check transaction was created
        txn = Transaction.objects.filter(account=self.account, description__icontains='Carlos').first()
        self.assertIsNotNone(txn)
        self.assertTrue(txn.is_income)
        self.assertEqual(float(txn.amount), 100.00)
        self.assertEqual(txn.description, 'Pagamento de dívida de Carlos')

        # Check account balance increased
        self.account.refresh_from_db()
        self.assertEqual(float(self.account.balance), initial_balance + 100.00)

        # Check debt amounts updated
        debt_resp = self.client.get(reverse('debt-detail', args=[debt.id]))
        self.assertEqual(float(debt_resp.data['amount_paid']), 100.00)
        self.assertEqual(float(debt_resp.data['amount_remaining']), 200.00)

    def test_payment_creates_expense_transaction(self):
        """Payment on a payable debt should create an expense transaction."""
        debt = Debt.objects.create(
            user=self.user, counterparty_name='Ana', original_amount=150.00,
            currency='BRL', is_mine=True
        )
        initial_balance = float(self.account.balance)

        response = self.client.post(reverse('debt-payment-list'), {
            'debt': debt.id,
            'amount': '50.00',
            'date': datetime.date.today().isoformat(),
            'account': self.account.id,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        txn = Transaction.objects.filter(account=self.account, description__icontains='Ana').first()
        self.assertIsNotNone(txn)
        self.assertFalse(txn.is_income)
        self.assertEqual(float(txn.amount), 50.00)
        self.assertEqual(txn.description, 'Pagamento de dívida para Ana')

        # Check account balance decreased
        self.account.refresh_from_db()
        self.assertEqual(float(self.account.balance), initial_balance - 50.00)

    def test_delete_payment_reverses_balance(self):
        """Deleting a payment should reverse the account balance change."""
        debt = Debt.objects.create(
            user=self.user, counterparty_name='Luiz', original_amount=200.00,
            currency='BRL', is_mine=False
        )
        pay_resp = self.client.post(reverse('debt-payment-list'), {
            'debt': debt.id, 'amount': '80.00',
            'date': datetime.date.today().isoformat(), 'account': self.account.id,
        }, format='json')
        payment_id = pay_resp.data['id']
        self.account.refresh_from_db()
        balance_after_pay = float(self.account.balance)

        # Delete the payment
        self.client.delete(reverse('debt-payment-detail', args=[payment_id]))
        self.account.refresh_from_db()
        # Balance should have been reduced back
        self.assertEqual(float(self.account.balance), balance_after_pay - 80.00)

    def test_debt_data_isolation(self):
        """User should not see other users' debts."""
        other_user = User.objects.create_user(username='other', password='pass')
        Debt.objects.create(
            user=other_user, counterparty_name='XYZ', original_amount=100.00, currency='BRL'
        )
        response = self.client.get(reverse('debt-list'))
        self.assertEqual(len(response.data), 0)

    def test_add_debt_amount_receivable_creates_expense(self):
        """Adding debt to a receivable should create an expense transaction (lending more money)."""
        debt = Debt.objects.create(
            user=self.user, counterparty_name='Carlos', original_amount=300.00,
            currency='BRL', is_mine=False
        )
        initial_balance = float(self.account.balance)

        response = self.client.post(reverse('debt-add-debt-amount', args=[debt.id]), {
            'amount': '150.00',
            'date': datetime.date.today().isoformat(),
            'account': self.account.id,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Original amount should be 450.00
        debt.refresh_from_db()
        self.assertEqual(float(debt.original_amount), 450.00)
        self.assertIn("Acréscimo de 150.00", debt.notes)

        # Check transaction was created (expense)
        txn = Transaction.objects.filter(account=self.account, description__icontains='Carlos').first()
        self.assertIsNotNone(txn)
        self.assertFalse(txn.is_income)
        self.assertEqual(float(txn.amount), 150.00)
        self.assertEqual(txn.description, 'Acréscimo de dívida (dinheiro emprestado para Carlos)')

        # Balance should have decreased
        self.account.refresh_from_db()
        self.assertEqual(float(self.account.balance), initial_balance - 150.00)

    def test_add_debt_amount_payable_creates_income(self):
        """Adding debt to a payable should create an income transaction (borrowing more money)."""
        debt = Debt.objects.create(
            user=self.user, counterparty_name='Ana', original_amount=200.00,
            currency='BRL', is_mine=True
        )
        initial_balance = float(self.account.balance)

        response = self.client.post(reverse('debt-add-debt-amount', args=[debt.id]), {
            'amount': '100.00',
            'date': datetime.date.today().isoformat(),
            'account': self.account.id,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Original amount should be 300.00
        debt.refresh_from_db()
        self.assertEqual(float(debt.original_amount), 300.00)

        # Check transaction was created (income)
        txn = Transaction.objects.filter(account=self.account, description__icontains='Ana').first()
        self.assertIsNotNone(txn)
        self.assertTrue(txn.is_income)
        self.assertEqual(float(txn.amount), 100.00)
        self.assertEqual(txn.description, 'Acréscimo de dívida (empréstimo de Ana)')

        # Balance should have increased
        self.account.refresh_from_db()
        self.assertEqual(float(self.account.balance), initial_balance + 100.00)
