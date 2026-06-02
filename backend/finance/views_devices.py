from rest_framework import serializers
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from finance.models import TrustedDevice
import uuid

class DeviceRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    device_name = serializers.CharField(required=False, allow_blank=True)
    device_key = serializers.CharField(required=True)

    def validate_device_key(self, value):
        try:
            uuid.UUID(str(value))
        except ValueError:
            raise serializers.ValidationError("Invalid device key format.")
        return value

    def validate(self, data):
        name = data.get('device_name') or data.get('name')
        if not name:
            raise serializers.ValidationError("O campo 'device_name' ou 'name' é obrigatório.")
            
        return data

class DeviceRegisterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeviceRegisterSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            # Extrai o primeiro erro para manter a compatibilidade de resposta detalhada
            errors = serializer.errors
            detail_msg = "Dados inválidos."
            if 'device_key' in errors:
                detail_msg = errors['device_key'][0]
            elif 'non_field_errors' in errors:
                detail_msg = errors['non_field_errors'][0]
            elif 'name' in errors:
                detail_msg = errors['name'][0]
            elif 'device_name' in errors:
                detail_msg = errors['device_name'][0]
                
            return Response(
                {"detail": detail_msg, "error": detail_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data
        device_name = validated_data.get('device_name') or validated_data.get('name')

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