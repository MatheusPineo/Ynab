from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from finance.models import TrustedDevice

class DeviceRegisterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device_name = request.data.get('device_name')
        if not device_name:
            return Response(
                {"error": "O campo 'device_name' é obrigatório."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Gera o token em texto puro (enviado apenas uma vez ao frontend)
        raw_token = TrustedDevice.generate_token()
        token_key = raw_token[:8]
        token_hash = TrustedDevice.hash_token(raw_token)

        device = TrustedDevice.objects.create(
            user=request.user,
            device_name=device_name,
            token_key=token_key,
            token_hash=token_hash,
            is_active=True
        )

        return Response({
            "id": device.id,
            "device_name": device.device_name,
            "token": raw_token,  # Exibido APENAS neste momento
            "token_key": token_key,
            "created_at": device.created_at
        }, status=status.HTTP_201_CREATED)


class DeviceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        devices = TrustedDevice.objects.filter(user=request.user, is_active=True)
        data = [
            {
                "id": dev.id,
                "device_name": dev.device_name,
                "token_key": dev.token_key,
                "last_used": dev.last_used,
                "created_at": dev.created_at
            }
            for dev in devices
        ]
        return Response(data, status=status.HTTP_200_OK)


class DeviceRevokeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        # Localiza o dispositivo do usuário ativo ou retorna 404
        device = get_object_or_404(TrustedDevice, id=pk, user=request.user)
        
        # Revoga o acesso desativando o token
        device.is_active = False
        device.save(update_fields=['is_active'])
        
        # Opcionalmente, pode ser deletado fisicamente:
        # device.delete()

        return Response(
            {"message": "Acesso do dispositivo revogado com sucesso."}, 
            status=status.HTTP_200_OK
        )