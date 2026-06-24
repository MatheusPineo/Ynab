from rest_framework import serializers
from .models import Account, Category, Transaction, Goal, MonthlyBudget, DistributionTemplate, DistributionTemplateItem

class AccountSerializer(serializers.ModelSerializer):
    available_balance = serializers.ReadOnlyField()
    actual_balance = serializers.ReadOnlyField(source='balance')
    pending_restitutions_total = serializers.SerializerMethodField()
    debtors_summary = serializers.SerializerMethodField()
    bank_logo_url = serializers.ReadOnlyField()

    class Meta:
        model = Account
        fields = '__all__'
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True},
            'user': {'read_only': True},
        }

    def get_pending_restitutions_total(self, obj):
        return 0.00

    def get_debtors_summary(self, obj):
        return []

    def validate(self, attrs):
        parent = attrs.get('parent')
        if self.instance and parent:
            if parent.id == self.instance.id:
                raise serializers.ValidationError({"parent": "Uma conta não pode ser filha de si mesma."})
            
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
        fields = ['id', 'user', 'name', 'parent', 'target_value', 'target_type', 'ceiling_value', 'assigned_amount', 'spent_amount', 'macro_rule', 'macro_allocation', 'currency']
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True},
            'user': {'read_only': True},
        }

    def validate(self, attrs):
        parent = attrs.get('parent')
        if parent is None and self.instance:
            parent = self.instance.parent
            
        currency = attrs.get('currency')
        if currency is None and self.instance:
            currency = self.instance.currency
            
        if parent:
            if parent.currency != currency:
                raise serializers.ValidationError(
                    {"parent": f"O grupo pai possui a moeda '{parent.currency}' que difere da moeda '{currency}' selecionada."}
                )
        return attrs

class TransactionSerializer(serializers.ModelSerializer):
    statement_id = serializers.IntegerField(source='credit_card_bill.id', read_only=True)
    statement_name = serializers.SerializerMethodField()
    credit_card_id = serializers.IntegerField(source='credit_card_bill.credit_card.id', read_only=True)
    account_type = serializers.CharField(source='account.account_type', read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'

    def get_statement_name(self, obj):
        if obj.credit_card_bill:
            return str(obj.credit_card_bill)
        return None

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
        }

class DistributionTemplateItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistributionTemplateItem
        fields = ['id', 'account', 'category', 'percentage', 'fixed_amount']
        extra_kwargs = {
            'account': {'required': False, 'allow_null': True},
            'category': {'required': False, 'allow_null': True},
            'percentage': {'required': False, 'allow_null': True},
            'fixed_amount': {'required': False, 'allow_null': True},
        }

class DistributionTemplateSerializer(serializers.ModelSerializer):
    items = DistributionTemplateItemSerializer(many=True, required=False, allow_empty=True)

    class Meta:
        model = DistributionTemplate
        fields = ['id', 'name', 'is_active', 'is_archived', 'trigger_payee', 'fallback_category', 'created_at', 'items']
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
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.is_archived = validated_data.get('is_archived', instance.is_archived)
        instance.trigger_payee = validated_data.get('trigger_payee', instance.trigger_payee)
        instance.fallback_category = validated_data.get('fallback_category', instance.fallback_category)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                DistributionTemplateItem.objects.create(template=instance, **item_data)

        return instance

from .models import CreditCard, CreditCardBill, CreditCardTransaction, Installment, Account

class CreditCardSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    account_id = serializers.IntegerField(source='account.id', read_only=True)
    available_limit = serializers.SerializerMethodField()
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), required=False, allow_null=True)
    bank_domain = serializers.SerializerMethodField()
    bank_logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditCard
        fields = ['id', 'name', 'closing_day', 'due_day', 'credit_limit', 'available_limit', 'currency', 'account_id', 'account', 'brand', 'country_of_issue', 'settlement_mode', 'revolving_percentage', 'bank_domain', 'bank_logo_url']

    def get_name(self, obj):
        return obj.account.name if obj.account else "Cartão"

    def get_currency(self, obj):
        return obj.account.currency if obj.account else "BRL"

    def get_bank_domain(self, obj):
        return obj.account.bank_domain if obj.account else None

    def get_bank_logo_url(self, obj):
        return obj.account.bank_logo_url if obj.account else None

    def get_available_limit(self, obj):
        from decimal import Decimal
        from django.db.models import Sum
        from .models import Installment
        
        total_used = Installment.objects.filter(
            bill__credit_card=obj,
            bill__is_paid=False,
            status__in=['pending', 'posted']
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        return float(max(obj.credit_limit - total_used, Decimal('0.00')))

class SimpleCreditCardTransactionSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = CreditCardTransaction
        fields = ['id', 'description', 'date', 'original_currency', 'exchange_rate', 'iof_amount', 'category_id']

class InstallmentSerializer(serializers.ModelSerializer):
    transaction = SimpleCreditCardTransactionSerializer(read_only=True)
    installment_number = serializers.IntegerField(source='number', read_only=True)
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
        if hasattr(obj, 'annotated_total_amount'):
            return float(obj.annotated_total_amount)
        total = sum(i.amount for i in obj.installments.all())
        return float(total)

class CreditCardTransactionSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    input_type = serializers.ChoiceField(choices=['TOTAL', 'PARCELA'], write_only=True, required=False, default='TOTAL')
    
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

from .models import InvestmentAsset, InvestmentActivity

class InvestmentAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentAsset
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
        }

class InvestmentActivitySerializer(serializers.ModelSerializer):
    asset_ticker = serializers.CharField(source='asset.ticker', read_only=True)
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    
    class Meta:
        model = InvestmentActivity
        fields = '__all__'

from .models import Asset

class AssetSerializer(serializers.ModelSerializer):
    effective_asset_value = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'id', 'user', 'name', 'purchase_value', 'current_market_value', 
            'liquidity_tier', 'effective_asset_value', 'created_at'
        ]
        extra_kwargs = {
            'user': {'read_only': True},
        }

    def get_effective_asset_value(self, obj):
        return float(obj.current_market_value)


from .models import SplitRule, SplitRuleItem, Debt, DebtPayment

class SplitRuleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SplitRuleItem
        fields = ['id', 'debtor_name', 'percentage', 'fixed_amount']


class SplitRuleSerializer(serializers.ModelSerializer):
    items = SplitRuleItemSerializer(many=True, required=False, allow_empty=True)

    class Meta:
        model = SplitRule
        fields = ['id', 'name', 'created_at', 'items']
        extra_kwargs = {
            'user': {'read_only': True},
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        split_rule = SplitRule.objects.create(**validated_data)
        for item in items_data:
            SplitRuleItem.objects.create(template=split_rule, **item)
        return split_rule

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                SplitRuleItem.objects.create(template=instance, **item)
        return instance


class DebtPaymentSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    class Meta:
        model = DebtPayment
        fields = '__all__'


class DebtSerializer(serializers.ModelSerializer):
    payments = DebtPaymentSerializer(many=True, read_only=True)
    amount_paid = serializers.SerializerMethodField()
    amount_remaining = serializers.SerializerMethodField()
    origin_category_name = serializers.CharField(source='origin_category.name', read_only=True)
    origin_transaction_description = serializers.CharField(source='origin_transaction.description', read_only=True)

    class Meta:
        model = Debt
        fields = [
            'id', 'counterparty_name', 'original_amount', 'currency', 'is_mine', 
            'notes', 'origin_transaction', 'origin_category', 'applied_rule', 
            'created_at', 'payments', 'amount_paid', 'amount_remaining',
            'origin_category_name', 'origin_transaction_description'
        ]
        extra_kwargs = {
            'user': {'read_only': True},
        }

    def get_amount_paid(self, obj):
        return float(sum(p.amount for p in obj.payments.all()))

    def get_amount_remaining(self, obj):
        total_paid = sum(p.amount for p in obj.payments.all())
        return float(max(obj.original_amount - total_paid, 0))