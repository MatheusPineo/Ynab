from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from finance.models import Account, Transaction, TransactionInbox
from decimal import Decimal
from datetime import date


class TransactionInboxTests(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(username='inboxuser', password='inboxpassword')
        self.account = Account.objects.create(user=self.user, name='Carteira Principal', balance=Decimal('500.00'))

    def test_create_transaction_inbox_defaults(self) -> None:
        """Verifica a criação do TransactionInbox com os valores padrões corretos."""
        inbox = TransactionInbox.objects.create(
            user=self.user,
            file=SimpleUploadedFile('recibo.pdf', b'fake PDF content', content_type='application/pdf')
        )
        self.assertEqual(inbox.status, 'pending')
        self.assertEqual(inbox.ai_suggestions, {})
        self.assertIsNone(inbox.error_message)
        self.assertIsNone(inbox.processed_at)
        self.assertIsNone(inbox.validated_transaction)
        self.assertIn("recibo", inbox.file.name)
        self.assertTrue(str(inbox).startswith(f"Inbox {inbox.id}:"))

    def test_upload_path_resolution(self) -> None:
        """Valida que o caminho de upload inclui o ID do usuário de forma segura."""
        inbox = TransactionInbox.objects.create(
            user=self.user,
            file=SimpleUploadedFile('cupom.png', b'fake PNG content', content_type='image/png')
        )
        # Deve estar sob a pasta do ID do usuário correspondente
        expected_substring = f"users/{self.user.id}/inbox/cupom"
        self.assertIn(expected_substring, inbox.file.name)

    def test_ai_suggestions_parsing_amount(self) -> None:
        """Garante que a propriedade suggested_amount_decimal converta adequadamente valores do JSONField."""
        inbox = TransactionInbox.objects.create(user=self.user)
        
        # Teste com valor flutuante (float)
        inbox.ai_suggestions = {'amount': 150.75}
        inbox.save()
        self.assertEqual(inbox.suggested_amount_decimal, Decimal('150.75'))

        # Teste com string representativa de número
        inbox.ai_suggestions = {'amount': '99.90'}
        inbox.save()
        self.assertEqual(inbox.suggested_amount_decimal, Decimal('99.90'))

        # Teste com valor nulo ou ausente
        inbox.ai_suggestions = {}
        inbox.save()
        self.assertIsNone(inbox.suggested_amount_decimal)

        # Teste com valor inválido
        inbox.ai_suggestions = {'amount': 'gratis'}
        inbox.save()
        self.assertIsNone(inbox.suggested_amount_decimal)

    def test_ai_suggestions_parsing_date(self) -> None:
        """Garante que a propriedade suggested_date_object converta adequadamente strings de data ISO no JSONField."""
        inbox = TransactionInbox.objects.create(user=self.user)

        # Teste com data ISO padrão
        inbox.ai_suggestions = {'date': '2026-05-17'}
        inbox.save()
        self.assertEqual(inbox.suggested_date_object, date(2026, 5, 17))

        # Teste com valor ausente ou vazio
        inbox.ai_suggestions = {}
        inbox.save()
        self.assertIsNone(inbox.suggested_date_object)

        # Teste com formato de data inválido
        inbox.ai_suggestions = {'date': '17/05/2026'}
        inbox.save()
        self.assertIsNone(inbox.suggested_date_object)

    def test_link_validated_transaction(self) -> None:
        """Valida a vinculação do inbox com a transação final pós-validação."""
        inbox = TransactionInbox.objects.create(
            user=self.user,
            status='ready',
            ai_suggestions={
                'amount': 45.00,
                'date': '2026-05-17',
                'merchant': 'Restaurante',
                'currency': 'EUR'
            }
        )

        # Criação da transação validada correspondente
        tx = Transaction.objects.create(
            account=self.account,
            amount=Decimal('45.00'),
            description='Restaurante (Validado da Inbox)',
            date=date(2026, 5, 17),
            is_income=False,
            status='realized'
        )

        inbox.validated_transaction = tx
        inbox.save()

        # Verifica relacionamentos reversos
        self.assertEqual(inbox.validated_transaction, tx)
        self.assertEqual(tx.inbox_sources.first(), inbox)


from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from finance.tasks import process_inbox_document

class TransactionInboxAPITests(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(username='apiuser', password='apipassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
    @patch('finance.tasks.process_inbox_document.delay')
    def test_bulk_upload_success(self, mock_delay) -> None:
        """Verifica que o upload de múltiplos arquivos cria registros pendentes e inicia Celery."""
        file1 = SimpleUploadedFile('recibo1.jpg', b'fake image 1', content_type='image/jpeg')
        file2 = SimpleUploadedFile('recibo2.png', b'fake image 2', content_type='image/png')
        
        response = self.client.post(
            reverse('inbox-bulk-upload'),
            {'files': [file1, file2]},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn("message", response.data)
        self.assertEqual(len(response.data['items']), 2)
        
        # Verifica que o celery foi acionado duas vezes
        self.assertEqual(mock_delay.call_count, 2)
        
        # Garante que os registros foram criados com status pending no banco
        inbox_items = TransactionInbox.objects.filter(user=self.user)
        self.assertEqual(inbox_items.count(), 2)
        for item in inbox_items:
            self.assertEqual(item.status, 'pending')
            
    def test_bulk_upload_no_files(self) -> None:
        """Valida que o upload sem arquivos retorna erro 400."""
        response = self.client.post(
            reverse('inbox-bulk-upload'),
            {},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_celery_task_completes_successfully(self) -> None:
        """Valida que a task do Celery conclui o processamento transicionando o status para ready."""
        inbox = TransactionInbox.objects.create(
            user=self.user,
            file=SimpleUploadedFile('test.jpg', b'img data', content_type='image/jpeg')
        )
        self.assertEqual(inbox.status, 'pending')
        
        # Executa a tarefa do Celery diretamente de forma síncrona
        process_inbox_document(inbox.id)
        
        # Recarrega do banco e valida a alteração do status
        inbox.refresh_from_db()
        self.assertEqual(inbox.status, 'ready')
        self.assertIsNotNone(inbox.processed_at)
        self.assertIn("merchant", inbox.ai_suggestions)


from unittest.mock import MagicMock, mock_open, patch
from finance.ai_services import AIExtractionService

class AIExtractionServiceTests(TestCase):
    def setUp(self) -> None:
        self.service_no_key = AIExtractionService(api_key="")
        self.service_with_key = AIExtractionService(api_key="fake-gemini-key")

    def test_extract_without_api_key(self) -> None:
        """Garante que sem chave de API o serviço retorna dados de fallback com 'Sem Chave API'."""
        res = self.service_no_key.extract_receipt_data("caminho/qualquer.jpg")
        self.assertEqual(res["merchant"], "Sem Chave API")
        self.assertIsNone(res["amount"])
        self.assertEqual(res["currency"], "BRL")

    def test_extract_file_not_found(self) -> None:
        """Garante que se o arquivo não existe o serviço retorna fallback com 'Arquivo não Encontrado'."""
        res = self.service_with_key.extract_receipt_data("caminho/inexistente.jpg")
        self.assertEqual(res["merchant"], "Arquivo não Encontrado")
        self.assertIsNone(res["amount"])

    @patch('requests.post')
    @patch('builtins.open', new_callable=mock_open, read_data=b"fake data")
    @patch('os.path.exists')
    def test_extract_success(self, mock_exists, mock_file, mock_post) -> None:
        """Garante que com resposta de sucesso o JSON estruturado do Gemini é parseado corretamente."""
        mock_exists.return_value = True
        
        # Cria um mock response com JSON estruturado
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": '{"amount": 185.90, "date": "2026-05-17", "merchant": "Uber Brasil", "currency": "BRL"}'
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        # Executa a extração
        res = self.service_with_key.extract_receipt_data("caminho/fake.jpg")
        
        self.assertEqual(res["amount"], 185.90)
        self.assertEqual(res["date"], "2026-05-17")
        self.assertEqual(res["merchant"], "Uber Brasil")
        self.assertEqual(res["currency"], "BRL")

    @patch('requests.post')
    @patch('builtins.open', new_callable=mock_open, read_data=b"fake data")
    @patch('os.path.exists')
    def test_extract_rate_limiting_and_success(self, mock_exists, mock_file, mock_post) -> None:
        """Valida a resiliência contra limite de taxa (429) do Gemini com retentativa com sucesso."""
        mock_exists.return_value = True
        
        # Primeiro mock de rate limit
        mock_response_429 = MagicMock()
        mock_response_429.status_code = 429
        
        # Segundo mock de sucesso
        mock_response_success = MagicMock()
        mock_response_success.status_code = 200
        mock_response_success.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": '{"amount": 50.00, "date": "2026-05-15", "merchant": "Amazon", "currency": "USD"}'
                            }
                        ]
                    }
                }
            ]
        }
        
        mock_post.side_effect = [mock_response_429, mock_response_success]

        # Patch time.sleep para o teste rodar instantaneamente
        with patch('time.sleep'):
            res = self.service_with_key.extract_receipt_data("caminho/fake.jpg")

        self.assertEqual(res["amount"], 50.00)
        self.assertEqual(res["merchant"], "Amazon")
        self.assertEqual(res["currency"], "USD")



