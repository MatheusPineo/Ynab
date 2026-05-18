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
        self.account = Account.objects.create(user=self.user, name='Carteira Principal', balance=Decimal('500.00'))
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
    @patch('finance.tasks.process_inbox_document.delay')
    def test_bulk_upload_success(self, mock_delay) -> None:
        """Verifica que o upload de múltiplos arquivos cria registros pendentes e inicia Celery."""
        file1 = SimpleUploadedFile('recibo1.jpg', b'fake image 1', content_type='image/jpeg')
        file2 = SimpleUploadedFile('recibo2.png', b'fake image 2', content_type='image/png')
        
        with self.captureOnCommitCallbacks(execute=True):
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
        self.assertIn("transactions", inbox.ai_suggestions)

    def test_approve_single_transaction_legacy_format(self) -> None:
        """Valida a aprovação tradicional (legada) sem o parâmetro index."""
        inbox = TransactionInbox.objects.create(
            user=self.user,
            status='ready',
            ai_suggestions={
                'amount': 150.50,
                'date': '2026-05-17',
                'merchant': 'Posto de Gasolina',
                'currency': 'BRL'
            }
        )
        
        payload = {
            'account': str(self.account.id),
            'amount': 150.50,
            'description': 'Posto de Gasolina',
            'date': '2026-05-17',
            'is_income': False
        }
        
        response = self.client.post(
            reverse('inbox-approve', args=[inbox.id]),
            payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['all_approved'])
        
        # Verifica se o inbox foi atualizado no banco
        inbox.refresh_from_db()
        self.assertIsNotNone(inbox.validated_transaction)
        self.assertEqual(inbox.status, 'ready')
        
        # Verifica o saldo atualizado da conta
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('349.50'))

    def test_approve_transaction_with_none_category(self) -> None:
        """Valida a aprovação tradicional quando a categoria informada é 'none'."""
        inbox = TransactionInbox.objects.create(
            user=self.user,
            status='ready',
            ai_suggestions={
                'amount': 150.50,
                'date': '2026-05-17',
                'merchant': 'Posto de Gasolina',
                'currency': 'BRL'
            }
        )
        
        payload = {
            'account': str(self.account.id),
            'category': 'none',
            'amount': 150.50,
            'description': 'Posto de Gasolina',
            'date': '2026-05-17',
            'is_income': True
        }
        
        response = self.client.post(
            reverse('inbox-approve', args=[inbox.id]),
            payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['all_approved'])
        
        # Verifica se o inbox foi atualizado no banco
        inbox.refresh_from_db()
        self.assertIsNotNone(inbox.validated_transaction)
        self.assertIsNone(inbox.validated_transaction.category)

    def test_approve_multi_transaction_batch_by_index(self) -> None:
        """Valida a aprovação de transações individuais por índice e finalização apenas quando todas são aprovadas."""
        inbox = TransactionInbox.objects.create(
            user=self.user,
            status='ready',
            ai_suggestions={
                'transactions': [
                    {'amount': 50.0, 'date': '2026-05-17', 'merchant': 'Uber', 'currency': 'BRL', 'approved': False},
                    {'amount': 120.0, 'date': '2026-05-17', 'merchant': 'Restaurante', 'currency': 'BRL', 'approved': False}
                ]
            }
        )

        # 1. Aprova apenas a primeira transação (Uber, index=0)
        payload1 = {
            'account': str(self.account.id),
            'amount': 50.0,
            'description': 'Uber',
            'date': '2026-05-17',
            'is_income': False,
            'index': 0
        }
        response1 = self.client.post(
            reverse('inbox-approve', args=[inbox.id]),
            payload1,
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response1.data['all_approved'])
        
        inbox.refresh_from_db()
        self.assertIsNone(inbox.validated_transaction) # Ainda não concluído
        self.assertTrue(inbox.ai_suggestions['transactions'][0]['approved'])
        self.assertFalse(inbox.ai_suggestions['transactions'][1]['approved'])
        
        # Verifica o saldo atualizado da conta após a primeira transação
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('450.00'))

        # 2. Aprova a segunda transação (Restaurante, index=1)
        payload2 = {
            'account': str(self.account.id),
            'amount': 120.0,
            'description': 'Restaurante',
            'date': '2026-05-17',
            'is_income': False,
            'index': 1
        }
        response2 = self.client.post(
            reverse('inbox-approve', args=[inbox.id]),
            payload2,
            format='json'
        )
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response2.data['all_approved']) # Agora concluído!
        
        inbox.refresh_from_db()
        self.assertIsNotNone(inbox.validated_transaction)
        self.assertTrue(inbox.ai_suggestions['transactions'][0]['approved'])
        self.assertTrue(inbox.ai_suggestions['transactions'][1]['approved'])
        
        # Verifica o saldo atualizado da conta após a segunda transação
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('330.00'))

    def test_approve_inbox_with_null_category_and_verify_all_endpoints(self) -> None:
        """
        Teste ultra-completo e detalhado para buscar cada milímetro do sistema:
        - Cria um item de inbox com uma data do passado (3 meses atrás).
        - Envia aprovação sem categoria (category = None).
        - Valida que a transação correspondente é criada, está efetivada e o saldo da conta está atualizado.
        - Valida que a transação é retornada quando o filtro de mês/ano do endpoint de transações é o correto.
        - Valida que a transação NÃO é retornada quando o filtro de mês/ano é diferente (evitando o sumiço silencioso).
        """
        past_date = "2026-02-15" # Fevereiro de 2026
        inbox = TransactionInbox.objects.create(
            user=self.user,
            status='ready',
            ai_suggestions={
                'amount': 75.30,
                'date': past_date,
                'merchant': 'Supermercado Local',
                'currency': 'BRL'
            }
        )
        
        # Payload com categoria nula (None) simulando o comportamento exato do frontend
        payload = {
            'account': str(self.account.id),
            'category': None,
            'amount': 75.30,
            'description': 'Supermercado Local',
            'date': past_date,
            'is_income': False
        }
        
        # Envia a homologação
        response = self.client.post(
            reverse('inbox-approve', args=[inbox.id]),
            payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['all_approved'])
        
        # 1. Verifica integridade do Inbox
        inbox.refresh_from_db()
        self.assertIsNotNone(inbox.validated_transaction)
        self.assertEqual(inbox.status, 'ready')
        
        # 2. Verifica a transação criada
        tx = inbox.validated_transaction
        self.assertIsNone(tx.category)
        self.assertEqual(tx.amount, Decimal('75.30'))
        self.assertEqual(tx.description, 'Supermercado Local')
        self.assertEqual(str(tx.date), past_date)
        self.assertFalse(tx.is_income)
        self.assertEqual(tx.status, 'realized')
        self.assertTrue(tx.is_applied_to_balance)
        
        # 3. Verifica o saldo atualizado da conta
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal('424.70')) # 500 - 75.30
        
        # 4. Busca as transações filtrando pelo mês correto (Fevereiro de 2026)
        tx_list_url = reverse('transaction-list')
        res_correct_month = self.client.get(f"{tx_list_url}?month=2&year=2026")
        self.assertEqual(res_correct_month.status_code, status.HTTP_200_OK)
        
        # Garante que a transação criada está na lista
        tx_ids = [tx_item['id'] for tx_item in res_correct_month.data]
        self.assertIn(tx.id, tx_ids)
        
        # 5. Busca as transações filtrando por outro mês (Maio de 2026)
        res_wrong_month = self.client.get(f"{tx_list_url}?month=5&year=2026")
        self.assertEqual(res_wrong_month.status_code, status.HTTP_200_OK)
        tx_ids_wrong = [tx_item['id'] for tx_item in res_wrong_month.data]
        self.assertNotIn(tx.id, tx_ids_wrong)



from unittest.mock import MagicMock, mock_open, patch
from finance.ai_services import AIExtractionService

class AIExtractionServiceTests(TestCase):
    def setUp(self) -> None:
        self.service_no_key = AIExtractionService(api_key="")
        self.service_with_key = AIExtractionService(api_key="fake-gemini-key")

    def test_extract_without_api_key(self) -> None:
        """Garante que sem chave de API o serviço retorna dados de fallback com 'Sem Chave API'."""
        res = self.service_no_key.extract_receipt_data("caminho/qualquer.jpg")
        self.assertEqual(res["transactions"][0]["merchant"], "Sem Chave API")
        self.assertIsNone(res["transactions"][0]["amount"])
        self.assertEqual(res["transactions"][0]["currency"], "BRL")

    def test_extract_file_not_found(self) -> None:
        """Garante que se o arquivo não existe o serviço retorna fallback com 'Arquivo não Encontrado'."""
        res = self.service_with_key.extract_receipt_data("caminho/inexistente.jpg")
        self.assertEqual(res["transactions"][0]["merchant"], "Arquivo não Encontrado")
        self.assertIsNone(res["transactions"][0]["amount"])

    @patch('requests.post')
    @patch('builtins.open', new_callable=mock_open, read_data=b"fake data")
    @patch('os.path.exists')
    def test_extract_success(self, mock_exists, mock_file, mock_post) -> None:
        """Garante que com resposta de sucesso o JSON estruturado do Gemini é parseado corretamente."""
        mock_exists.return_value = True
        
        # Cria um mock response com JSON estruturado contendo a chave root 'transactions'
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": '{"transactions": [{"amount": 185.90, "date": "2026-05-17", "merchant": "Uber Brasil", "currency": "BRL"}]}'
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        # Executa a extração
        res = self.service_with_key.extract_receipt_data("caminho/fake.jpg")
        
        self.assertEqual(res["transactions"][0]["amount"], 185.90)
        self.assertEqual(res["transactions"][0]["date"], "2026-05-17")
        self.assertEqual(res["transactions"][0]["merchant"], "Uber Brasil")
        self.assertEqual(res["transactions"][0]["currency"], "BRL")

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
                                "text": '{"transactions": [{"amount": 50.00, "date": "2026-05-15", "merchant": "Amazon", "currency": "USD"}]}'
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

        self.assertEqual(res["transactions"][0]["amount"], 50.00)
        self.assertEqual(res["transactions"][0]["merchant"], "Amazon")
        self.assertEqual(res["transactions"][0]["currency"], "USD")



