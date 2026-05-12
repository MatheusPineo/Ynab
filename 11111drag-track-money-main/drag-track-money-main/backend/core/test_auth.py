import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_register_user(client):
    url = reverse('register')
    data = {
        'email': 'newuser@example.com',
        'password': 'password123',
        'name': 'New'
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.filter(email='newuser@example.com').exists()

@pytest.mark.django_db
def test_login_user(client):
    # Primeiro cria o usuário
    User.objects.create_user(username='testuser', password='testpassword123')
    
    url = reverse('token_obtain_pair')
    data = {
        'username': 'testuser',
        'password': 'testpassword123'
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data
    assert 'refresh' in response.data

@pytest.mark.django_db
def test_login_invalid_credentials(client):
    url = reverse('token_obtain_pair')
    data = {
        'username': 'wronguser',
        'password': 'wrongpassword'
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
