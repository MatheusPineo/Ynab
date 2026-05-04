from rest_framework import serializers
from .models import Account, Category, Transaction, Goal, MonthlyBudget, UserProfile, DistributionTemplate, DistributionTemplateItem
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.models import User



# Serializers originais
class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True},
            'user': {'read_only': True},  # Preenchido automaticamente pela view
        }

class MonthlyBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyBudget
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    assigned_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0.00)
    spent_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0.00)

    class Meta:
        model = Category
        fields = ['id', 'user', 'name', 'parent', 'assigned_amount', 'spent_amount']
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True},
            'user': {'read_only': True},  # Preenchido automaticamente pela view
        }

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},  # Preenchido automaticamente pela view
        }

# Serializer para JWT Customizado

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
        data['user'] = UserSerializer(user).data
        return data

class DistributionTemplateItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistributionTemplateItem
        fields = ['id', 'account', 'percentage', 'fixed_amount']
        extra_kwargs = {
            'percentage': {'required': False, 'allow_null': True},
            'fixed_amount': {'required': False, 'allow_null': True},
        }

class DistributionTemplateSerializer(serializers.ModelSerializer):
    items = DistributionTemplateItemSerializer(many=True, required=False, allow_empty=True)

    class Meta:
        model = DistributionTemplate
        fields = ['id', 'name', 'created_at', 'items']
        extra_kwargs = {
            'user': {'read_only': True},
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        template = DistributionTemplate.objects.create(**validated_data)
        for item_data in items_data:
            DistributionTemplateItem.objects.create(template=template, **item_data)
        return template

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        if items_data is not None:
            # Simple approach: delete old items and recreate
            instance.items.all().delete()
            for item_data in items_data:
                DistributionTemplateItem.objects.create(template=instance, **item_data)

        return instance
