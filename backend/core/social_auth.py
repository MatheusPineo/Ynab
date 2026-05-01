import requests as py_requests
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_access_token(access_token):
    """Verifica um access_token chamando o endpoint de userinfo do Google."""
    response = py_requests.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        params={'access_token': access_token}
    )
    if not response.ok:
        raise Exception("Falha ao verificar access_token com o Google")
    return response.json()

def verify_google_token(token):
    try:
        # O CLIENT_ID deve ser configurado no settings.py futuramente ou passado aqui
        # Por enquanto, tentaremos obter do settings
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)

        # ID token is valid. Get the user's Google ID from the decoded token.
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        return idinfo
    except Exception as e:
        raise exceptions.AuthenticationFailed(f'Invalid Google Token: {str(e)}')

def get_or_create_google_user(idinfo):
    email = idinfo.get('email')
    full_name = idinfo.get('name', '')
    first_name = idinfo.get('given_name', '')
    last_name = idinfo.get('family_name', '')
    picture = idinfo.get('picture', '')
    
    # Se first_name estiver vazio mas tivermos full_name, tentamos separar
    if not first_name and full_name:
        parts = full_name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'first_name': first_name,
            'last_name': last_name,
        }
    )
    
    if not created:
        user.first_name = first_name
        user.last_name = last_name
        user.save()
        
    # Adicionamos a foto no objeto temporário para retornar ao frontend
    # Nota: O modelo User padrão não tem campo avatar, então passamos no retorno da view
    user.google_picture = picture
    return user
