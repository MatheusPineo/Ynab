from rest_framework import serializers
from .models import Account, Category, Transaction, Goal, MonthlyBudget, DistributionTemplate, DistributionTemplateItem, Debt, DebtPayment

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
        total = sum(p.amount for p in obj.payments.all())
        return float(total)

    def get_amount_remaining(self, obj):
        from decimal import Decimal
        total_paid = sum(p.amount for p in obj.payments.all())
        remaining = obj.original_amount - total_paid
        return float(max(remaining, Decimal('0.00')))

from .models import CreditCard, CreditCardBill, CreditCardTransaction, Installment, Account

class CreditCardSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    account_id = serializers.IntegerField(source='account.id', read_only=True)
    available_limit = serializers.SerializerMethodField()
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = CreditCard
        fields = ['id', 'name', 'closing_day', 'due_day', 'credit_limit', 'available_limit', 'currency', 'account_id', 'account']

    def get_name(self, obj):
        return obj.account.name if obj.account else "Cartão"

    def get_currency(self, obj):
        return obj.account.currency if obj.account else "BRL"

    def get_available_limit(self, obj):
        from decimal import Decimal
        total_used = sum(
            i.amount for bill in obj.bills.filter(is_paid=False) 
            for i in bill.installments.filter(status__in=['pending', 'posted'])
        )
        return float(max(obj.credit_limit - total_used, Decimal('0.00')))

class InstallmentSerializer(serializers.ModelSerializer):
    description = serializers.CharField(source='transaction.description', read_only=True)
    total_installments = serializers.IntegerField(source='transaction.installment_count', read_only=True)
    
    class Meta:
        model = Installment
        fields = '__all__'

class CreditCardBillSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditCardBill
        fields = '__all__'
        
    def get_total_amount(self, obj):
        total = sum(i.amount for i in obj.installments.all())
        return float(total)

class CreditCardTransactionSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = CreditCardTransaction
        fields = '__all__'

from .models import TransactionInbox

class TransactionInboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionInbox
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
            'file': {'required': True},
        }

