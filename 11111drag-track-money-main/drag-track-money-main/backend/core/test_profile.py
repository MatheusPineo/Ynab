from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import UserProfile

class ProfileTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpassword')
        UserProfile.objects.create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_update_profile(self):
        response = self.client.post(reverse('profile-update'), {
            'name': 'John Doe',
            'bio': 'New bio',
            'preferred_currency': 'USD',
            'language': 'en-US'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'John')
        self.assertEqual(self.user.last_name, 'Doe')
        
        self.assertEqual(self.user.profile.bio, 'New bio')
        self.assertEqual(self.user.profile.preferred_currency, 'USD')
        self.assertEqual(self.user.profile.language, 'en-US')

    def test_change_password(self):
        # A view exige uma senha que não seja vazia e has_usable_password
        self.user.set_password('testpassword')
        self.user.save()
        
        response = self.client.post(reverse('password-change'), {
            'new_password': 'newpassword123',
            'confirm_password': 'newpassword123'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify old password no longer works
        login_response = self.client.post('/api/token/', {'username': 'test@example.com', 'password': 'testpassword'}, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Verify new password works
        login_response_new = self.client.post('/api/token/', {'username': 'test@example.com', 'password': 'newpassword123'}, format='json')
        self.assertEqual(login_response_new.status_code, status.HTTP_200_OK)
