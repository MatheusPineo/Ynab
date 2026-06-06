from datetime import date, timedelta
import calendar
from decimal import Decimal
from django.db import transaction
from .models import CreditCard, CreditCardBill, CreditCardTransaction, Installment, Account, Category, Transaction as CoreTransaction

@transaction.atomic
def process_credit_card_transaction(
    credit_card_id,
    description,
    date_tx,
    total_amount,
    category_id,
    installment_count=1,
    starting_installment=1,
    original_currency='BRL',
    original_amount=None,
    exchange_rate=Decimal('1.0000'),
    iof_amount=Decimal('0.00'),
    input_type='TOTAL'
):
    """
    Processa uma compra no cartão de crédito vinculada diretamente a uma Categoria YNAB.
    Cria a Compra Matriz e divide em parcelas (Installments) sem depender de subcontas.
    """
    credit_card = CreditCard.objects.get(id=credit_card_id)
    
    if credit_card.country_of_issue == 'PT':
        installment_count = 1
        starting_installment = 1
        input_type = 'TOTAL'
        
    val_total = Decimal(str(total_amount))
    val_orig = Decimal(str(original_amount)) if original_amount is not None else val_total
    val_rate = Decimal(str(exchange_rate))
    val_iof = Decimal(str(iof_amount))
    
    if input_type == 'PARCELA':
        base_installment_amount = round(val_total, 2)
        val_total = val_total * installment_count
    else:
        base_installment_amount = round(val_total / installment_count, 2)
        
    remainder = val_total - (base_installment_amount * installment_count)
    
    matrix_tx = CreditCardTransaction.objects.create(
        credit_card=credit_card,
        category_id=category_id,
        description=description,
        date=date_tx,
        total_amount=val_total,
        installment_count=installment_count,
        original_currency=original_currency,
        original_amount=val_orig if input_type != 'PARCELA' else val_orig * installment_count,
        exchange_rate=val_rate,
        iof_amount=val_iof
    )

    current_month = date_tx.month
    current_year = date_tx.year
    
    if date_tx.day >= credit_card.closing_day:
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
            
    installments = []
    today = date.today()
    
    for i in range(starting_installment, installment_count + 1):
        bill_month = current_month
        bill_year = current_year
        
        bill, _ = CreditCardBill.objects.get_or_create(
            credit_card=credit_card,
            month=bill_month,
            year=bill_year
        )
        
        amount_part = base_installment_amount
        if i == starting_installment:
            amount_part += remainder
            
        status_calc = 'posted' if (bill_year < today.year or (bill_year == today.year and bill_month <= today.month)) else 'pending'
            
        inst = Installment.objects.create(
            transaction=matrix_tx,
            bill=bill,
            number=i,
            amount=amount_part,
            status=status_calc
        )
        installments.append(inst)
        
        process_installment_ynab(inst)
            
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
            
    return matrix_tx, installments


def process_installment_ynab(installment):
    """
    Mágica YNAB Pura: Registra a despesa diretamente na conta do cartão com a categoria associada.
    Isso reduz a coluna 'Disponível' da categoria imediatamente no mês projetado da fatura.
    """
    matrix_tx = installment.transaction
    credit_card = matrix_tx.credit_card
    category = matrix_tx.category
    
    try:
        _, last_day_of_bill_month = calendar.monthrange(installment.bill.year, installment.bill.month)
        day_to_use = min(matrix_tx.date.day, last_day_of_bill_month)
        tx_date = date(installment.bill.year, installment.bill.month, day_to_use)
    except Exception:
        tx_date = matrix_tx.date
            
    CoreTransaction.objects.create(
        account=credit_card.account,
        category=category,
        amount=installment.amount,
        description=f"{matrix_tx.description} ({installment.number}/{matrix_tx.installment_count})" if matrix_tx.installment_count > 1 else matrix_tx.description,
        date=tx_date,
        is_income=False,
        status='realized',
        is_applied_to_balance=True,
        credit_card_bill=installment.bill
    )


@transaction.atomic
def pay_bill(bill_id, payment_mode, payload_data=None, payment_account_id=None):
    """
    Quita faturas gerenciando a contabilidade YNAB pura (Sem subcontas e sem travas artificiais).
    """
    try:
        bill = CreditCardBill.objects.get(id=bill_id)
    except CreditCardBill.DoesNotExist:
        raise ValueError("Fatura não encontrada.")

    credit_card = bill.credit_card
    user = credit_card.account.user
    unpaid_installments = bill.installments.filter(status__in=['pending', 'posted']).order_by('transaction__date', 'id')
    total_paid = Decimal('0.00')

    next_month = bill.month + 1
    next_year = bill.year
    if next_month > 12:
        next_month = 1
        next_year += 1
    
    def get_or_create_next_bill():
        next_b, _ = CreditCardBill.objects.get_or_create(
            credit_card=credit_card,
            month=next_month,
            year=next_year
        )
        return next_b

    if payment_mode == 'ITEMIZED':
        if not payload_data or 'installment_ids' not in payload_data:
            raise ValueError("Payload inválido para o modo ITEMIZED: 'installment_ids' é obrigatório.")
        inst_ids = payload_data['installment_ids']
        target_installments = unpaid_installments.filter(id__in=inst_ids)
        
        for inst in target_installments:
            total_paid += inst.amount
            inst.status = 'paid'
            inst.save()

    elif payment_mode == 'FIFO':
        if not payload_data or 'amount' not in payload_data:
            raise ValueError("Payload inválido para o modo FIFO: 'amount' é obrigatório.")
        pool = Decimal(str(payload_data['amount']))
        if pool <= 0:
            raise ValueError("O valor de pagamento no modo FIFO deve ser maior que zero.")

        for inst in unpaid_installments:
            if pool <= 0:
                break
            
            matrix_tx = inst.transaction
            if pool >= inst.amount:
                amt_to_pay = inst.amount
                pool -= amt_to_pay
                total_paid += amt_to_pay
                inst.status = 'paid'
                inst.save()
            else:
                amt_to_pay = pool
                remaining_amt = inst.amount - amt_to_pay
                pool = Decimal('0.00')
                total_paid += amt_to_pay
                
                next_bill = get_or_create_next_bill()
                matrix_tx.installment_count += 1
                matrix_tx.save()
                
                Installment.objects.create(
                    transaction=matrix_tx,
                    bill=next_bill,
                    number=matrix_tx.installment_count,
                    amount=remaining_amt,
                    status='pending'
                )
                
                tx_cc = CoreTransaction.objects.filter(
                    account=credit_card.account,
                    credit_card_bill=bill,
                    category=matrix_tx.category,
                    amount=inst.amount
                ).first()
                
                if tx_cc:
                    tx_cc.amount = amt_to_pay
                    tx_cc.save()
                    
                    try:
                        _, last_day_of_next_bill = calendar.monthrange(next_bill.year, next_bill.month)
                        day_to_use = min(matrix_tx.date.day, last_day_of_next_bill)
                        next_tx_date = date(next_bill.year, next_bill.month, day_to_use)
                    except Exception:
                        next_tx_date = matrix_tx.date

                    CoreTransaction.objects.create(
                        account=credit_card.account,
                        category=matrix_tx.category,
                        amount=remaining_amt,
                        description=tx_cc.description,
                        date=next_tx_date,
                        is_income=False,
                        status='realized',
                        is_applied_to_balance=True,
                        credit_card_bill=next_bill
                    )
                
                inst.amount = amt_to_pay
                inst.status = 'paid'
                inst.save()

    elif payment_mode == 'PERCENTAGE':
        if not payload_data or 'percentage' not in payload_data:
            raise ValueError("Payload inválido para o modo PERCENTAGE: 'percentage' é obrigatório.")
        factor = Decimal(str(payload_data['percentage']))
        if factor <= 0 or factor > 1:
            raise ValueError("O fator de porcentagem deve ser maior que 0 e menor ou igual a 1.")

        next_bill = get_or_create_next_bill()
        for inst in unpaid_installments:
            matrix_tx = inst.transaction
            slice_amount = round(inst.amount * factor, 2)
            remaining_amount = inst.amount - slice_amount
            total_paid += slice_amount
            
            if remaining_amount > 0:
                matrix_tx.installment_count += 1
                matrix_tx.save()
                
                Installment.objects.create(
                    transaction=matrix_tx,
                    bill=next_bill,
                    number=matrix_tx.installment_count,
                    amount=remaining_amount,
                    status='pending'
                )
                
                tx_cc = CoreTransaction.objects.filter(
                    account=credit_card.account,
                    credit_card_bill=bill,
                    category=matrix_tx.category,
                    amount=inst.amount
                ).first()
                
                if tx_cc:
                    tx_cc.amount = slice_amount
                    tx_cc.save()
                    
                    try:
                        _, last_day_of_next_bill = calendar.monthrange(next_bill.year, next_bill.month)
                        day_to_use = min(matrix_tx.date.day, last_day_of_next_bill)
                        next_tx_date = date(next_bill.year, next_bill.month, day_to_use)
                    except Exception:
                        next_tx_date = matrix_tx.date

                    CoreTransaction.objects.create(
                        account=credit_card.account,
                        category=matrix_tx.category,
                        amount=remaining_amount,
                        description=tx_cc.description,
                        date=next_tx_date,
                        is_income=False,
                        status='realized',
                        is_applied_to_balance=True,
                        credit_card_bill=next_bill
                    )
                    
            inst.amount = slice_amount
            inst.status = 'paid'
            inst.save()

    if payment_account_id and total_paid > 0:
        payment_account = Account.objects.get(id=payment_account_id, user=user)
        
        CoreTransaction.objects.create(
            account=payment_account,
            amount=total_paid,
            description=f"Pagamento de Fatura: {credit_card.account.name}",
            date=date.today(),
            is_income=False,
            status='realized',
            is_applied_to_balance=True
        )
        
        CoreTransaction.objects.create(
            account=credit_card.account,
            amount=total_paid,
            description=f"Pagamento da Fatura",
            date=date.today(),
            is_income=True,
            status='realized',
            is_applied_to_balance=True,
            credit_card_bill=bill
        )

    if not bill.installments.filter(status__in=['pending', 'posted']).exists():
        bill.is_closed = True
        bill.is_paid = True
        bill.save()

    return total_paid


class YNABBudgetService:
    @staticmethod
    def convert_currency(amount, from_currency, to_currency):
        if not from_currency: from_currency = 'EUR'
        if not to_currency: to_currency = 'EUR'
        from_currency, to_currency = from_currency.upper(), to_currency.upper()
        if from_currency == to_currency: return amount
        rates = {'EUR': Decimal('1.0000'), 'BRL': Decimal('6.0000'), 'USD': Decimal('1.0800')}
        return (Decimal(str(amount)) / rates.get(from_currency, Decimal('1.0000'))) * rates.get(to_currency, Decimal('1.0000'))

    @staticmethod
    def calculate_envelope_states(user, target_month, target_year):
        from .models import Category, MonthlyBudget, Transaction
        from collections import defaultdict

        categories = Category.objects.filter(user=user)
        leaf_categories = [c for c in categories if c.parent_id is not None] or list(categories)

        first_tx = Transaction.objects.filter(account__user=user).order_by('date').first()
        first_budget = MonthlyBudget.objects.filter(category__user=user).order_by('year', 'month').first()
        start_month, start_year = target_month, target_year

        if first_tx or first_budget:
            tx_year = first_tx.date.year if first_tx else 9999
            tx_month = first_tx.date.month if first_tx else 12
            b_year = first_budget.year if first_budget else 9999
            b_month = first_budget.month if first_budget else 12
            if (tx_year, tx_month) < (b_year, b_month): start_year, start_month = tx_year, tx_month
            else: start_year, start_month = b_year, b_month

        if (start_year, start_month) > (target_year, target_month): start_year, start_month = target_year, target_month

        months_sequence = []
        cur_year, cur_month = start_year, start_month
        while (cur_year, cur_month) <= (target_year, target_month):
            months_sequence.append((cur_year, cur_month))
            cur_month += 1
            if cur_month > 12: cur_month, cur_year = 1, cur_year + 1

        available_by_cat, rta_by_month = {}, {}
        prev_rta, prev_month_cash_overspent = Decimal('0.00'), Decimal('0.00')

        start_date_seq = date(months_sequence[0][0], months_sequence[0][1], 1) if months_sequence else date(target_year, target_month, 1)
        end_date_seq = date(months_sequence[-1][0], months_sequence[-1][1], calendar.monthrange(months_sequence[-1][0], months_sequence[-1][1])[1]) if months_sequence else date(target_year, target_month, calendar.monthrange(target_year, target_month)[1])

        all_income_txs = Transaction.objects.filter(account__user=user, account__exclude_from_totals=False, date__range=(start_date_seq, end_date_seq), is_income=True, category__isnull=True).exclude(account__account_type='investment').values('date', 'amount', 'account__currency')
        all_budgets = MonthlyBudget.objects.filter(category__user=user, year__range=(months_sequence[0][0] if months_sequence else target_year, months_sequence[-1][0] if months_sequence else target_year)).values('category_id', 'month', 'year', 'amount')
        all_expense_txs = Transaction.objects.filter(account__user=user, account__exclude_from_totals=False, date__range=(start_date_seq, end_date_seq), category__isnull=False, is_applied_to_balance=True).exclude(account__account_type='investment').values('date', 'category_id', 'is_income', 'amount', 'account__account_type', 'account__currency')

        income_by_month = defaultdict(Decimal)
        for tx in all_income_txs:
            income_by_month[(tx['date'].year, tx['date'].month)] += YNABBudgetService.convert_currency(tx['amount'], tx['account__currency'] or 'EUR', 'EUR')

        budgets_by_month = defaultdict(dict)
        for b in all_budgets: budgets_by_month[(b['year'], b['month'])][b['category_id']] = b['amount']

        expense_by_month = defaultdict(list)
        for tx in all_expense_txs: expense_by_month[(tx['date'].year, tx['date'].month)].append(tx)

        for (y, m) in months_sequence:
            monthly_income = income_by_month[(y, m)]
            budget_map = budgets_by_month[(y, m)]
            monthly_budgeted = sum(budget_map.values())

            rta = prev_rta + monthly_income - monthly_budgeted - prev_month_cash_overspent
            rta_by_month[(y, m)] = rta
            available_by_cat[(y, m)] = {}

            txs = expense_by_month[(y, m)]
            activity_map, credit_spent_map = defaultdict(Decimal), defaultdict(Decimal)

            for tx in txs:
                converted_amount = YNABBudgetService.convert_currency(tx['amount'], tx['account__currency'] or 'EUR', 'EUR')
                cat_id = tx['category_id']
                if not tx['is_income']:
                    activity_map[cat_id] -= converted_amount
                    if tx['account__account_type'] == 'credit_card': credit_spent_map[cat_id] += converted_amount
                else: activity_map[cat_id] += converted_amount

            prev_month_state = available_by_cat.get((y if m > 1 else y - 1, m - 1 if m > 1 else 12), {})
            monthly_total_cash_overspending = Decimal('0.00')

            for cat in leaf_categories:
                cat_id = cat.id
                assigned = budget_map.get(cat_id, Decimal('0.00'))
                activity = activity_map.get(cat_id, Decimal('0.00'))
                rollover = prev_month_state.get(cat_id, Decimal('0.00')) if prev_month_state.get(cat_id, Decimal('0.00')) > Decimal('0.00') else Decimal('0.00')

                available = rollover + assigned + activity
                available_by_cat[(y, m)][cat_id] = available

                if available < Decimal('0.00'):
                    credit_overspent = min(-available, credit_spent_map.get(cat_id, Decimal('0.00')))
                    monthly_total_cash_overspending += (-available - credit_overspent)

            prev_rta, prev_month_cash_overspent = rta, monthly_total_cash_overspending

        target_key = (target_year, target_month)
        rta_target = rta_by_month.get(target_key, Decimal('0.00'))
        budget_map_target = {b.category_id: b.amount for b in MonthlyBudget.objects.filter(category__user=user, month=target_month, year=target_year)}

        activity_target, credit_spent_target = defaultdict(Decimal), defaultdict(Decimal)
        for tx in Transaction.objects.filter(account__user=user, account__exclude_from_totals=False, date__month=target_month, date__year=target_year, category__isnull=False, is_applied_to_balance=True).exclude(account__account_type='investment').select_related('account'):
            converted_amount = YNABBudgetService.convert_currency(tx.amount, tx.account.currency or 'EUR', 'EUR')
            if not tx.is_income:
                activity_target[tx.category_id] -= converted_amount
                if tx.account.account_type == 'credit_card': credit_spent_target[tx.category_id] += converted_amount
            else: activity_target[tx.category_id] += converted_amount

        prev_month_state = available_by_cat.get((target_year if target_month > 1 else target_year - 1, target_month - 1 if target_month > 1 else 12), {})
        envelope_states = {}
        for cat in leaf_categories:
            cat_id = cat.id
            available = available_by_cat.get(target_key, {}).get(cat_id, Decimal('0.00'))
            overspending_type = None
            if available < Decimal('0.00'):
                credit_overspent = min(-available, credit_spent_target.get(cat_id, Decimal('0.00')))
                if credit_overspent > Decimal('0.00' ) and credit_overspent == -available: overspending_type = 'credit'
                elif credit_overspent > Decimal('0.00'): overspending_type = 'split'
                else: overspending_type = 'cash'

            envelope_states[cat_id] = {
                'assigned': budget_map_target.get(cat_id, Decimal('0.00')),
                'spent': activity_target.get(cat_id, Decimal('0.00')),
                'rollover': prev_month_state.get(cat_id, Decimal('0.00')) if prev_month_state.get(cat_id, Decimal('0.00')) > Decimal('0.00') else Decimal('0.00'),
                'available': available,
                'overspending_type': overspending_type
            }

        return {'ready_to_assign': rta_target, 'envelope_states': envelope_states}


class YNABGoalService:
    @staticmethod
    def calculate_underfunded(category, month, year, available_balance, assigned_amount, goal=None):
        if goal is None:
            from .models import CategoryGoal
            goal = CategoryGoal.objects.filter(category=category).first()
        if not goal: return Decimal('0.00')

        goal_amount, available_balance, assigned_amount = Decimal(str(goal.amount)), Decimal(str(available_balance)), Decimal(str(assigned_amount))

        if goal.goal_type == 'target_builder':
            return max(Decimal('0.00'), goal_amount - assigned_amount)
        elif goal.goal_type == 'needed_spending_date':
            if not goal.target_date: return max(Decimal('0.00'), goal_amount - assigned_amount)
            divisor = max(1, (goal.target_date.year - year) * 12 + (goal.target_date.month - month) + 1) if (year, month) <= (goal.target_date.year, goal.target_date.month) else 1
            necessidade_restante = goal_amount - available_balance
            if necessidade_restante <= Decimal('0.00'): return Decimal('0.00')
            return max(Decimal('0.00'), round(necessidade_restante / Decimal(str(divisor)), 2) - assigned_amount)
        elif goal.goal_type == 'needed_spending_freq':
            if goal.frequency == 'weekly':
                occurrences = sum(1 for d in calendar.Calendar().itermonthdays2(year, month) if d[0] > 0 and d[1] == (goal.created_at.weekday() if goal.created_at else 0))
                return max(Decimal('0.00'), (goal_amount * Decimal(str(occurrences))) - assigned_amount)
            return max(Decimal('0.00'), goal_amount - assigned_amount)
        return Decimal('0.00')


class TransactionRulesService:
    @staticmethod
    def apply_rules(transaction):
        from .models import TransactionRule
        if not hasattr(transaction, 'account') or not transaction.account or not transaction.account.user: return transaction
        rules = TransactionRule.objects.filter(user=transaction.account.user, is_active=True, stage='pre').order_by('created_at')

        for rule in rules:
            conditions = rule.conditions
            if not conditions: continue
            results = []
            for cond in conditions:
                field, op, val = cond.get('field'), cond.get('op'), cond.get('value')
                actual_val = getattr(transaction, field, "") if field != 'payee' else (transaction.payee.name if transaction.payee else "")
                cond_res = False
                if op == 'is': cond_res = (str(actual_val).lower() == str(val).lower()) if isinstance(actual_val, str) else (actual_val == val)
                elif op == 'contains': cond_res = (str(val).lower() in str(actual_val).lower())
                elif op == 'is_empty': cond_res = (not actual_val)
                results.append(cond_res)

            if all(results) if rule.conditions_op == 'and' else any(results):
                for action in rule.actions:
                    act_op, act_field, act_val = action.get('op'), action.get('field'), action.get('value')
                    if act_op == 'set': setattr(transaction, act_field, act_val)
        return transaction

    @staticmethod
    def process_payee_rules_from_description(user, raw_description):
        from .models import Transaction as CoreTx, Account
        dummy_acc = Account.objects.filter(user=user).first()
        if not dummy_acc: return None, None
        tx = TransactionRulesService.apply_rules(CoreTx(account=dummy_acc, description=raw_description, amount=Decimal('0.00'), date=date.today()))
        return tx.payee_id, tx.category_id


class NetWorthCalculator:
    @staticmethod
    def calculate_holdings(user):
        from .models import InvestmentAsset
        assets = InvestmentAsset.objects.filter(user=user).prefetch_related('activities')
        holdings = []
        for asset in assets:
            total_quantity, total_cost_basis, gross_value = Decimal('0.00000000'), Decimal('0.00'), Decimal('0.00')
            for act in asset.activities.all().order_by('date', 'created_at'):
                qty, price, fees = act.quantity or Decimal('0.00000000'), act.unit_price or Decimal('0.00'), act.fees or Decimal('0.00')
                val = act.principal_amount or (qty * price)
                if act.activity_type in ['BUY', 'YIELD']:
                    gross_value += val
                    if act.activity_type == 'BUY': total_quantity, total_cost_basis = total_quantity + qty, total_cost_basis + val + fees
                elif act.activity_type == 'SELL':
                    gross_value, total_quantity = gross_value - val, total_quantity - qty
                    total_cost_basis -= qty * (total_cost_basis / (total_quantity + qty)) if total_quantity + qty > Decimal('0.00000000') else Decimal('0.00')
                elif act.activity_type == 'SPLIT': total_quantity *= qty

            if total_quantity <= Decimal('0.00000001'): total_quantity, average_cost, current_price = Decimal('0.00000000'), Decimal('0.00'), Decimal('0.00')
            else: average_cost, current_price = total_cost_basis / total_quantity, gross_value / total_quantity

            percentage_yield = ( (gross_value - total_cost_basis) / total_cost_basis) * Decimal('100.0') if total_cost_basis > Decimal('0.00') else Decimal('0.00')
            holdings.append({
                'asset_id': asset.id, 'ticker': asset.ticker, 'name': asset.name, 'currency': asset.currency, 'asset_type': asset.asset_type,
                'macro_category': asset.macro_category, 'quantity': total_quantity, 'average_cost': round(average_cost, 4), 'total_cost_basis': round(total_cost_basis, 2),
                'current_price': round(current_price, 4), 'indexer': asset.indexer, 'rate_type': asset.rate_type, 'interest_rate': Decimal('0.00'),
                'gross_value': round(gross_value, 2), 'ir_amount': Decimal('0.00'), 'iof_amount': Decimal('0.00'), 'net_value': round(gross_value, 2),
                'total_profit_loss': round(gross_value - total_cost_basis, 2), 'percentage_yield': round(percentage_yield, 2),
            })
        return holdings


import logging
import requests
from django.conf import settings
from .models import DailyAssetPrice

logger = logging.getLogger(__name__)

class MarketDataService:
    @staticmethod
    def get_cdi_rate() -> Decimal | None:
        from .models import DailyCDIRate
        today = date.today()
        cached = DailyCDIRate.objects.filter(date=today).first()
        if cached: return cached.annual_rate
        try:
            response = requests.get('https://api.hgbrasil.com/finance/taxes', params={'key': getattr(settings, 'HG_BRASIL_API_KEY', '')}, timeout=4)
            data = response.json()
            if 'results' in data and data['results'] and 'cdi' in data['results'][0]:
                cdi_annual = Decimal(str(data['results'][0]['cdi']))
                DailyCDIRate.objects.update_or_create(date=today, defaults={'annual_rate': cdi_annual})
                return cdi_annual
        except Exception as e: logger.warning(f"HG Brasil CDI fetch failed: {e}")
        latest = DailyCDIRate.objects.order_by('-date').first()
        return latest.annual_rate if latest else None

    @staticmethod
    def get_asset_price(ticker: str, is_brazilian: bool = False) -> Decimal | None:
        if is_brazilian:
            try:
                response = requests.get('https://www.alphavantage.co/query', params={'function': 'GLOBAL_QUOTE', 'symbol': f"{ticker}.SA" if not ticker.endswith('.SA') else ticker, 'apikey': getattr(settings, 'ALPHA_VANTAGE_API_KEY', '')}, timeout=4)
                data = response.json()
                if 'Global Quote' in data and '05. price' in data['Global Quote']: return Decimal(str(data['Global Quote']['05. price']))
            except Exception: pass
            try:
                response = requests.get('https://api.hgbrasil.com/finance/stock_price', params={'key': getattr(settings, 'HG_BRASIL_API_KEY', ''), 'symbol': ticker.replace('.SA', '')}, timeout=4)
                data = response.json()
                if 'results' in data and ticker.replace('.SA', '').upper() in data['results']: return Decimal(str(data['results'][ticker.replace('.SA', '').upper()]['price']))
            except Exception: pass
        else:
            try:
                response = requests.get('https://www.alphavantage.co/query', params={'function': 'GLOBAL_QUOTE', 'symbol': ticker, 'apikey': getattr(settings, 'ALPHA_VANTAGE_API_KEY', '')}, timeout=4)
                data = response.json()
                if 'Global Quote' in data and '05. price' in data['Global Quote']: return Decimal(str(data['Global Quote']['05. price']))
            except Exception: pass
            try:
                response = requests.get('https://api.twelvedata.com/price', params={'symbol': ticker, 'apikey': getattr(settings, 'TWELVE_DATA_API_KEY', '')}, timeout=4)
                data = response.json()
                if 'price' in data: return Decimal(str(data['price']))
            except Exception: pass
        last_price = DailyAssetPrice.objects.filter(asset__ticker=ticker).order_by('-date').first()
        return last_price.price if last_price else None


from .models import DailyCDIRate, InvestmentActivity, InvestmentAsset

class PortfolioEvolutionEngine:
    @staticmethod
    def calculate_fixed_income_evolution(activity_id: int, target_date: date) -> Decimal:
        activity = InvestmentActivity.objects.get(id=activity_id)
        principal = activity.principal_amount or ((activity.quantity or Decimal('0.00')) * (activity.unit_price or Decimal('0.00')) + (activity.fees or Decimal('0.00')))
        if principal <= Decimal('0.00'): return Decimal('0.00')
        cdi_rates = DailyCDIRate.objects.filter(date__gte=activity.date, date__lte=target_date).order_by('date')
        current_amount = principal
        cdi_multiplier = (activity.cdi_percentage or Decimal('100.00')) / Decimal('100.0')
        for rate in cdi_rates:
            if rate.daily_rate is not None: current_amount *= (Decimal('1.0') + (rate.daily_rate * cdi_multiplier))
        return current_amount

    @staticmethod
    def calculate_stock_position(asset_id: int) -> dict:
        asset = InvestmentAsset.objects.get(id=asset_id)
        total_quantity, total_cost_basis = Decimal('0.00000000'), Decimal('0.00')
        for act in asset.activities.all().order_by('date', 'created_at'):
            qty, price, fees = act.quantity or Decimal('0.00'), act.unit_price or Decimal('0.00'), act.fees or Decimal('0.00')
            if act.activity_type == 'BUY': total_quantity, total_cost_basis = total_quantity + qty, total_cost_basis + (qty * price) + fees
            elif act.activity_type == 'SELL':
                if total_quantity > Decimal('0.00000000'): total_cost_basis -= qty * (total_cost_basis / total_quantity)
                total_quantity -= qty
            elif act.activity_type == 'SPLIT': total_quantity *= qty

        if total_quantity <= Decimal('0.00000001'): total_quantity, average_cost = Decimal('0.00000000'), Decimal('0.00')
        else: average_cost = total_cost_basis / total_quantity

        current_price_value = MarketDataService.get_asset_price(asset.ticker, is_brazilian=(asset.currency == 'BRL')) or Decimal('0.00')
        net_value = total_quantity * current_price_value
        percentage_yield = ((net_value - total_cost_basis) / total_cost_basis) * Decimal('100.0') if total_cost_basis > Decimal('0.00') else Decimal('0.00')

        return {
            'asset_id': asset.id, 'ticker': asset.ticker, 'quantity': total_quantity, 'average_cost': round(average_cost, 4),
            'total_cost_basis': round(total_cost_basis, 2), 'current_price': current_price_value, 'net_value': round(net_value, 2),
            'total_profit_loss': round(net_value - total_cost_basis, 2), 'percentage_yield': round(percentage_yield, 2),
        }


class CreditCardManagementService:
    @staticmethod
    def manage_installment(installment, mode, action, new_data=None):
        with transaction.atomic():
            matrix_tx = installment.transaction
            user = matrix_tx.credit_card.account.user
            credit_card = matrix_tx.credit_card
            
            installments_to_affect = []
            if mode == 'single': installments_to_affect = [installment]
            elif mode == 'future': installments_to_affect = list(matrix_tx.installments.filter(number__gte=installment.number).order_by('number'))
            elif mode == 'all': installments_to_affect = list(matrix_tx.installments.all().order_by('number'))
                
            if action == 'delete':
                for inst in installments_to_affect:
                    CoreTransaction.objects.filter(account=credit_card.account, credit_card_bill=inst.bill, category=matrix_tx.category, description__startswith=matrix_tx.description).delete()
                    matrix_tx.total_amount -= inst.amount
                    matrix_tx.installment_count -= 1
                    inst.delete()
                if matrix_tx.installment_count <= 0: matrix_tx.delete()
                else: matrix_tx.save()
                    
            elif action == 'edit':
                new_amount = Decimal(str(new_data.get('amount'))) if new_data and 'amount' in new_data else None
                new_description = new_data.get('description') if new_data else None
                old_desc = matrix_tx.description
                
                for inst in installments_to_affect:
                    if new_amount is not None:
                        matrix_tx.total_amount += (new_amount - inst.amount)
                        inst.amount = new_amount
                    inst.save()
                    
                    if new_amount is not None:
                        for t in CoreTransaction.objects.filter(account=credit_card.account, credit_card_bill=inst.bill, category=matrix_tx.category, description__startswith=old_desc):
                            t.amount = new_amount
                            t.save()
                    
                if new_description is not None:
                    matrix_tx.description = new_description
                    for inst in installments_to_affect:
                        new_parcela_desc = f"{new_description} ({inst.number}/{matrix_tx.installment_count})" if matrix_tx.installment_count > 1 else new_description
                        for t in CoreTransaction.objects.filter(account=credit_card.account, credit_card_bill=inst.bill, category=matrix_tx.category, description__startswith=old_desc):
                            t.description = new_parcela_desc
                            t.save()
                matrix_tx.save()
                
                for inst in installments_to_affect:
                    YNABBudgetService.calculate_envelope_states(user, inst.bill.month, inst.bill.year)


class BudgetAutomationService:
    @staticmethod
    @transaction.atomic
    def smart_allocate(user, amount, mode, month=None, year=None, savings_category_id=None):
        from .models import Category, MonthlyBudget
        m, y = month or date.today().month, year or date.today().year
        pool = Decimal(str(amount))
        if pool <= Decimal('0.00'): return {'allocated': {}, 'remainder': Decimal('0.00'), 'total_allocated': Decimal('0.00')}
        cats = Category.objects.filter(user=user, parent__isnull=False, target_value__gt=Decimal('0.00'))
        allocated = {}

        if mode == 'RECURRING_TARGETS':
            for cat in cats:
                if pool <= Decimal('0.00'): break
                target = cat.target_value if cat.target_type == 'FIXED' else round(pool * cat.target_value / Decimal('100.00'), 2)
                mb, _ = MonthlyBudget.objects.get_or_create(category=cat, month=m, year=y, defaults={'amount': Decimal('0.00')})
                fill = min(max(Decimal('0.00'), target - mb.amount), pool) if cat.target_type == 'FIXED' else min(target, pool)
                if fill > Decimal('0.00'):
                    mb.amount += fill
                    mb.save()
                    pool -= fill
                    allocated[cat.id] = {'name': cat.name, 'amount': fill}
        elif mode == 'EXTRA_PROPORTIONAL':
            total_target = sum(c.target_value for c in cats if c.target_type == 'FIXED') + sum(pool * c.target_value / Decimal('100.00') for c in cats if c.target_type == 'PERCENTAGE')
            if total_target > Decimal('0.00'):
                for cat in cats:
                    if pool <= Decimal('0.00'): break
                    share = min(round(Decimal(str(amount)) * ((cat.target_value if cat.target_type == 'FIXED' else round(pool * cat.target_value / Decimal('100.00'), 2)) / total_target), 2), pool)
                    if share > Decimal('0.00'):
                        mb, _ = MonthlyBudget.objects.get_or_create(category=cat, month=m, year=y, defaults={'amount': Decimal('0.00')})
                        mb.amount += share
                        mb.save()
                        pool -= share
                        allocated[cat.id] = {'name': cat.name, 'amount': share}
        elif mode == 'EXTRA_SAVINGS':
            if not savings_category_id: raise ValueError("savings_category_id é obrigatório para o modo EXTRA_SAVINGS.")
            cat = Category.objects.get(id=savings_category_id, user=user)
            mb, _ = MonthlyBudget.objects.get_or_create(category=cat, month=m, year=y, defaults={'amount': Decimal('0.00')})
            mb.amount += pool
            mb.save()
            allocated[cat.id], pool = {'name': cat.name, 'amount': pool}, Decimal('0.00')

        return {'allocated': allocated, 'remainder': pool, 'total_allocated': Decimal(str(amount)) - pool}


class BudgetRebalancingService:
    @staticmethod
    @transaction.atomic
    def auto_shield(user, month, year):
        from .models import Category, MonthlyBudget
        envelopes = YNABBudgetService.calculate_envelope_states(user, month, year)['envelope_states']
        cats = {c.id: c for c in Category.objects.filter(user=user, parent__isnull=False)}
        deficit_cats, donor_cats = {}, {}

        for cat_id, env in envelopes.items():
            cat = cats.get(cat_id)
            if not cat: continue
            if env['available'] < Decimal('0.00'): deficit_cats[cat_id] = -env['available']
            elif env['available'] > cat.target_value and cat.target_value > Decimal('0.00'): donor_cats[cat_id] = env['available'] - cat.target_value

        total_deficit, total_donor_pool = sum(deficit_cats.values()), sum(donor_cats.values())
        if total_deficit <= Decimal('0.00') or total_donor_pool <= Decimal('0.00'): return {'donors': {}, 'recipients': {}, 'total_moved': Decimal('0.00'), 'uncovered_deficit': total_deficit}

        coverable = min(total_deficit, total_donor_pool)
        donors_log, recipients_log = {}, {}

        for cat_id, excess in donor_cats.items():
            pull = min(round(coverable * (excess / total_donor_pool), 2), excess)
            if pull > Decimal('0.00'):
                mb, _ = MonthlyBudget.objects.get_or_create(category_id=cat_id, month=month, year=year, defaults={'amount': Decimal('0.00')})
                mb.amount -= pull
                mb.save()
                donors_log[cat_id] = {'name': cats[cat_id].name, 'pulled': pull}

        for cat_id, deficit in deficit_cats.items():
            push = round(coverable * (deficit / total_deficit), 2)
            if push > Decimal('0.00'):
                mb, _ = MonthlyBudget.objects.get_or_create(category_id=cat_id, month=month, year=year, defaults={'amount': Decimal('0.00')})
                mb.amount += push
                mb.save()
                recipients_log[cat_id] = {'name': cats[cat_id].name, 'received': push}

        return {'donors': donors_log, 'recipients': recipients_log, 'total_moved': coverable, 'uncovered_deficit': max(Decimal('0.00'), total_deficit - coverable)}

    @staticmethod
    @transaction.atomic
    def surplus_sweep(user, month, year):
        from .models import Category, MonthlyBudget
        envelopes = YNABBudgetService.calculate_envelope_states(user, month, year)['envelope_states']
        cats = {c.id: c for c in Category.objects.filter(user=user, parent__isnull=False, ceiling_value__gt=Decimal('0.00'))}
        swept, total_swept = {}, Decimal('0.00')

        for cat_id, cat in cats.items():
            env = envelopes.get(cat_id)
            if env and env['available'] > cat.ceiling_value:
                mb = MonthlyBudget.objects.filter(category_id=cat_id, month=month, year=year).first()
                if mb and mb.amount > Decimal('0.00'):
                    reduction = min(env['available'] - cat.ceiling_value, mb.amount)
                    mb.amount -= reduction
                    mb.save()
                    swept[cat_id] = {'name': cat.name, 'excess_removed': reduction}
                    total_swept += reduction
        return {'swept_categories': swept, 'total_returned_to_rta': total_swept}

    @staticmethod
    @transaction.atomic
    def month_end_cascade(user, current_month, current_year, target_category_id):
        from .models import Category, MonthlyBudget
        envelopes = YNABBudgetService.calculate_envelope_states(user, current_month, current_year)['envelope_states']
        volatile_cats = Category.objects.filter(user=user, parent__isnull=False, ceiling_value__gt=Decimal('0.00')).exclude(id=target_category_id)
        drained, total_flushed = {}, Decimal('0.00')

        for cat in volatile_cats:
            env = envelopes.get(cat.id)
            if env and env['available'] > Decimal('0.00'):
                mb = MonthlyBudget.objects.filter(category=cat, month=current_month, year=current_year).first()
                if mb:
                    drain = min(env['available'], mb.amount)
                    if drain > Decimal('0.00'):
                        mb.amount -= drain
                        mb.save()
                        drained[cat.id] = {'name': cat.name, 'flushed': drain}
                        total_flushed += drain

        if total_flushed > Decimal('0.00'):
            target_mb, _ = MonthlyBudget.objects.get_or_create(category_id=target_category_id, month=current_month, year=current_year, defaults={'amount': Decimal('0.00')})
            target_mb.amount += total_flushed
            target_mb.save()

        target_cat = Category.objects.filter(id=target_category_id).first()
        return {'drained_categories': drained, 'target_category': target_cat.name if target_cat else str(target_category_id), 'total_transferred': total_flushed}


class DebtorPaymentService:
    @staticmethod
    @transaction.atomic
    def pay_subaccount_group(debtor_id, subaccount_id, payment_amount):
        from .models import Debtor, DebtItem, Account, Debt, DebtPayment
        from django.utils import timezone
        from django.db.models import Q

        debtor = Debtor.objects.get(pk=debtor_id)
        subaccount = Account.objects.get(pk=subaccount_id)
        payment_amount_dec = Decimal(str(payment_amount))

        payment_tx = CoreTransaction.objects.create(account=subaccount, amount=payment_amount_dec, is_income=True, description=f"Pagamento de dívida - {debtor.name}", date=timezone.now().date(), status='realized')
        debt = Debt.objects.filter(user=debtor.user, counterparty_name__iexact=debtor.name, is_mine=False).first() or Debt.objects.filter(user=debtor.user, is_mine=False).filter(Q(counterparty_name__icontains=debtor.name)).first()

        if debt: DebtPayment.objects.create(debt=debt, amount=payment_amount_dec, date=timezone.now().date(), account=subaccount, transaction=payment_tx)

        items = DebtItem.objects.filter(debtor_id=debtor_id, origin_subaccount_id=subaccount_id, status__in=['PENDING', 'PARTIAL']).order_by('date_created', 'id')
        remaining = payment_amount_dec
        for item in items:
            if remaining <= Decimal('0.00'): break
            due = item.total_amount - item.paid_amount
            if remaining >= due:
                item.paid_amount, item.status, remaining = item.total_amount, 'SETTLED', remaining - due
            else:
                item.paid_amount, item.status, remaining = item.paid_amount + remaining, 'PARTIAL', Decimal('0.00')
            item.save()
        return {'status': 'success', 'remaining_unallocated': remaining}


class DebtorCreationService:
    @staticmethod
    @transaction.atomic
    def register_itemized_debts(debtor_id, subaccount_id, items_payload):
        from .models import Debtor, DebtItem, Account
        debtor = Debtor.objects.get(pk=debtor_id)
        subaccount = Account.objects.get(pk=subaccount_id)
        created_items = []
        for item in items_payload:
            debt_item = DebtItem.objects.create(debtor=debtor, origin_subaccount=subaccount, product_name=item.get('product_name'), total_amount=Decimal(str(item.get('total_amount'))), paid_amount=Decimal('0.00'), status='PENDING')
            created_items.append(debt_item)
        return created_items


class DebtItemMutationService:
    @staticmethod
    @transaction.atomic
    def update_debt_item(debt_item_id, origin_subaccount_id=None, total_amount=None):
        from .models import DebtItem, Account
        item = DebtItem.objects.select_for_update().get(pk=debt_item_id)
        old_subaccount, old_total_amount = item.origin_subaccount, item.total_amount
        new_subaccount = Account.objects.get(pk=origin_subaccount_id) if origin_subaccount_id is not None else old_subaccount
        new_total_amount = Decimal(str(total_amount)) if total_amount is not None else old_total_amount

        if new_subaccount != old_subaccount:
            old_subaccount.balance -= old_total_amount
            old_subaccount.save()
            new_subaccount.balance += new_total_amount
            new_subaccount.save()
        elif new_total_amount != old_total_amount:
            new_subaccount.balance = new_subaccount.balance - old_total_amount + new_total_amount
            new_subaccount.save()

        item.origin_subaccount, item.total_amount = new_subaccount, new_total_amount
        item.save()
        return item

    @staticmethod
    @transaction.atomic
    def delete_debt_item(debt_item_id):
        from .models import DebtItem
        item = DebtItem.objects.select_for_update().get(pk=debt_item_id)
        item.origin_subaccount.balance -= item.total_amount
        item.origin_subaccount.save()
        item.delete()