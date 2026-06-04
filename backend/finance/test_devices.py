import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from finance.models import TrustedDevice

class DeviceRegisterTests(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(username='device_test_user', password='password123')
        self.client = APIClient()

    def test_unauthenticated_registration_fails(self) -> None:
        """Verifica que requisição não autenticada retorna 401."""
        response = self.client.post(
            reverse('device-register'),
            {'device_name': 'Telemóvel Android', 'device_key': str(uuid.uuid4())},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_valid_registration_succeeds(self) -> None:
        """Verifica que o payload válido de usuário autenticado registra o dispositivo com sucesso (201)."""
        self.client.force_authenticate(user=self.user)
        device_key = str(uuid.uuid4())
        response = self.client.post(
            reverse('device-register'),
            {'device_name': 'Telemóvel Android - Teste', 'device_key': device_key},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['device_name'], 'Telemóvel Android - Teste')

        # Assert database record was created
        device_record = TrustedDevice.objects.filter(user=self.user, device_name='Telemóvel Android - Teste').first()
        self.assertIsNotNone(device_record)
        self.assertTrue(device_record.is_active)

    def test_invalid_device_key_format_returns_400(self) -> None:
        """Verifica que device_key em formato inválido retorna 400."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse('device-register'),
            {'device_name': 'Telemóvel Android - Teste', 'device_key': 'not-a-uuid'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertEqual(response.data['detail'], 'Invalid device key format.')

    def test_duplicate_device_name_succeeds(self) -> None:
        """Verifica que registrar um dispositivo com o mesmo nome mas chaves diferentes é permitido e retorna 201."""
        self.client.force_authenticate(user=self.user)
        device_key_1 = str(uuid.uuid4())
        device_key_2 = str(uuid.uuid4())
        
        # Primeiro registro
        response_1 = self.client.post(
            reverse('device-register'),
            {'device_name': 'Telemóvel Android - Duplicado', 'device_key': device_key_1},
            format='json'
        )
        self.assertEqual(response_1.status_code, status.HTTP_201_CREATED)

        # Segundo registro com o mesmo nome
        response_2 = self.client.post(
            reverse('device-register'),
            {'device_name': 'Telemóvel Android - Duplicado', 'device_key': device_key_2},
            format='json'
        )
        self.assertEqual(response_2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TrustedDevice.objects.filter(user=self.user, device_name='Telemóvel Android - Duplicado').count(), 2)

    def test_custom_name_priority_and_geolocation(self) -> None:
        """Verifica que o custom_name tem prioridade de nome e o campo location é preenchido com a cidade/país do IP."""
        self.client.force_authenticate(user=self.user)
        device_key = str(uuid.uuid4())
        
        response = self.client.post(
            reverse('device-register'),
            {
                'custom_name': 'Celular do Matheus',
                'device_name': 'Fallback Generic',
                'device_key': device_key,
                'timezone': 'Europe/London'
            },
            HTTP_X_FORWARDED_FOR='8.8.8.8',  # IP público para disparar fluxo de geo
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['device_name'], 'Celular do Matheus')
        self.assertEqual(response.data['custom_name'], 'Celular do Matheus')
        
        # O IP 8.8.8.8 deve retornar "Glenmont, United States" ou similar no ip-api, ou fallback para timezone "London, Europe"
        self.assertIsNotNone(response.data['location_string'])
        self.assertNotEqual(response.data['location_string'], 'Unknown')
