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

    def test_account_ceiling(self):
        # Create an account with a ceiling
        response = self.client.post(reverse('account-list'), {
            'name': 'Main Savings',
            'account_type': 'savings',
            'currency': 'BRL',
            'balance': '1000.00',
            'ceiling': '5000.00'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        account_id = response.data['id']
        self.assertEqual(float(response.data['ceiling']), 5000.00)

        # Update (PATCH) the ceiling to 5.00
        response = self.client.patch(reverse('account-detail', args=[account_id]), {
            'ceiling': '5.00'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['ceiling']), 5.00)

        # Retrieve through the custom account tree action
        response = self.client.get(reverse('account-tree'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['ceiling'], 5.00)

        # Clear the ceiling (set to null)
        response = self.client.patch(reverse('account-detail', args=[account_id]), {
            'ceiling': None
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['ceiling'])

        # Check tree again to ensure it's null
        response = self.client.get(reverse('account-tree'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data[0]['ceiling'])

    def test_data_isolation(self):
        other_user = User.objects.create_user(username='other', password='password')
        Account.objects.create(user=other_user, name='Other User Account')
        
        response = self.client.get(reverse('account-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0) # Shouldn't see other user's accounts

    def test_cover_overspending(self):
        # Create a parent bank account
        parent = Account.objects.create(user=self.user, name='Bank ABC', currency='BRL')
        
        # Create subaccounts
        sub1 = Account.objects.create(user=self.user, name='a1', parent=parent, currency='BRL', balance=1.00)  # Low balance
        sub2 = Account.objects.create(user=self.user, name='b2', parent=parent, currency='BRL', balance=-6.44) # Target
        sub3 = Account.objects.create(user=self.user, name='c3', parent=parent, currency='BRL', balance=20.00)
        sub4 = Account.objects.create(user=self.user, name='d4', parent=parent, currency='BRL', balance=30.00)
        sub5 = Account.objects.create(user=self.user, name='e5', parent=parent, currency='BRL', balance=40.00)
        sub6 = Account.objects.create(user=self.user, name='f6', parent=parent, currency='BRL', balance=0.00)  # Zero balance
        sub7 = Account.objects.create(user=self.user, name='g7', parent=parent, currency='BRL', balance=-5.00) # Negative balance
        
        # Another account in a different currency or without parent shouldn't be affected
        sub_diff = Account.objects.create(user=self.user, name='x1', parent=parent, currency='EUR', balance=100.00)

        # Call the endpoint for the negative account
        response = self.client.post(reverse('account-cover-overspending', args=[sub2.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from db
        sub1.refresh_from_db()
        sub2.refresh_from_db()
        sub3.refresh_from_db()
        sub4.refresh_from_db()
        sub5.refresh_from_db()
        sub6.refresh_from_db()
        sub7.refresh_from_db()
        sub_diff.refresh_from_db()
        
        # sub2 should be zeroed
        self.assertEqual(float(sub2.balance), 0.00)
        
        # sub6 and sub7 should NOT be touched
        self.assertEqual(float(sub6.balance), 0.00)
        self.assertEqual(float(sub7.balance), -5.00)
        
        # Deficit = 6.44. 
        # Active sibs: sub1(1.00), sub3(20), sub4(30), sub5(40) (N=4)
        # i=0 (sub1): fair=6.44/4=1.61. max taken=1.00. rem=5.44. sub1 becomes 0.00.
        # i=1 (sub3): fair=5.44/3=1.81. taken=1.81. rem=3.63. sub3 becomes 20.00 - 1.81 = 18.19.
        # i=2 (sub4): fair=3.63/2=1.82. taken=1.82. rem=1.81. sub4 becomes 30.00 - 1.82 = 28.18.
        # i=3 (sub5): last account takes rem=1.81. sub5 becomes 40.00 - 1.81 = 38.19.
        
        self.assertEqual(float(sub1.balance), 0.00)
        self.assertEqual(float(sub3.balance), 18.19)
        self.assertEqual(float(sub4.balance), 28.18)
        self.assertEqual(float(sub5.balance), 38.19)
        
        # Ensure diff currency not affected
        self.assertEqual(float(sub_diff.balance), 100.00)

    def test_distribute_excess(self):
        from decimal import Decimal
        parent = Account.objects.create(user=self.user, name='Bank XYZ', currency='BRL')

        # Source account: has ceiling=10, balance=22 (excess=12)
        source = Account.objects.create(user=self.user, name='source', parent=parent, currency='BRL', balance=22.00, ceiling=10.00)
        # Eligible: has ceiling=20, balance=12 (space=8)
        eligible1 = Account.objects.create(user=self.user, name='eligible1', parent=parent, currency='BRL', balance=12.00, ceiling=20.00)
        # At ceiling: should be skipped
        at_ceiling = Account.objects.create(user=self.user, name='at_ceiling', parent=parent, currency='BRL', balance=30.00, ceiling=30.00)
        # No ceiling: should be skipped
        no_ceiling = Account.objects.create(user=self.user, name='no_ceiling', parent=parent, currency='BRL', balance=5.00)
        # Different currency: should be skipped
        diff_currency = Account.objects.create(user=self.user, name='diff_curr', parent=parent, currency='EUR', balance=0.00, ceiling=50.00)

        response = self.client.post(reverse('account-distribute-excess', args=[source.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        source.refresh_from_db()
        eligible1.refresh_from_db()
        at_ceiling.refresh_from_db()
        no_ceiling.refresh_from_db()
        diff_currency.refresh_from_db()

        # source should be at ceiling (22 - 12 = 10)
        self.assertEqual(float(source.balance), 10.00)

        # eligible1 can receive up to 8 (space to ceiling). excess=12, only 1 eligible. takes min(12,8)=8. remaining=4.
        self.assertEqual(float(eligible1.balance), 20.00)

        # accounts at ceiling, no ceiling, diff currency must not change
        self.assertEqual(float(at_ceiling.balance), 30.00)
        self.assertEqual(float(no_ceiling.balance), 5.00)
        self.assertEqual(float(diff_currency.balance), 0.00)

        # The remaining 4 goes to the reserve account that should have been created
        reserve = Account.objects.filter(parent=parent, name='✦ Reserva de Excedente', currency='BRL').first()
        self.assertIsNotNone(reserve)
        self.assertEqual(float(reserve.balance), 4.00)

    def test_distribute_excess_no_ceiling(self):
        """Should return error if account has no ceiling."""
        parent = Account.objects.create(user=self.user, name='Bank', currency='BRL')
        acct = Account.objects.create(user=self.user, name='no_ceil', parent=parent, currency='BRL', balance=50.00)
        response = self.client.post(reverse('account-distribute-excess', args=[acct.id]))
        self.assertEqual(response.status_code, 400)

    def test_distribute_excess_not_over_ceiling(self):
        """Should return error if account is not above ceiling."""
        parent = Account.objects.create(user=self.user, name='Bank', currency='BRL')
        acct = Account.objects.create(user=self.user, name='fine', parent=parent, currency='BRL', balance=5.00, ceiling=10.00)
        response = self.client.post(reverse('account-distribute-excess', args=[acct.id]))
        self.assertEqual(response.status_code, 400)

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
