import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import SupportTicket

@pytest.mark.django_db
def test_submit_ticket_unauthenticated(client):
    url = reverse('tickets')
    data = {
        'name': 'Matheus',
        'email': 'matheuskrx@gmail.com',
        'subject': 'Erro ao importar OFX',
        'message': 'Não está processando a conta de Poupança'
    }
    response = client.post(url, data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_submit_ticket_authenticated(client):
    # Cria usuário
    user = User.objects.create_user(username='testuser@example.com', password='password123')
    
    # Gera JWT Token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    url = reverse('tickets')
    data = {
        'name': 'Matheus',
        'email': 'matheuskrx@gmail.com',
        'ticket_type': 'technical',
        'urgency': 'high',
        'subject': 'Erro de teste',
        'message': 'Mensagem de teste de suporte'
    }
    
    # Faz requisição autenticada por JWT
    response = client.post(url, data, HTTP_AUTHORIZATION=f'Bearer {access_token}')
    assert response.status_code == status.HTTP_201_CREATED
    assert 'ticket_id' in response.data
    
    ticket = SupportTicket.objects.get(user=user)
    assert ticket.name == 'Matheus'
    assert ticket.email == 'matheuskrx@gmail.com'
    assert ticket.ticket_type == 'technical'
    assert ticket.urgency == 'high'
    assert ticket.subject == 'Erro de teste'
    assert ticket.message == 'Mensagem de teste de suporte'
