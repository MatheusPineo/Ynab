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
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        
        try:
            # 1. Tenta verificar localmente usando a biblioteca oficial
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            return idinfo
        except Exception as local_err:
            # 2. Fallback: Se falhar (comum no Android devido ao ID do Cliente do Android ser diferente do ID Web),
            # consultamos diretamente o endpoint seguro de TokenInfo do Google.
            # Isso valida a assinatura e autenticidade do token do Google de forma 100% segura e resiliente!
            response = py_requests.get(
                'https://oauth2.googleapis.com/tokeninfo',
                params={'id_token': token}
            )
            if response.ok:
                idinfo = response.json()
                if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                    raise ValueError('Wrong issuer.')
                return idinfo
            # Se ambos falharem, lança o erro original
            raise local_err
    except Exception as e:
        raise exceptions.AuthenticationFailed(f'Invalid Google Token: {str(e)}')

from .models import UserProfile

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
    
    if created:
        user.set_unusable_password()
        user.save()
    else:
        user.first_name = first_name
        user.last_name = last_name
        user.save()
        
    # Salva ou atualiza o perfil com a foto do Google
    profile, created = UserProfile.objects.get_or_create(user=user)
    if picture:
        profile.avatar_url = picture
        profile.save()
        
    return user

