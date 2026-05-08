from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import Account, Category
from decimal import Decimal

class AccountsAndCategoriesTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_account_crud(self):
        # Create
        response = self.client.post(reverse('account-list'), {
            'name': 'Main Checking',
            'account_type': 'checking',
            'currency': 'BRL',
            'balance': '1500.00'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        account_id = response.data['id']
        
        # Read
        response = self.client.get(reverse('account-detail', args=[account_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Main Checking')
        
        # Update
        response = self.client.patch(reverse('account-detail', args=[account_id]), {
            'name': 'Updated Checking'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Checking')
        
        # Delete
        response = self.client.delete(reverse('account-detail', args=[account_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Account.objects.count(), 0)

    def test_account_tree(self):
        root = Account.objects.create(user=self.user, name='Root Account')
        child = Account.objects.create(user=self.user, name='Child Account', parent=root)
        
        response = self.client.get(reverse('account-tree'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Root Account')
        self.assertIn('children', response.data[0])
        self.assertEqual(len(response.data[0]['children']), 1)
        self.assertEqual(response.data[0]['children'][0]['name'], 'Child Account')

    def test_data_isolation(self):
        other_user = User.objects.create_user(username='other', password='password')
        Account.objects.create(user=other_user, name='Other User Account')
        
        response = self.client.get(reverse('account-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0) # Shouldn't see other user's accounts

    def test_category_crud(self):
        # Create
        response = self.client.post(reverse('category-list'), {
            'name': 'Groceries'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cat_id = response.data['id']
        
        # Update
        response = self.client.patch(reverse('category-detail', args=[cat_id]), {
            'name': 'Food & Groceries'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Delete
        response = self.client.delete(reverse('category-detail', args=[cat_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
