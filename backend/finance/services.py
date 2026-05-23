from datetime import date, timedelta
import calendar
from decimal import Decimal
from django.db import transaction
from .models import CreditCard, CreditCardBill, CreditCardTransaction, Installment, Account, Transaction as CoreTransaction

@transaction.atomic
def process_credit_card_transaction(
    credit_card_id,
    description,
    date_tx,
    total_amount,
    category_id=None,
    installment_count=1,
    starting_installment=1,
    original_currency='BRL',
    original_amount=None,
    exchange_rate=Decimal('1.0000'),
    iof_amount=Decimal('0.00')
):
    """
    Processa uma compra no cartão de crédito, criando a Compra Matriz e dividindo
    em parcelas (Installments) alocadas nas faturas corretas com base no closing_day.
    """
    credit_card = CreditCard.objects.get(id=credit_card_id)
    
    val_total = Decimal(str(total_amount))
    val_orig = Decimal(str(original_amount)) if original_amount is not None else val_total
    val_rate = Decimal(str(exchange_rate))
    val_iof = Decimal(str(iof_amount))
    
    # Cria a Compra Matriz
    matrix_tx = CreditCardTransaction.objects.create(
        credit_card=credit_card,
        category_id=category_id,
        description=description,
        date=date_tx,
        total_amount=val_total,
        installment_count=installment_count,
        original_currency=original_currency,
        original_amount=val_orig,
        exchange_rate=val_rate,
        iof_amount=val_iof
    )
    
    # 1. Ciclo de Fatura e "Melhor Dia":
    # Se a transação ocorrer no dia exato ou após o closing_day, vai para o mês subsequente.
    current_month = date_tx.month
    current_year = date_tx.year
    
    if date_tx.day >= credit_card.closing_day:
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
            
    # Calcula as fatias da dívida (Installment)
    base_installment_amount = round(val_total / installment_count, 2)
    remainder = val_total - (base_installment_amount * installment_count)
    
    installments = []
    today = date.today()
    
    for i in range(starting_installment, installment_count + 1):
        bill_month = current_month
        bill_year = current_year
        
        # Obtém ou cria a Fatura
        bill, _ = CreditCardBill.objects.get_or_create(
            credit_card=credit_card,
            month=bill_month,
            year=bill_year
        )
        
        amount_part = base_installment_amount
        if i == starting_installment:
            amount_part += remainder  # Adiciona a diferença de centavos na primeira parcela efetivamente gerada
            
        status_calc = 'posted' if (bill_year < today.year or (bill_year == today.year and bill_month <= today.month)) else 'pending'
            
        inst = Installment.objects.create(
            transaction=matrix_tx,
            bill=bill,
            number=i,
            amount=amount_part,
            status=status_calc
        )
        installments.append(inst)
        
        # Realocação Virtual YNAB (Se a parcela cair na fatura atual/postada)
        if inst.status == 'posted':
            process_installment_ynab(inst)
            
        # Avança para o próximo mês
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
            
    return matrix_tx, installments


def process_installment_ynab(installment):
    """
    Executa a transferência virtual de saldo do envelope de despesa para o envelope de pagamento do cartão.
    """
    matrix_tx = installment.transaction
    credit_card = matrix_tx.credit_card
    user = credit_card.account.user
    
    category = matrix_tx.category
    category_name = category.name if category else "Geral"
    
    # Busca ou cria o envelope (sub-conta) de despesa (ex: Alimentação)
    expense_envelope = Account.objects.filter(
        user=user,
        name=category_name,
        currency=credit_card.account.currency,
        parent__isnull=False
    ).first()
    
    if not expense_envelope:
        parent_acc = Account.objects.filter(user=user, parent__isnull=True).first()
        if parent_acc:
            expense_envelope = Account.objects.create(
                user=user,
                name=category_name,
                currency=credit_card.account.currency,
                parent=parent_acc,
                account_type='savings',
                balance=Decimal('0.00')
            )
            
    # Busca ou cria o envelope de Pagamento do Cartão
    payment_envelope_name = f"Pagamento do Cartão {credit_card.account.name}"
    payment_envelope = Account.objects.filter(
        user=user,
        name=payment_envelope_name,
        currency=credit_card.account.currency,
        parent__isnull=False
    ).first()
    
    if not payment_envelope:
        parent_acc = expense_envelope.parent if expense_envelope else Account.objects.filter(user=user, parent__isnull=True).first()
        if parent_acc:
            payment_envelope = Account.objects.create(
                user=user,
                name=payment_envelope_name,
                currency=credit_card.account.currency,
                parent=parent_acc,
                account_type='savings',
                balance=Decimal('0.00')
            )
            
    if expense_envelope and payment_envelope:
        today = date.today()
        
        # Deduz do envelope de despesa
        tx_exp = CoreTransaction(
            account=expense_envelope,
            amount=installment.amount,
            description=f"Reserva YNAB: {matrix_tx.description} (Parcela {installment.number})",
            date=today,
            is_income=False,
            status='realized',
            is_applied_to_balance=True
        )
        tx_exp._skip_balance_update = True
        tx_exp.save()
        expense_envelope.balance -= installment.amount
        expense_envelope.save()
        
        # Aloca no envelope de pagamento do cartão
        tx_env = CoreTransaction(
            account=payment_envelope,
            amount=installment.amount,
            description=f"Reserva YNAB: {matrix_tx.description} (Parcela {installment.number})",
            date=today,
            is_income=True,
            status='realized',
            is_applied_to_balance=True
        )
        tx_env._skip_balance_update = True
        tx_env.save()
        payment_envelope.balance += installment.amount
        payment_envelope.save()

    # Registra a transação de despesa real sob a conta do cartão de crédito
    tx_cc = CoreTransaction(
        account=credit_card.account,
        category=category,
        amount=installment.amount,
        description=f"{matrix_tx.description} (Parcela {installment.number}/{matrix_tx.installment_count})" if matrix_tx.installment_count > 1 else matrix_tx.description,
        date=matrix_tx.date,
        is_income=False,
        status='realized',
        is_applied_to_balance=True
    )
    tx_cc._skip_balance_update = True
    tx_cc.save()
    credit_card.account.balance -= installment.amount
    credit_card.account.save()


class YNABBudgetService:
    @staticmethod
    def calculate_envelope_states(user, target_month, target_year):
        """
        Calcula retrospectivamente o estado dos envelopes de categoria e o pool de
        Ready to Assign (RTA) a partir de todas as transações e orçamentos registrados
        para o usuário, desde o primeiro mês ativo até o mês solicitado.
        """
        from .models import Category, MonthlyBudget, Transaction
        from collections import defaultdict

        # 1. Obter todas as categorias de despesa do usuário
        categories = Category.objects.filter(user=user)
        # Filtra categorias folha (categorias reais que recebem transações)
        leaf_categories = [c for c in categories if c.parent_id is not None]
        if not leaf_categories:
            leaf_categories = list(categories)

        # 2. Identificar o início histórico de transações e orçamentos do usuário
        first_tx = Transaction.objects.filter(account__user=user).order_by('date').first()
        first_budget = MonthlyBudget.objects.filter(category__user=user).order_by('year', 'month').first()

        start_month = target_month
        start_year = target_year

        if first_tx or first_budget:
            tx_year = first_tx.date.year if first_tx else 9999
            tx_month = first_tx.date.month if first_tx else 12
            b_year = first_budget.year if first_budget else 9999
            b_month = first_budget.month if first_budget else 12

            if (tx_year, tx_month) < (b_year, b_month):
                start_year, start_month = tx_year, tx_month
            else:
                start_year, start_month = b_year, b_month

        # Garante que não iniciaremos após o mês alvo solicitado
        if (start_year, start_month) > (target_year, target_month):
            start_year, start_month = target_year, target_month

        # Gera a sequência cronológica ordenada de meses até o target
        months_sequence = []
        cur_year, cur_month = start_year, start_month
        while (cur_year, cur_month) <= (target_year, target_month):
            months_sequence.append((cur_year, cur_month))
            cur_month += 1
            if cur_month > 12:
                cur_month = 1
                cur_year += 1

        # Dicionários de estado acumulado de rollover e overspending de meses passados
        # available_by_cat[(year, month)][cat_id] = Decimal
        available_by_cat = {}
        
        # ready_to_assign[(year, month)] = Decimal
        rta_by_month = {}

        prev_rta = Decimal('0.00')
        prev_month_cash_overspent = Decimal('0.00')

        # Loop cumulativo cronológico
        for (y, m) in months_sequence:
            # A. Receitas On-budget destinadas ao RTA no mês (y, m)
            # Transações On-budget sem categoria com is_income=True
            income_txs = Transaction.objects.filter(
                account__user=user,
                account__exclude_from_totals=False,
                date__month=m,
                date__year=y,
                is_income=True,
                category__isnull=True
            ).exclude(
                account__account_type='investment'
            )
            monthly_income = sum(tx.amount for tx in income_txs)

            # B. Total alocado (Budgeted) nas categorias no mês (y, m)
            budgets = MonthlyBudget.objects.filter(
                category__user=user,
                month=m,
                year=y
            )
            budget_map = {b.category_id: b.amount for b in budgets}
            monthly_budgeted = sum(budget_map.values())

            # C. RTA líquido deste mês (incremental)
            # RTA_M = RTA_prev + Income_M - Budgeted_M - CashOverspending_prev
            rta = prev_rta + monthly_income - monthly_budgeted - prev_month_cash_overspent
            rta_by_month[(y, m)] = rta

            # D. Para cada categoria, computar Atividade (Activity), Rollover e Disponível final
            available_by_cat[(y, m)] = {}

            # Gastos líquidas (Activity) da categoria no mês (despesas e reembolsos)
            # Apenas transações em contas On-budget contam contra o orçamento!
            txs = Transaction.objects.filter(
                account__user=user,
                account__exclude_from_totals=False,
                date__month=m,
                date__year=y,
                category__isnull=False
            ).exclude(
                account__account_type='investment'
            )

            activity_map = defaultdict(Decimal)
            credit_spent_map = defaultdict(Decimal)

            for tx in txs:
                amount = tx.amount
                if not tx.is_income:
                    activity_map[tx.category_id] -= amount
                    if tx.account.account_type == 'credit_card':
                        credit_spent_map[tx.category_id] += amount
                else:
                    activity_map[tx.category_id] += amount

            # Recupera o estado do mês anterior para cálculo de Rollover
            prev_year = y if m > 1 else y - 1
            prev_m = m - 1 if m > 1 else 12
            prev_month_state = available_by_cat.get((prev_year, prev_m), {})

            monthly_total_cash_overspending = Decimal('0.00')

            for cat in leaf_categories:
                cat_id = cat.id
                assigned = budget_map.get(cat_id, Decimal('0.00'))
                activity = activity_map.get(cat_id, Decimal('0.00'))

                # Rollover do mês anterior (apenas saldos positivos rolam!)
                prev_available = prev_month_state.get(cat_id, Decimal('0.00'))
                rollover = prev_available if prev_available > Decimal('0.00') else Decimal('0.00')

                # Disponível = Rollover + Alocado + Atividade
                available = rollover + assigned + activity
                available_by_cat[(y, m)][cat_id] = available

                # E. Gestão de estouros de envelope (Overspending: Cash vs. Credit)
                if available < Decimal('0.00'):
                    overspent_total = -available
                    credit_spent = credit_spent_map.get(cat_id, Decimal('0.00'))
                    
                    credit_overspent = min(overspent_total, credit_spent)
                    cash_overspent = overspent_total - credit_overspent
                    
                    monthly_total_cash_overspending += cash_overspent

            # Atualiza o estado cumulativo para o mês seguinte
            prev_rta = rta
            prev_month_cash_overspent = monthly_total_cash_overspending

        # 3. Retornar os dados computados do mês target solicitado
        target_key = (target_year, target_month)
        rta_target = rta_by_month.get(target_key, Decimal('0.00'))

        # Para computar a resposta do mês target, carregamos os dados reais do mês alvo
        budgets_target = MonthlyBudget.objects.filter(category__user=user, month=target_month, year=target_year)
        budget_map_target = {b.category_id: b.amount for b in budgets_target}

        txs_target = Transaction.objects.filter(
            account__user=user,
            account__exclude_from_totals=False,
            date__month=target_month,
            date__year=target_year,
            category__isnull=False
        ).exclude(
            account__account_type='investment'
        )
        activity_target = defaultdict(Decimal)
        credit_spent_target = defaultdict(Decimal)

        for tx in txs_target:
            amount = tx.amount
            if not tx.is_income:
                activity_target[tx.category_id] -= amount
                if tx.account.account_type == 'credit_card':
                    credit_spent_target[tx.category_id] += amount
            else:
                activity_target[tx.category_id] += amount

        prev_year = target_year if target_month > 1 else target_year - 1
        prev_m = target_month - 1 if target_month > 1 else 12
        prev_month_state = available_by_cat.get((prev_year, prev_m), {})

        envelope_states = {}
        for cat in leaf_categories:
            cat_id = cat.id
            assigned = budget_map_target.get(cat_id, Decimal('0.00'))
            activity = activity_target.get(cat_id, Decimal('0.00'))

            prev_available = prev_month_state.get(cat_id, Decimal('0.00'))
            rollover = prev_available if prev_available > Decimal('0.00') else Decimal('0.00')

            available = available_by_cat.get(target_key, {}).get(cat_id, Decimal('0.00'))

            # Classifica o tipo de estouro do mês target
            overspending_type = None
            if available < Decimal('0.00'):
                credit_spent = credit_spent_target.get(cat_id, Decimal('0.00'))
                credit_overspent = min(-available, credit_spent)
                if credit_overspent > Decimal('0.00') and credit_overspent == -available:
                    overspending_type = 'credit'
                elif credit_overspent > Decimal('0.00'):
                    overspending_type = 'split'
                else:
                    overspending_type = 'cash'

            envelope_states[cat_id] = {
                'assigned': assigned,
                'spent': activity,
                'rollover': rollover,
                'available': available,
                'overspending_type': overspending_type
            }

        return {
            'ready_to_assign': rta_target,
            'envelope_states': envelope_states
        }


class YNABGoalService:
    @staticmethod
    def calculate_underfunded(category, month, year, available_balance, assigned_amount):
        """
        Calcula o valor faltante de provisionamento ("Underfunded") de um envelope
        baseando-se na meta (CategoryGoal) ativa da categoria.
        """
        from .models import CategoryGoal
        
        goal = CategoryGoal.objects.filter(category=category).first()
        if not goal:
            return Decimal('0.00')

        # Converte valores para Decimal para evitar problemas de tipos mistos
        goal_amount = Decimal(str(goal.amount))
        available_balance = Decimal(str(available_balance))
        assigned_amount = Decimal(str(assigned_amount))

        # 1. Target Savings Builder (Meta Mensal Fixa)
        if goal.goal_type == 'target_builder':
            return max(Decimal('0.00'), goal_amount - assigned_amount)

        # 2. Needed for Spending por Prazo (Meta com Data Alvo)
        elif goal.goal_type == 'needed_spending_date':
            if not goal.target_date:
                return max(Decimal('0.00'), goal_amount - assigned_amount)
            
            # Calcular os meses restantes entre o mês/ano solicitado e a data alvo
            target_year = goal.target_date.year
            target_month = goal.target_date.month

            # Se o mês/ano solicitado já ultrapassou a data alvo
            if (year, month) > (target_year, target_month):
                divisor = 1
            else:
                num_months = (target_year - year) * 12 + (target_month - month)
                if num_months < 0:
                    num_months = 0
                divisor = num_months + 1

            # Necessidade total restante (Meta - Saldo Disponível)
            # available_balance reflete o saldo disponível total do envelope
            necessidade_restante = goal_amount - available_balance
            if necessidade_restante <= Decimal('0.00'):
                return Decimal('0.00')

            # O valor necessário para este mês é a necessidade restante dividida pelos meses restantes,
            # descontando o que o usuário já alocou (assigned_amount) neste mês específico.
            necessidade_mensal = round(necessidade_restante / Decimal(str(divisor)), 2)
            return max(Decimal('0.00'), necessidade_mensal - assigned_amount)

        # 3. Needed for Spending Periódico (Meta por Frequência, ex: Semanal)
        elif goal.goal_type == 'needed_spending_freq':
            if goal.frequency == 'weekly':
                # Conta quantas semanas (ocorrências de weekday de criação ou segundas-feiras) ocorrem no mês
                weekday = goal.created_at.weekday() if goal.created_at else 0
                cal = calendar.Calendar()
                occurrences = sum(1 for d in cal.itermonthdays2(year, month) if d[0] > 0 and d[1] == weekday)
                
                meta_mensal = goal_amount * Decimal(str(occurrences))
                return max(Decimal('0.00'), meta_mensal - assigned_amount)
            
            # Se for mensal ou outra frequência recorrente básica
            return max(Decimal('0.00'), goal_amount - assigned_amount)

        return Decimal('0.00')


class TransactionRulesService:
    @staticmethod
    def apply_rules(transaction):
        """
        Avalia e executa síncronamente as regras contábeis ('pre') cadastradas
        para o usuário da transação.
        """
        from .models import TransactionRule
        
        # Ignora se a transação não tem conta ou usuário definido
        if not hasattr(transaction, 'account') or not transaction.account or not transaction.account.user:
            return transaction

        rules = TransactionRule.objects.filter(
            user=transaction.account.user,
            is_active=True,
            stage='pre'
        ).order_by('created_at')

        for rule in rules:
            match = False
            conditions = rule.conditions
            conditions_op = rule.conditions_op

            if not conditions:
                continue

            results = []
            for cond in conditions:
                field = cond.get('field')
                op = cond.get('op')
                val = cond.get('value')

                # Obtém o valor atual do campo da transação a ser comparado
                actual_val = None
                if field == 'description':
                    actual_val = transaction.description or ""
                elif field == 'amount':
                    actual_val = transaction.amount
                elif field == 'date':
                    actual_val = transaction.date
                elif field == 'payee':
                    actual_val = transaction.payee.name if transaction.payee else ""
                
                # Executa o operador
                cond_res = False
                if op == 'is':
                    if isinstance(actual_val, str):
                        cond_res = (str(actual_val).lower() == str(val).lower())
                    else:
                        cond_res = (actual_val == val)
                elif op == 'contains':
                    cond_res = (str(val).lower() in str(actual_val).lower())
                elif op == 'is_empty':
                    cond_res = (not actual_val)

                results.append(cond_res)

            if conditions_op == 'and':
                match = all(results)
            else:
                match = any(results)

            # Se a regra bateu, executa as ações em série
            if match:
                for action in rule.actions:
                    act_op = action.get('op')
                    act_field = action.get('field')
                    act_val = action.get('value')

                    if act_op == 'set':
                        if act_field == 'category_id':
                            transaction.category_id = act_val
                        elif act_field == 'payee_id':
                            transaction.payee_id = act_val
                        elif act_field == 'description':
                            transaction.description = act_val
                        elif act_field == 'status':
                            transaction.status = act_val

        return transaction

    @staticmethod
    def process_payee_rules_from_description(user, raw_description):
        """
        Retorna payee_id e category_id sugeridos com base em regras contábeis
        que analisam o texto bruto do extrato.
        """
        from .models import TransactionRule
        
        # Cria um objeto Transaction fictício em memória para rodar as regras
        from .models import Transaction as CoreTx, Account
        
        dummy_acc = Account.objects.filter(user=user).first()
        if not dummy_acc:
            return None, None

        tx = CoreTx(
            account=dummy_acc,
            description=raw_description,
            amount=Decimal('0.00'),
            date=date.today()
        )
        
        tx = TransactionRulesService.apply_rules(tx)
        return tx.payee_id, tx.category_id


class NetWorthCalculator:
    @staticmethod
    def calculate_holdings(user):
        """
        Calcula as posições atuais e o Preço Médio (Weighted Average Cost)
        para todos os ativos baseando-se estritamente no ledger (InvestmentActivity).
        """
        from .models import InvestmentAsset
        from decimal import Decimal
        
        assets = InvestmentAsset.objects.filter(user=user).prefetch_related('activities')
        holdings = []
        
        for asset in assets:
            # Substituindo por uso do PortfolioEvolutionEngine
            if asset.asset_type in ['STOCK', 'FII', 'ETF', 'CRYPTO']:
                position = PortfolioEvolutionEngine.calculate_stock_position(asset.id)
                holdings.append({
                    'asset_id': position['asset_id'],
                    'ticker': position['ticker'],
                    'name': asset.name,
                    'currency': asset.currency,
                    'asset_type': asset.asset_type,
                    'quantity': position['quantity'],
                    'average_cost': position['average_cost'],
                    'total_cost_basis': position['total_cost_basis'],
                    'current_price': position['current_price'],
                    'net_value': position['net_value'],
                    'total_profit_loss': position['total_profit_loss'],
                    'percentage_yield': position['percentage_yield'],
                })
            elif asset.asset_type in ['FIXED_INCOME', 'TREASURY']:
                from datetime import date
                activities = asset.activities.all().order_by('date', 'created_at')
                total_quantity = Decimal('0.00')
                total_cost_basis = Decimal('0.00')
                net_value = Decimal('0.00')

                # Assegura que temos o CDI atualizado para a evolução
                MarketDataService.get_cdi_rate()

                for act in activities:
                    qty = act.quantity or Decimal('0.00')
                    price = act.unit_price or Decimal('0.00')
                    fees = act.fees or Decimal('0.00')
                    
                    if act.activity_type == 'BUY':
                        total_quantity += qty
                        total_cost_basis += (qty * price) + fees
                        # Calcula a evolução desta tranche
                        tranche_value = PortfolioEvolutionEngine.calculate_fixed_income_evolution(act.id, date.today())
                        net_value += tranche_value
                    elif act.activity_type == 'SELL':
                        if total_quantity > Decimal('0.00'):
                            average_price = total_cost_basis / total_quantity
                            total_cost_basis -= (qty * average_price)
                        total_quantity -= qty
                        # Simplificação para venda: remove da cotação proporcional
                        if total_cost_basis <= Decimal('0.00'):
                            net_value = Decimal('0.00')
                        else:
                            # A aproximação para venda não debita cota exata (necessitaria motor mais complexo)
                            # Deduzimos o custo proporcional do net_value
                            net_value -= (qty * average_price)
                
                total_profit_loss = net_value - total_cost_basis
                percentage_yield = Decimal('0.00')
                if total_cost_basis > Decimal('0.00'):
                    percentage_yield = (total_profit_loss / total_cost_basis) * Decimal('100.0')

                average_cost = Decimal('0.00')
                current_price = Decimal('0.00')
                if total_quantity > Decimal('0.00'):
                    average_cost = total_cost_basis / total_quantity
                    current_price = net_value / total_quantity

                holdings.append({
                    'asset_id': asset.id,
                    'ticker': asset.ticker,
                    'name': asset.name,
                    'currency': asset.currency,
                    'asset_type': asset.asset_type,
                    'quantity': total_quantity,
                    'average_cost': round(average_cost, 4),
                    'total_cost_basis': round(total_cost_basis, 2),
                    'current_price': round(current_price, 4),
                    'net_value': round(net_value, 2),
                    'total_profit_loss': round(total_profit_loss, 2),
                    'percentage_yield': round(percentage_yield, 2),
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
        """
        Retrieves the current CDI annual rate from HG Brasil.
        Saves it automatically to DailyCDIRate cache.
        """
        from datetime import date
        from decimal import Decimal
        from .models import DailyCDIRate

        today = date.today()
        # Check cache first
        cached = DailyCDIRate.objects.filter(date=today).first()
        if cached:
            return cached.annual_rate

        hg_brasil_key = getattr(settings, 'HG_BRASIL_API_KEY', '')
        try:
            response = requests.get(
                'https://api.hgbrasil.com/finance/taxes',
                params={'key': hg_brasil_key},
                timeout=4
            )
            response.raise_for_status()
            data = response.json()
            if 'results' in data and data['results']:
                results = data['results'][0]
                if 'cdi' in results:
                    cdi_annual = Decimal(str(results['cdi']))
                    DailyCDIRate.objects.update_or_create(
                        date=today,
                        defaults={'annual_rate': cdi_annual}
                    )
                    return cdi_annual
        except Exception as e:
            logger.warning(f"HG Brasil CDI fetch failed: {e}")
        
        # Fallback to the latest available
        latest = DailyCDIRate.objects.order_by('-date').first()
        if latest:
            return latest.annual_rate
        return None

    @staticmethod
    def get_asset_price(ticker: str, is_brazilian: bool = False) -> Decimal | None:
        """
        Retrieves the current market price for an asset using multi-tier failover logic.
        """
        alpha_vantage_key = getattr(settings, 'ALPHA_VANTAGE_API_KEY', '')
        twelve_data_key = getattr(settings, 'TWELVE_DATA_API_KEY', '')
        hg_brasil_key = getattr(settings, 'HG_BRASIL_API_KEY', '')
        
        timeout_sec = 4

        if is_brazilian:
            # 1. Alpha Vantage (Master) - uses .SA
            av_ticker = f"{ticker}.SA" if not ticker.endswith('.SA') else ticker
            try:
                response = requests.get(
                    'https://www.alphavantage.co/query',
                    params={
                        'function': 'GLOBAL_QUOTE',
                        'symbol': av_ticker,
                        'apikey': alpha_vantage_key
                    },
                    timeout=timeout_sec
                )
                response.raise_for_status()
                data = response.json()
                if 'Global Quote' in data and '05. price' in data['Global Quote']:
                    return Decimal(str(data['Global Quote']['05. price']))
            except Exception as e:
                logger.warning(f"Alpha Vantage failed for {av_ticker}: {e}. Failing over to HG Brasil.")

            # 2. HG Brasil (Fallback Nacional)
            hg_ticker = ticker.replace('.SA', '')
            try:
                response = requests.get(
                    'https://api.hgbrasil.com/finance/stock_price',
                    params={
                        'key': hg_brasil_key,
                        'symbol': hg_ticker
                    },
                    timeout=timeout_sec
                )
                response.raise_for_status()
                data = response.json()
                if 'results' in data and hg_ticker.upper() in data['results']:
                    return Decimal(str(data['results'][hg_ticker.upper()]['price']))
            except Exception as e:
                logger.warning(f"HG Brasil failed for {hg_ticker}: {e}.")

        else:
            # 1. Alpha Vantage (Master)
            try:
                response = requests.get(
                    'https://www.alphavantage.co/query',
                    params={
                        'function': 'GLOBAL_QUOTE',
                        'symbol': ticker,
                        'apikey': alpha_vantage_key
                    },
                    timeout=timeout_sec
                )
                response.raise_for_status()
                data = response.json()
                if 'Global Quote' in data and '05. price' in data['Global Quote']:
                    return Decimal(str(data['Global Quote']['05. price']))
            except Exception as e:
                logger.warning(f"Alpha Vantage failed for {ticker}: {e}. Failing over to Twelve Data.")

            # 2. Twelve Data (Fallback Internacional)
            try:
                response = requests.get(
                    'https://api.twelvedata.com/price',
                    params={
                        'symbol': ticker,
                        'apikey': twelve_data_key
                    },
                    timeout=timeout_sec
                )
                response.raise_for_status()
                data = response.json()
                if 'price' in data:
                    return Decimal(str(data['price']))
            except Exception as e:
                logger.warning(f"Twelve Data failed for {ticker}: {e}.")

        # 3. Last Line of Defense: Local Cache
        logger.warning(f"All external APIs failed for {ticker}. Fetching from DailyAssetPrice cache.")
        try:
            last_price = DailyAssetPrice.objects.filter(asset__ticker=ticker).order_by('-date').first()
            if last_price:
                return last_price.price
        except Exception as e:
            logger.error(f"Failed to fetch local cache for {ticker}: {e}")
            
        return None

from .models import DailyCDIRate, InvestmentActivity, InvestmentAsset

class PortfolioEvolutionEngine:
    @staticmethod
    def calculate_fixed_income_evolution(activity_id: int, target_date: date) -> Decimal:
        """
        Calculates the compounded value of a fixed income investment up to the target date.
        Uses the Brazilian 252-day convention with daily CDI rates.
        """
        activity = InvestmentActivity.objects.get(id=activity_id)
        
        principal = activity.principal_amount
        if not principal:
            qty = activity.quantity or Decimal('0.00')
            price = activity.unit_price or Decimal('0.00')
            fees = activity.fees or Decimal('0.00')
            principal = (qty * price) + fees
            
        cdi_perc = activity.cdi_percentage
        if not cdi_perc:
            cdi_perc = Decimal('100.00')

        if principal <= Decimal('0.00'):
            return Decimal('0.00')

        # Get all CDI rates between purchase date and target date
        cdi_rates = DailyCDIRate.objects.filter(
            date__gte=activity.date,
            date__lte=target_date
        ).order_by('date')

        current_amount = principal
        cdi_multiplier = cdi_perc / Decimal('100.0')

        for rate in cdi_rates:
            # Formula: A_t = A_{t-1} * (1 + daily_rate * (CDI% / 100))
            if rate.daily_rate is not None:
                current_amount *= (Decimal('1.0') + (rate.daily_rate * cdi_multiplier))

        return current_amount

    @staticmethod
    def calculate_stock_position(asset_id: int) -> dict:
        """
        Processes the InvestmentActivity ledger for a given stock asset 
        to determine current holdings and weighted average cost.
        """
        asset = InvestmentAsset.objects.get(id=asset_id)
        activities = asset.activities.all().order_by('date', 'created_at')

        total_quantity = Decimal('0.00000000')
        total_cost_basis = Decimal('0.00')

        for act in activities:
            qty = act.quantity or Decimal('0.00')
            price = act.unit_price or Decimal('0.00')
            fees = act.fees or Decimal('0.00')

            if act.activity_type == 'BUY':
                total_quantity += qty
                total_cost_basis += (qty * price) + fees
            elif act.activity_type == 'SELL':
                if total_quantity > Decimal('0.00000000'):
                    average_price = total_cost_basis / total_quantity
                    total_cost_basis -= (qty * average_price)
                total_quantity -= qty
            elif act.activity_type == 'SPLIT':
                total_quantity *= qty

        if total_quantity <= Decimal('0.00000001'):
            total_quantity = Decimal('0.00000000')
            average_cost = Decimal('0.00')
        else:
            average_cost = total_cost_basis / total_quantity

        # Cross-reference with the latest cached price
        # Assumes the ticker might be brazilian, defaults to True for general use case or adapt if currency == 'BRL'
        is_brazilian = asset.currency == 'BRL'
        current_price_value = MarketDataService.get_asset_price(asset.ticker, is_brazilian=is_brazilian)
        if current_price_value is None:
            current_price_value = Decimal('0.00')

        net_value = total_quantity * current_price_value
        total_profit_loss = net_value - total_cost_basis
        percentage_yield = Decimal('0.00')
        if total_cost_basis > Decimal('0.00'):
            percentage_yield = (total_profit_loss / total_cost_basis) * Decimal('100.0')

        return {
            'asset_id': asset.id,
            'ticker': asset.ticker,
            'quantity': total_quantity,
            'average_cost': round(average_cost, 4),
            'total_cost_basis': round(total_cost_basis, 2),
            'current_price': current_price_value,
            'net_value': round(net_value, 2),
            'total_profit_loss': round(total_profit_loss, 2),
            'percentage_yield': round(percentage_yield, 2),
        }
