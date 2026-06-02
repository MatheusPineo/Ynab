from datetime import datetime
from django.utils import timezone
from rest_framework import authentication
from rest_framework import exceptions
from finance.models import TrustedDevice

class DeviceTokenAuthentication(authentication.BaseAuthentication):
    """
    Autenticação baseada em token de dispositivo de longa duração.
    Espera o cabeçalho: Authorization: DeviceKey <token>
    """
    
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'devicekey':
            return None

        raw_token = parts[1]
        if len(raw_token) != 40:
            raise exceptions.AuthenticationFailed('Token de dispositivo inválido (tamanho incorreto).')

        # O prefixo é composto pelos primeiros 8 caracteres do token
        token_key = raw_token[:8]
        token_hash = TrustedDevice.hash_token(raw_token)

        try:
            device = TrustedDevice.objects.select_related('user').get(
                token_key=token_key,
                is_active=True
            )
        except TrustedDevice.DoesNotExist:
            raise exceptions.AuthenticationFailed('Dispositivo não registrado ou inativo.')

        # Validação segura por Hash
        if device.token_hash != token_hash:
            raise exceptions.AuthenticationFailed('Credenciais de token de dispositivo inválidas.')

        # Validar se o usuário associado está ativo
        if not device.user.is_active:
            raise exceptions.AuthenticationFailed('Usuário inativo no sistema.')

        # Atualizar a última utilização
        device.last_used = timezone.now()
        device.save(update_fields=['last_used'])

        return (device.user, device)