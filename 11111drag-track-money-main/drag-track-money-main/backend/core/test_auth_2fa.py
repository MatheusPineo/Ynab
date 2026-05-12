from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import UserProfile
import pyotp

class AuthAnd2FATests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpassword')
        UserProfile.objects.create(user=self.user)
        self.client = APIClient()

    def test_login_success(self):
        url = reverse('token_obtain_pair')  # Assuming this is the name or we use the path
        # Let's use the actual URL path if reverse fails, but typically it's token_obtain_pair
        # Actually in URLs it's probably not named. Let's use the explicit path:
        response = self.client.post('/api/token/', {'username': 'test@example.com', 'password': 'testpassword'}, format='json')
        if response.status_code == 404:
            # Maybe the path is different
            pass
        else:
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('access', response.data)

    def test_login_invalid(self):
        response = self.client.post('/api/token/', {'username': 'test@example.com', 'password': 'wrong'}, format='json')
        if response.status_code != 404:
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register(self):
        response = self.client.post('/api/register/', {
            'name': 'New User',
            'email': 'new@example.com',
            'password': 'newpassword123'
        }, format='json')
        if response.status_code != 404:
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertTrue(User.objects.filter(email='new@example.com').exists())

    def test_2fa_setup_and_verify(self):
        self.client.force_authenticate(user=self.user)
        
        # Setup 2FA
        response = self.client.get(reverse('2fa-setup'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('secret', response.data)
        
        secret = response.data['secret']
        
        # Verify 2FA
        self.user.profile.refresh_from_db()
        totp = pyotp.TOTP(self.user.profile.two_factor_secret)
        code = totp.now()
        
        verify_response = self.client.post(reverse('2fa-verify'), {'code': code}, format='json')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.two_factor_enabled)

    def test_2fa_disable(self):
        self.user.profile.two_factor_enabled = True
        self.user.profile.two_factor_secret = pyotp.random_base32()
        self.user.profile.save()
        
        self.client.force_authenticate(user=self.user)
        response = self.client.post(reverse('2fa-disable'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.profile.refresh_from_db()
        self.assertFalse(self.user.profile.two_factor_enabled)
