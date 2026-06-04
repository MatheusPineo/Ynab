import re
from rest_framework import serializers
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from finance.models import TrustedDevice
import uuid

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def parse_user_agent(ua_string):
    if not ua_string:
        return "Unknown"
    # Análise básica de User-Agent
    os_name = "Unknown OS"
    if "Windows" in ua_string:
        os_name = "Windows"
    elif "Macintosh" in ua_string or "Mac OS X" in ua_string:
        os_name = "macOS"
    elif "Android" in ua_string:
        os_name = "Android"
    elif "iPhone" in ua_string or "iPad" in ua_string:
        os_name = "iOS"
    elif "Linux" in ua_string:
        os_name = "Linux"

    browser_name = "Unknown Browser"
    if "Firefox" in ua_string:
        browser_name = "Firefox"
    elif "Chrome" in ua_string and "Safari" in ua_string:
        browser_name = "Chrome"
    elif "Safari" in ua_string and "Chrome" not in ua_string:
        browser_name = "Safari"
    elif "Edge" in ua_string:
        browser_name = "Edge"
    elif "Postman" in ua_string:
        browser_name = "Postman"

    return f"{browser_name} on {os_name}"

def timezone_to_location(timezone):
    if not timezone:
        return None
    parts = timezone.split('/')
    if len(parts) == 2:
        return f"{parts[1].replace('_', ' ')}, {parts[0]}"
    return timezone

class DeviceRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    device_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    custom_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    device_key = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    raw_user_agent = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    timezone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_device_key(self, value):
        if not value:
            return value
        try:
            uuid.UUID(str(value))
        except ValueError:
            raise serializers.ValidationError("Invalid device key format.")
        return value

    def validate(self, data):
        if not data.get('device_key'):
            data['device_key'] = str(uuid.uuid4())
        return data

class DeviceRegisterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeviceRegisterSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            errors = serializer.errors
            detail_msg = "Dados inválidos."
            if 'device_key' in errors:
                detail_msg = errors['device_key'][0]
            elif 'non_field_errors' in errors:
                detail_msg = errors['non_field_errors'][0]
                
            return Response(
                {"detail": detail_msg, "error": detail_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data
        
        # Parsing User Agent e IP
        ua_string = validated_data.get('raw_user_agent') or request.META.get('HTTP_USER_AGENT', '')
        os_browser_info = parse_user_agent(ua_string)
        ip = get_client_ip(request)
        
        # Geolocation via ip-api.com
        location_string = "Unknown"
        if ip and ip != '127.0.0.1' and not ip.startswith('192.168.') and not ip.startswith('10.'):
            try:
                import requests
                # Use a fast timeout (2s) to prevent blocking requests
                response = requests.get(f"http://ip-api.com/json/{ip}", timeout=2.0)
                if response.status_code == 200:
                    geo_data = response.json()
                    if geo_data.get('status') == 'success':
                        city = geo_data.get('city', '')
                        country = geo_data.get('country', '')
                        if city and country:
                            location_string = f"{city}, {country}"
                        elif country:
                            location_string = country
            except Exception as e:
                print(f"Erro ao obter geolocalização do IP {ip}: {e}")

        # Se não resolveu via IP, tenta usar timezone
        if location_string == "Unknown" or not location_string:
            timezone = validated_data.get('timezone')
            location_string = timezone_to_location(timezone) or "Unknown"

        # Se custom_name/name/device_name foi enviado, prioritiza
        custom_name = validated_data.get('custom_name')
        device_name = custom_name or validated_data.get('device_name') or validated_data.get('name') or os_browser_info

        raw_token = TrustedDevice.generate_token()
        token_key = raw_token[:8]
        token_hash = TrustedDevice.hash_token(raw_token)

        device = TrustedDevice.objects.create(
            user=request.user,
            device_name=device_name,
            custom_name=custom_name,
            os_browser_info=os_browser_info,
            ip_address=ip,
            location_string=location_string,
            token_key=token_key,
            token_hash=token_hash,
            is_active=True
        )

        return Response({
            "id": device.id,
            "device_name": device.device_name,
            "custom_name": device.custom_name,
            "os_browser_info": device.os_browser_info,
            "ip_address": device.ip_address,
            "location_string": device.location_string,
            "token": raw_token,
            "token_key": token_key,
            "created_at": device.created_at
        }, status=status.HTTP_201_CREATED)


class DeviceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        devices = TrustedDevice.objects.filter(user=request.user, is_active=True)
        
        # Identificar o dispositivo da sessão atual
        current_device = getattr(request, 'auth', None)
        
        data = [
            {
                "id": dev.id,
                "device_name": dev.device_name,
                "custom_name": dev.custom_name,
                "os_browser_info": dev.os_browser_info,
                "ip_address": dev.ip_address,
                "location_string": dev.location_string,
                "token_key": dev.token_key,
                "last_used": dev.last_used,
                "last_used_at": dev.last_used_at,
                "created_at": dev.created_at,
                "is_current_device": current_device == dev if current_device else False
            }
            for dev in devices
        ]
        return Response(data, status=status.HTTP_200_OK)


class DeviceRevokeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        device = get_object_or_404(TrustedDevice, id=pk, user=request.user)
        device.is_active = False
        device.save(update_fields=['is_active'])
        return Response(
            {"message": "Acesso do dispositivo revogado com sucesso."}, 
            status=status.HTTP_200_OK
        )