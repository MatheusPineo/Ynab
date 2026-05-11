from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import Goal
from decimal import Decimal

class GoalsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_goal_crud(self):
        # Create
        response = self.client.post(reverse('goal-list'), {
            'name': 'New Car',
            'target_amount': '50000.00',
            'current_amount': '1000.00',
            'currency': 'BRL',
            'emoji': '🚗'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        goal_id = response.data['id']
        
        # Read
        response = self.client.get(reverse('goal-detail', args=[goal_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'New Car')
        
        # Update
        response = self.client.patch(reverse('goal-detail', args=[goal_id]), {
            'current_amount': '5000.00'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current_amount'], '5000.00')
        
        # Delete
        response = self.client.delete(reverse('goal-detail', args=[goal_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Goal.objects.count(), 0)
