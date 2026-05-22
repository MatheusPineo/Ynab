from django.conf import settings
from rest_framework import permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from rest_framework import generics
from django.contrib.auth.models import User
from django.http import HttpResponse
from datetime import datetime
import pyotp
import uuid

from django.core.mail import EmailMultiAlternatives
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import json

from drf_spectacular.utils import extend_schema, inline_serializer

from .models import UserProfile, SupportTicket
from .serializers import UserSerializer, MyTokenObtainPairSerializer
from .social_auth import verify_google_token, get_or_create_google_user, verify_google_access_token

class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Inicia a configuração da Autenticação de Dois Fatores (2FA)",
        description="Gera uma chave secreta baseada em tempo (TOTP) para o usuário autenticado e retorna a URI para pareamento com aplicativos autenticadores.",
        responses={
            200: inline_serializer(
                name="TwoFactorSetupResponse",
                fields={
                    "secret": serializers.CharField(help_text="O segredo compartilhado em Base32."),
                    "provisioning_uri": serializers.CharField(help_text="A URI de provisionamento TOTP para o autenticador.")
                }
            ),
            400: inline_serializer(
                name="TwoFactorSetupError",
                fields={"error": serializers.CharField()}
            )
        }
    )
    def get(self, request):
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        if profile.two_factor_enabled:
            return Response({"error": "2FA já está ativado."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not profile.two_factor_secret:
            profile.two_factor_secret = pyotp.random_base32()
            profile.save()
            
        totp = pyotp.TOTP(profile.two_factor_secret)
        provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="Vault Finance OS")
        
        return Response({
            "secret": profile.two_factor_secret,
            "provisioning_uri": provisioning_uri
        })

class TwoFactorVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Verifica o código OTP e ativa o 2FA",
        description="Recebe um código de 6 dígitos gerado pelo aplicativo autenticador do usuário para confirmar a posse da chave de segurança e ativa o 2FA no perfil.",
        request=inline_serializer(
            name="TwoFactorVerifyRequest",
            fields={
                "code": serializers.CharField(max_length=6, min_length=6, help_text="Código de verificação temporário TOTP de 6 dígitos.")
            }
        ),
        responses={
            200: inline_serializer(
                name="TwoFactorVerifySuccess",
                fields={"message": serializers.CharField()}
            ),
            400: inline_serializer(
                name="TwoFactorVerifyError",
                fields={"error": serializers.CharField()}
            )
        }
    )
    def post(self, request):
        user = request.user
        profile = user.profile
        code = request.data.get("code")
        
        if not code:
            return Response({"error": "Código é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
            
        totp = pyotp.TOTP(profile.two_factor_secret)
        if totp.verify(code):
            profile.two_factor_enabled = True
            profile.save()
            return Response({"message": "2FA ativado com sucesso!"})
        else:
            return Response({"error": "Código inválido."}, status=status.HTTP_400_BAD_REQUEST)

class TwoFactorDisableView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Desativa o 2FA",
        description="Desativa a proteção por dois fatores e limpa as credenciais de autenticação TOTP registradas no perfil.",
        responses={
            200: inline_serializer(
                name="TwoFactorDisableResponse",
                fields={"message": serializers.CharField()}
            )
        }
    )
    def post(self, request):
        user = request.user
        profile = user.profile
        profile.two_factor_enabled = False
        profile.two_factor_secret = None
        profile.save()
        return Response({"message": "2FA desativado com sucesso!"})

class TwoFactorLoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Conclui o Login com autenticação 2FA",
        description="Endpoint público utilizado na segunda etapa de login por usuários que possuem 2FA ativado no perfil. Retorna os tokens JWT.",
        request=inline_serializer(
            name="TwoFactorLoginRequest",
            fields={
                "user_id": serializers.IntegerField(help_text="ID do usuário."),
                "code": serializers.CharField(max_length=6, min_length=6, help_text="Token numérico TOTP de 6 dígitos gerado pelo Authenticator.")
            }
        ),
        responses={
            200: inline_serializer(
                name="TwoFactorLoginSuccess",
                fields={
                    "access": serializers.CharField(help_text="Token JWT de acesso de curta duração."),
                    "refresh": serializers.CharField(help_text="Token JWT de renovação de longa duração."),
                    "user": UserSerializer()
                }
            ),
            400: inline_serializer(
                name="TwoFactorLoginError",
                fields={"error": serializers.CharField()}
            ),
            404: inline_serializer(
                name="TwoFactorLoginNotFoundError",
                fields={"error": serializers.CharField()}
            )
        }
    )
    def post(self, request):
        user_id = request.data.get("user_id")
        code = request.data.get("code")
        
        if not user_id or not code:
            return Response({"error": "ID de usuário e código são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            profile = user.profile
            
            totp = pyotp.TOTP(profile.two_factor_secret)
            if totp.verify(code):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data
                })
            else:
                return Response({"error": "Código 2FA inválido."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        name = request.data.get('name')
        bio = request.data.get('bio')
        preferred_currency = request.data.get('preferred_currency')
        language = request.data.get('language')
        hidden_sidebar_items = request.data.get('hidden_sidebar_items')
        
        if name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            user.save()
            
        profile, created = UserProfile.objects.get_or_create(user=user)
        if bio is not None:
            profile.bio = bio
        if preferred_currency:
            profile.preferred_currency = preferred_currency
        if language:
            profile.language = language
        if hidden_sidebar_items is not None:
            profile.hidden_sidebar_items = hidden_sidebar_items
            
        profile.save()
            
        return Response({
            'message': 'Perfil atualizado com sucesso!',
            'user': UserSerializer(user).data
        })

def ping(request):
    """Endpoint público leve que realiza uma consulta rápida no banco para manter o Supabase ativo."""
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return HttpResponse("ok", content_type="text/plain", status=200)
    except Exception as e:
        return HttpResponse(f"error: {str(e)}", content_type="text/plain", status=500)

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        with open("backend_debug.txt", "a") as f:
            f.write(f"\n--- REQUEST {datetime.now()} ---\n")
            f.write(f"Token: {token[:20]}...\n")
            f.write(f"GOOGLE_CLIENT_ID: {settings.GOOGLE_CLIENT_ID}\n")
        
        if not token:
            return Response({'error': 'Token é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            try:
                idinfo = verify_google_token(token)
            except Exception:
                idinfo = verify_google_access_token(token)
            
            user = get_or_create_google_user(idinfo)
            
            avatar = idinfo.get('picture')
            if avatar:
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile.avatar_url = avatar
                profile.save()
            
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data
            })
            
        except Exception as e:
            import traceback
            error_msg = f"Erro no login social: {str(e)}"
            with open("backend_debug.txt", "a") as f:
                f.write(f"\n--- {datetime.now()} ---\n")
                f.write(error_msg + "\n")
                f.write(traceback.format_exc() + "\n")
            
            return Response({
                'error': error_msg,
                'detail': traceback.format_exc()
            }, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.has_usable_password() or user.password == "":
            return Response(
                {"error": "Contas conectadas pelo Google não podem alterar a senha diretamente."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not new_password or not confirm_password:
            return Response({"error": "Preencha todos os campos."}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({"error": "As senhas não coincidem."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Senha alterada com sucesso!"})


class SubmitSupportTicketView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        user = request.user
        name = request.data.get('name')
        email = request.data.get('email')
        ticket_type = request.data.get('ticket_type', 'technical')
        urgency = request.data.get('urgency', 'medium')
        subject = request.data.get('subject')
        message = request.data.get('message')
        attachment = request.FILES.get('attachment')
        diagnostic_data_str = request.data.get('diagnostic_data')

        if not name or not email or not subject or not message:
            return Response({"error": "Campos obrigatórios ausentes."}, status=status.HTTP_400_BAD_REQUEST)

        diagnostic_data = None
        if diagnostic_data_str:
            try:
                diagnostic_data = json.loads(diagnostic_data_str)
            except Exception:
                pass

        ticket = SupportTicket.objects.create(
            user=user,
            name=name,
            email=email,
            ticket_type=ticket_type,
            urgency=urgency,
            subject=subject,
            message=message,
            attachment=attachment,
            diagnostic_data=diagnostic_data
        )

        ticket_code = f"VT-{ticket.id:05d}"
        
        type_labels = {
            'technical': 'Problema Técnico ou Bug 🐛',
            'account': 'Dúvidas de Conta / Login 🔐',
            'finance': 'Assinatura / Cobrança Pro 💳',
            'other': 'Outro Tipo de Dúvida 💬'
        }
        urgency_labels = {
            'low': 'Baixa 🟢',
            'medium': 'Média 🟡',
            'high': 'Alta 🔴'
        }
        
        ticket_type_label = type_labels.get(ticket_type, ticket_type)
        urgency_label = urgency_labels.get(urgency, urgency)

        plain_body = f"""
NOVO CHAMADO DE SUPORTE - {ticket_code}

Assunto: {subject}
Usuário: {name} ({user.username})
Email de contato: {email}
Tipo: {ticket_type_label}
Urgência: {urgency_label}

Mensagem:
{message}
"""
        html_body = f"""
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #111827; border-radius: 12px; overflow: hidden; background-color: #0b0f19; color: #f3f4f6;">
    <div style="background-color: #090d16; border-bottom: 2px solid #10b981; padding: 24px; text-align: center;">
        <h1 style="color: #10b981; margin: 0; font-size: 20px; letter-spacing: 1px;">VAULT FINANCE OS</h1>
        <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px;">Novo Chamado de Suporte Aberto</p>
    </div>
    <div style="padding: 24px;">
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Código do Ticket:</strong> <span style="color: #10b981; font-family: monospace; font-size: 15px;">{ticket_code}</span></p>
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Usuário:</strong> {name} ({user.username})</p>
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>E-mail de Contato:</strong> {email}</p>
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Tipo de Chamado:</strong> {ticket_type_label}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Urgência:</strong> {urgency_label}</p>
        </div>
        <h2 style="font-size: 15px; color: #10b981; margin-top: 0; border-bottom: 1px solid #1f2937; pb: 6px;">Mensagem do Usuário:</h2>
        <div style="background-color: #111827; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #e5e7eb; white-space: pre-wrap; margin-bottom: 20px;">{message}</div>
"""
        if diagnostic_data:
            html_body += f"""
        <h2 style="font-size: 15px; color: #10b981; margin-top: 0; border-bottom: 1px solid #1f2937; pb: 6px;">Dados de Telemetria:</h2>
        <table style="width: 100%; font-size: 11px; font-family: monospace; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #111827;"><td style="padding: 6px; font-weight: bold; width: 30%;">Sistema Operacional:</td><td style="padding: 6px; color: #10b981;">{diagnostic_data.get('os')}</td></tr>
            <tr style="background-color: #0b0f19;"><td style="padding: 6px; font-weight: bold;">Navegador:</td><td style="padding: 6px; color: #10b981;">{diagnostic_data.get('browser')}</td></tr>
            <tr style="background-color: #111827;"><td style="padding: 6px; font-weight: bold;">Resolução:</td><td style="padding: 6px; color: #10b981;">{diagnostic_data.get('resolution')}</td></tr>
            <tr style="background-color: #0b0f19;"><td style="padding: 6px; font-weight: bold;">Versão do App:</td><td style="padding: 6px; color: #10b981;">{diagnostic_data.get('appVersion')}</td></tr>
            <tr style="background-color: #111827;"><td style="padding: 6px; font-weight: bold;">Latência de Rede:</td><td style="padding: 6px; color: #10b981;">{diagnostic_data.get('latence')}</td></tr>
        </table>
"""
        html_body += """
    </div>
    <div style="background-color: #090d16; padding: 16px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #1f2937;">
        Este é um e-mail automático enviado pela central de suporte do Vault Finance OS.
    </div>
</div>
"""

        try:
            email_msg = EmailMultiAlternatives(
                subject=f"[Vault Finance] Novo Chamado {ticket_code} - {subject}",
                body=plain_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[settings.SUPPORT_RECEIVER_EMAIL]
            )
            email_msg.attach_alternative(html_body, "text/html")
            
            if attachment:
                email_msg.attach(attachment.name, attachment.read(), attachment.content_type)
                
            email_msg.send(fail_silently=False)
        except Exception as e:
            # Registrar erro de envio de e-mail silenciosamente para não quebrar a API do cliente
            pass

        return Response({
            "message": "Chamado aberto com sucesso!",
            "ticket_id": ticket_code
        }, status=status.HTTP_201_CREATED)
