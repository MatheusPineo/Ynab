from django.test import TestCase
from django.contrib.auth.models import User
from core.models import Account
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

class AccountIconTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.account = Account.objects.create(
            user=self.user,
            name="Nubank",
            balance=1000,
            account_type='checking'
        )

    def test_update_account_icon(self):
        icon_url = "http://localhost:8002/media/icons/test_icon.png"
        response = self.client.patch(
            f'/api/accounts/{self.account.id}/',
            {'icon_url': icon_url},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.account.refresh_from_db()
        self.assertEqual(self.account.icon_url, icon_url)

    def test_tree_includes_icon_url(self):
        self.account.icon_url = "http://test.com/icon.png"
        self.account.save()
        
        response = self.client.get('/api/accounts/tree/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data[0]['icon_url'], "http://test.com/icon.png")

    def test_icon_upload_endpoint(self):
        # Cria uma imagem falsa em memória (PNG de 1 pixel)
        image_data = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4'
            b'\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        fake_file = SimpleUploadedFile("nubank_icon.png", image_data, content_type="image/png")
        
        response = self.client.post(
            '/api/icons/upload/',
            {'file': fake_file},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('url', data)
        # Garantir que a URL do arquivo não contém barras invertidas do Windows
        self.assertNotIn('\\', data['url'])

