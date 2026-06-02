from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date
from unittest.mock import patch
from finance.models import Account, Category, Transaction, TransactionInbox, LearnedTransactionRule

class NotificationInboxTests(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(username='test_notify_user', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.account = Account.objects.create(
            user=self.user,
            name='Conta Teste',
            account_type='checking',
            balance=Decimal('1000.00'),
            currency='BRL'
        )
        self.category = Category.objects.create(
            user=self.user,
            name='Transporte'
        )

    def test_notification_match_engine_bypass(self) -> None:
        """Valida que uma notificação que bate com palavra-chave de regra pré-cadastrada faz bypass do Gemini e cria item 'ready'."""
        # Cadastra regra aprendida prévia
        rule = LearnedTransactionRule.objects.create(
            user=self.user,
            keyword='uber',
            assigned_account=self.account,
            assigned_category=self.category,
            is_income=False
        )

        notification_text = "Sua viagem de Uber de R$ 35,50 em 2026-06-02 foi processada com sucesso."

        with patch('finance.tasks.process_inbox_document.delay') as mock_delay:
            response = self.client.post(
                reverse('inbox-notification'),
                {'text': notification_text, 'package_name': 'com.ubercab'},
                format='json'
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'ready')
        self.assertEqual(mock_delay.call_count, 0)  # Bypass total do Gemini

        inbox_item = TransactionInbox.objects.get(id=response.data['id'])
        self.assertEqual(inbox_item.status, 'ready')
        self.assertFalse(inbox_item.file)
        
        txs = inbox_item.ai_suggestions.get('transactions', [])
        self.assertEqual(len(txs), 1)
        self.assertEqual(txs[0]['amount'], 35.50)
        self.assertEqual(txs[0]['merchant'], 'Uber')
        self.assertEqual(txs[0]['currency'], 'BRL')
        self.assertEqual(txs[0]['date'], '2026-06-02')

    @patch('finance.tasks.process_inbox_document.delay')
    def test_notification_no_match_fallback(self, mock_delay) -> None:
        """Valida que uma notificação sem match é enfileirada como 'pending' e despacha tarefa Celery."""
        notification_text = "Compra autorizada no estabelecimento ALDI de R$ 90,00"

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                reverse('inbox-notification'),
                {'text': notification_text},
                format='json'
            )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(mock_delay.call_count, 1)  # Dispara Gemini

        inbox_item = TransactionInbox.objects.get(id=response.data['id'])
        self.assertEqual(inbox_item.status, 'pending')
        self.assertEqual(inbox_item.ai_suggestions['raw_text'], notification_text)

    def test_notification_approve_and_learn_rule(self) -> None:
        """Valida que ao aprovar uma transação vinda do Gemini (com keyword da IA), a regra é aprendida automaticamente."""
        inbox = TransactionInbox.objects.create(
            user=self.user,
            status='ready',
            ai_suggestions={
                'transactions': [
                    {
                        'amount': 45.00,
                        'date': '2026-06-02',
                        'merchant': 'Poupança Doce',
                        'merchant_keyword': 'poupança doce',
                        'currency': 'BRL',
                        'approved': False
                    }
                ]
            }
        )

        payload = {
            'account': str(self.account.id),
            'category': str(self.category.id),
            'amount': 45.00,
            'description': 'Poupança Doce',
            'date': '2026-06-02',
            'is_income': False
        }

        response = self.client.post(
            reverse('inbox-approve', args=[inbox.id]),
            payload,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verifica que o LearnedTransactionRule correspondente foi criado automaticamente
        rule = LearnedTransactionRule.objects.filter(user=self.user, keyword='poupança doce').first()
        self.assertIsNotNone(rule)
        self.assertEqual(rule.assigned_account, self.account)
        self.assertEqual(rule.assigned_category, self.category)
        self.assertFalse(rule.is_income)
