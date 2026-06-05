from rest_framework import serializers
from .models import Account, Category, Transaction, Goal, MonthlyBudget, DistributionTemplate, DistributionTemplateItem, Debt, DebtPayment, SplitRule, SplitRuleItem

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
            'user': {'read_only': True},  # Preenchido automaticamente pela view
        }

    def get_pending_restitutions_total(self, obj):
        from .models import DebtItem, Debt
        from django.db.models import Sum
        from decimal import Decimal
        
        # Otimização por agregação única no banco
        total_items = DebtItem.objects.filter(
            origin_subaccount=obj,
            status__in=['PENDING', 'PARTIAL']
        ).aggregate(
            total=Sum('total_amount') - Sum('paid_amount')
        )['total'] or Decimal('0.00')
        
        # Debts ativos (is_mine=False)
        debts = Debt.objects.filter(
            origin_subaccount=obj,
            is_mine=False
        ).prefetch_related('charges', 'payments')
        
        total_debts = Decimal('0.00')
        for debt in debts:
            total_charges = sum(c.amount for c in debt.charges.all())
            total_paid = sum(p.amount for p in debt.payments.all())
            outstanding = (debt.original_amount + total_charges) - total_paid
            if outstanding > 0:
                total_debts += outstanding
                
        return float(total_items + total_debts)

    def get_debtors_summary(self, obj):
        from .models import DebtItem, Debt
        from decimal import Decimal
        
        debtor_map = {}
        
        items = DebtItem.objects.filter(
            origin_subaccount=obj,
            status__in=['PENDING', 'PARTIAL']
        ).select_related('debtor')
        for item in items:
            name = item.debtor.name if item.debtor else "Outro"
            outstanding = item.total_amount - item.paid_amount
            debtor_map[name] = debtor_map.get(name, Decimal('0.00')) + outstanding
            
        debts = Debt.objects.filter(
            origin_subaccount=obj,
            is_mine=False
        ).prefetch_related('charges', 'payments')
        for debt in debts:
            total_charges = sum(c.amount for c in debt.charges.all())
            total_paid = sum(p.amount for p in debt.payments.all())
            outstanding = (debt.original_amount + total_charges) - total_paid
            if outstanding > 0:
                name = debt.counterparty_name
                debtor_map[name] = debtor_map.get(name, Decimal('0.00')) + outstanding
        
        return [
            {"debtor_name": name, "amount": float(amount)}
            for name, amount in debtor_map.items()
        ]

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
        fields = ['id', 'user', 'name', 'parent', 'target_value', 'target_type', 'ceiling_value', 'assigned_amount', 'spent_amount', 'macro_rule', 'macro_allocation', 'currency']
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True},
            'user': {'read_only': True},  # Preenchido automaticamente pela view
        }

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
            'user': {'read_only': True},  # Preenchido automaticamente pela view
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

from .models import DebtCharge

class DebtChargeSerializer(serializers.ModelSerializer):
    account_name = serializers.SerializerMethodField()

    class Meta:
        model = DebtCharge
        fields = ['id', 'debt', 'amount', 'description', 'date', 'account', 'account_name', 'transaction', 'created_at']
        extra_kwargs = {
            'transaction': {'read_only': True},
            'debt': {'required': False},
        }

    def get_account_name(self, obj):
        if obj.account:
            return obj.account.name
        return None

class SplitRuleItemSerializer(serializers.ModelSerializer):
    debtor_name = serializers.CharField(source='debtor.name', read_only=True)

    class Meta:
        model = SplitRuleItem
        fields = ['id', 'debtor', 'debtor_name', 'percentage', 'fixed_amount']

class SplitRuleSerializer(serializers.ModelSerializer):
    items = SplitRuleItemSerializer(many=True, required=False, allow_null=True)

    class Meta:
        model = SplitRule
        fields = ['id', 'name', 'created_at', 'items']
        extra_kwargs = {
            'user': {'read_only': True},
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        split_rule = SplitRule.objects.create(**validated_data)
        for item_data in items_data:
            SplitRuleItem.objects.create(template=split_rule, **item_data)
        return split_rule

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                SplitRuleItem.objects.create(template=instance, **item_data)
        return instance

class DebtSerializer(serializers.ModelSerializer):
    amount_paid = serializers.SerializerMethodField()
    amount_remaining = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    payments = DebtPaymentSerializer(many=True, read_only=True)
    charges = DebtChargeSerializer(many=True, read_only=True)
    origin_subaccount_name = serializers.CharField(source='origin_subaccount.name', read_only=True)
    origin_transaction_description = serializers.CharField(source='origin_transaction.description', read_only=True)
    origin_transaction_amount = serializers.DecimalField(source='origin_transaction.amount', max_digits=12, decimal_places=2, read_only=True)
    origin_category_name = serializers.CharField(source='origin_category.name', read_only=True)
    applied_rule_name = serializers.CharField(source='applied_rule.name', read_only=True)

    class Meta:
        model = Debt
        fields = [
            'id', 'user', 'counterparty_name', 'original_amount', 'currency', 'is_mine', 'notes', 'created_at',
            'amount_paid', 'amount_remaining', 'total_amount', 'payments', 'charges', 'origin_subaccount',
            'origin_subaccount_name', 'origin_transaction', 'origin_category', 'applied_rule', 'reimburses_category',
            'origin_transaction_description', 'origin_transaction_amount', 'origin_category_name', 'applied_rule_name'
        ]
        extra_kwargs = {
            'user': {'read_only': True},
            'origin_subaccount': {'required': False, 'allow_null': True},
            'origin_transaction': {'required': False, 'allow_null': True},
            'origin_category': {'required': False, 'allow_null': True},
            'applied_rule': {'required': False, 'allow_null': True},
        }

    def get_total_amount(self, obj):
        if hasattr(obj, 'annotated_total_amount'):
            return float(obj.annotated_total_amount)
        total_charges = sum(c.amount for c in obj.charges.all())
        return float(obj.original_amount + total_charges)

    def get_amount_paid(self, obj):
        if hasattr(obj, 'annotated_payments_sum'):
            return float(obj.annotated_payments_sum)
        total = sum(p.amount for p in obj.payments.all())
        return float(total)

    def get_amount_remaining(self, obj):
        if hasattr(obj, 'annotated_amount_remaining'):
            return float(obj.annotated_amount_remaining)
        from decimal import Decimal
        total_paid = sum(p.amount for p in obj.payments.all())
        total_charges = sum(c.amount for c in obj.charges.all())
        remaining = (obj.original_amount + total_charges) - total_paid
        return float(max(remaining, Decimal('0.00')))

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
        
        # Agregação direta no banco de dados para evitar loops Python
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

class SimpleSubaccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'name', 'reserved_credit_balance']

class InstallmentSerializer(serializers.ModelSerializer):
    transaction = SimpleCreditCardTransactionSerializer(read_only=True)
    installment_number = serializers.IntegerField(source='number', read_only=True)
    total_installments = serializers.IntegerField(source='transaction.installment_count', read_only=True)
    subaccount = SimpleSubaccountSerializer(read_only=True)
    
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


from .models import Debtor, DebtItem, Asset

class DebtItemSerializer(serializers.ModelSerializer):
    origin_subaccount_name = serializers.CharField(source='origin_subaccount.name', read_only=True)

    class Meta:
        model = DebtItem
        fields = '__all__'


class DebtorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Debtor
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
        }


class AssetSerializer(serializers.ModelSerializer):
    effective_asset_value = serializers.SerializerMethodField()
    linked_debt_name = serializers.CharField(source='linked_debt.counterparty_name', read_only=True)

    class Meta:
        model = Asset
        fields = [
            'id', 'user', 'name', 'purchase_value', 'current_market_value', 
            'liquidity_tier', 'linked_debt', 'linked_debt_name', 
            'effective_asset_value', 'created_at'
        ]
        extra_kwargs = {
            'user': {'read_only': True},
            'linked_debt': {'required': False, 'allow_null': True},
        }

    def get_effective_asset_value(self, obj):
        from decimal import Decimal
        if obj.linked_debt:
            # Pega o remaining amount da divida usando o serializer ou calculando direto
            # Vamos calcular direto para manter performance
            total_charges = sum(c.amount for c in obj.linked_debt.charges.all())
            total_paid = sum(p.amount for p in obj.linked_debt.payments.all())
            remaining = (obj.linked_debt.original_amount + total_charges) - total_paid
            effective = obj.current_market_value - remaining
            return float(max(effective, Decimal('0.00')))
        return float(obj.current_market_value)


