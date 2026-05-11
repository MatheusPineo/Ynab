from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('bio', 'avatar_url', 'preferred_currency', 'language')

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    has_password = serializers.SerializerMethodField()
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'profile', 'has_password')
        extra_kwargs = {'password': {'write_only': True}}

    def get_has_password(self, obj):
        return obj.has_usable_password() and obj.password != ""

    def validate_email(self, value):
        user = User.objects.filter(email=value).first()
        if user:
            if not user.has_usable_password() or user.password == "":
                raise serializers.ValidationError("Esta conta foi criada usando o Google. Por favor, faça login com o Google.")
            else:
                raise serializers.ValidationError("Este e-mail já está em uso por outra conta.")
        return value

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        name = validated_data.get('name', '')
        
        # Usamos o email como username para simplificar o login depois
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name
        )
        
        # Garante a criação automática do perfil de usuário associado
        UserProfile.objects.get_or_create(user=user)
        
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('email')
        password = attrs.get('password')
        
        if not username:
             username = attrs.get('username')
             
        user = authenticate(username=username, password=password)
        if not user:
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        
        if user:
            # Verifica se o 2FA está ativado para este usuário
            try:
                profile = user.profile
                if profile.two_factor_enabled:
                    # Retornamos uma estrutura diferente que o frontend vai identificar
                    return {
                        "two_factor_required": True,
                        "user_id": user.id
                    }
            except UserProfile.DoesNotExist:
                pass
                
            attrs['username'] = user.username
        
        data = super().validate(attrs)
        
        # Fallback de segurança
        user_obj = user or getattr(self, 'user', None)
        if user_obj:
            data['user'] = UserSerializer(user_obj).data
            
        return data
