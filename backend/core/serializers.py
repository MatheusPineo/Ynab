from rest_framework import serializers
from .models import Account, Category, Transaction, Goal, MonthlyBudget, UserProfile, DistributionTemplate, DistributionTemplateItem, Debt, DebtPayment
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

    def validate(self, attrs):
        parent = attrs.get('parent')
        if self.instance and parent:
            if parent.id == self.instance.id:
                raise serializers.ValidationError({"parent": "Uma conta não pode ser filha de si mesma."})
            
            # Verificar se o novo pai é um descendente da própria conta
            current = parent
            while current is not None:
                if current.id == self.instance.id:
                    raise serializers.ValidationError({"parent": "Uma conta não pode ser movida para dentro de um de seus próprios descendentes."})
                current = current.parent
                
        return attrs

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
        
        # Fallback de segurança: se a nossa autenticação local retornou None por alguma diferença de backend,
        # mas o SimpleJWT autenticou com sucesso (self.user), usamos o usuário autenticado por ele.
        user_obj = user or getattr(self, 'user', None)
        if user_obj:
            data['user'] = UserSerializer(user_obj).data
            
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

class DebtPaymentSerializer(serializers.ModelSerializer):
    account_name = serializers.SerializerMethodField()

    class Meta:
        model = DebtPayment
        fields = ['id', 'debt', 'amount', 'date', 'account', 'account_name', 'transaction', 'created_at']
        extra_kwargs = {
            'transaction': {'read_only': True},
            'debt': {'required': False},
        }

    def get_account_name(self, obj):
        if obj.account:
            return obj.account.name
        return None

class DebtSerializer(serializers.ModelSerializer):
    amount_paid = serializers.SerializerMethodField()
    amount_remaining = serializers.SerializerMethodField()
    payments = DebtPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Debt
        fields = ['id', 'user', 'counterparty_name', 'original_amount', 'currency', 'is_mine', 'notes', 'created_at', 'amount_paid', 'amount_remaining', 'payments']
        extra_kwargs = {
            'user': {'read_only': True},
        }

    def get_amount_paid(self, obj):
        from decimal import Decimal
        total = sum(p.amount for p in obj.payments.all())
        return float(total)

    def get_amount_remaining(self, obj):
        from decimal import Decimal
        total_paid = sum(p.amount for p in obj.payments.all())
        remaining = obj.original_amount - total_paid
        return float(max(remaining, Decimal('0.00')))
