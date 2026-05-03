from django.test import TestCase
from django.contrib.auth.models import User
from core.models import Account
from rest_framework.test import APIClient
from rest_framework import status

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
