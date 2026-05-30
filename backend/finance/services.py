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
    expense_account_id=None,
    installment_count=1,
    starting_installment=1,
    original_currency='BRL',
    original_amount=None,
    exchange_rate=Decimal('1.0000'),
    iof_amount=Decimal('0.00'),
    input_type='TOTAL'
):
    """
    Processa uma compra no cartão de crédito, criando a Compra Matriz e dividindo
    em parcelas (Installments) alocadas nas faturas corretas com base no closing_day.
    """
    credit_card = CreditCard.objects.get(id=credit_card_id)
    
    # Bypass Regional (Portugal - PT): cartões emitidos em PT não suportam parcelamento pelo estabelecimento
    if credit_card.country_of_issue == 'PT':
        installment_count = 1
        starting_installment = 1
        input_type = 'TOTAL'
        
    val_total = Decimal(str(total_amount))
    val_orig = Decimal(str(original_amount)) if original_amount is not None else val_total
    val_rate = Decimal(str(exchange_rate))
    val_iof = Decimal(str(iof_amount))
    
    # Calcula as fatias da dívida (Installment)
    if input_type == 'PARCELA':
        base_installment_amount = round(val_total, 2)
        val_total = val_total * installment_count
    else:
        base_installment_amount = round(val_total / installment_count, 2)
        
    remainder = val_total - (base_installment_amount * installment_count)
    
    # Cria a Compra Matriz (Agora que val_total já está 100% ajustado caso input_type seja PARCELA)
    matrix_tx = CreditCardTransaction.objects.create(
        credit_card=credit_card,
        category_id=category_id,
        expense_account_id=expense_account_id,
        description=description,
        date=date_tx,
        total_amount=val_total,
        installment_count=installment_count,
        original_currency=original_currency,
        original_amount=val_orig if input_type != 'PARCELA' else val_orig * installment_count,
        exchange_rate=val_rate,
        iof_amount=val_iof
    )
    
    # Resolve a subconta (envelope de despesa) antes do loop de parcelas
    category_name = matrix_tx.category.name if matrix_tx.category else "Geral"
    expense_envelope = matrix_tx.expense_account
    if not expense_envelope:
        expense_envelope = Account.objects.filter(
            user=credit_card.account.user,
            name=category_name,
            currency=credit_card.account.currency,
            parent__isnull=False
        ).first()
        if not expense_envelope:
            parent_acc = Account.objects.filter(user=credit_card.account.user, parent__isnull=True).first()
            if parent_acc:
                expense_envelope = Account.objects.create(
                    user=credit_card.account.user,
                    name=category_name,
                    currency=credit_card.account.currency,
                    parent=parent_acc,
                    account_type='savings',
                    balance=Decimal('0.00')
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
            status=status_calc,
            subaccount=expense_envelope
        )
        installments.append(inst)
        
        # Realocação Virtual YNAB (Agora para TODAS as parcelas, pois as pendentes não afetam o saldo)
        process_installment_ynab(inst)
            
        # Avança para o próximo mês
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
            
    return matrix_tx, installments


def process_installment_ynab(installment):
    """
    Cria a transação pendente na subconta de despesa e registra a dívida no cartão.
    A dedução real ocorrerá apenas quando a fatura for paga (is_applied_to_balance=True).
    """
    matrix_tx = installment.transaction
    credit_card = matrix_tx.credit_card
    
    category = matrix_tx.category
    
    # Busca a subconta (envelope) de despesa vinculada
    expense_envelope = installment.subaccount
            
    if expense_envelope:
        # Incrementa o saldo reservado (Deferred Subaccount Deduction)
        expense_envelope.reserved_credit_balance += installment.amount
        expense_envelope.save()

        # Calcula a data projetada da fatura para as transações pendentes
        import calendar
        try:
            _, last_day_of_bill_month = calendar.monthrange(installment.bill.year, installment.bill.month)
            day_to_use = min(matrix_tx.date.day, last_day_of_bill_month)
            tx_date = date(installment.bill.year, installment.bill.month, day_to_use)
        except Exception:
            tx_date = matrix_tx.date
            
        # Cria a transação PENDENTE na subconta de despesa
        # Ela aparece no extrato, mas não desconta o saldo nem o orçamento (is_applied_to_balance=False)
        tx_exp = CoreTransaction(
            account=expense_envelope,
            category=category,
            amount=installment.amount,
            description=f"{matrix_tx.description} (Parcela {installment.number}/{matrix_tx.installment_count})" if matrix_tx.installment_count > 1 else matrix_tx.description,
            date=tx_date,
            is_income=False,
            status='pending',
            is_applied_to_balance=False,
            credit_card_bill=installment.bill
        )
        tx_exp._skip_balance_update = True
        tx_exp.save()

        # Registra a dívida real no cartão de crédito
        # Sem categoria para não afetar o orçamento até o pagamento!
        tx_cc = CoreTransaction(
            account=credit_card.account,
            amount=installment.amount,
            description=f"{matrix_tx.description} (Parcela {installment.number}/{matrix_tx.installment_count})" if matrix_tx.installment_count > 1 else matrix_tx.description,
            date=tx_date,
            is_income=False,
            status='realized',
            is_applied_to_balance=True
        )
        tx_cc._skip_balance_update = True
        tx_cc.save()
        credit_card.account.balance -= installment.amount
        credit_card.account.save()


@transaction.atomic
def pay_bill(bill_id, payment_mode, payload_data=None, payment_account_id=None):
    """
    Serviço avançado de pagamento de fatura com 3 estratégias matemáticas:
    - ITEMIZED: paga parcelas específicas de payload_data['installment_ids']
    - FIFO: consome um valor total de payload_data['amount'] pagando por ordem cronológica (com split se necessário)
    - PERCENTAGE: aplica um percentual de payload_data['percentage'] pro-rata a todas as parcelas (com split)
    """
    try:
        bill = CreditCardBill.objects.get(id=bill_id)
    except CreditCardBill.DoesNotExist:
        raise ValueError("Fatura não encontrada.")

    credit_card = bill.credit_card
    user = credit_card.account.user

    # Parcelas não pagas desta fatura
    unpaid_installments = bill.installments.filter(status__in=['pending', 'posted']).order_by('transaction__date', 'id')

    total_paid = Decimal('0.00')

    # Próxima fatura para caso de split
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
            amt = inst.amount
            total_paid += amt
            
            subaccount = inst.subaccount
            if subaccount:
                subaccount.balance -= amt
                subaccount.reserved_credit_balance -= amt
                subaccount.save()
                
                tx = CoreTransaction.objects.filter(
                    account=subaccount,
                    credit_card_bill=bill,
                    amount=amt,
                    status='pending'
                ).first()
                if tx:
                    tx.status = 'realized'
                    tx.is_applied_to_balance = True
                    tx._skip_balance_update = True
                    tx.save()
            
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
            
            subaccount = inst.subaccount
            if pool >= inst.amount:
                # Cobertura total
                amt_to_pay = inst.amount
                pool -= amt_to_pay
                total_paid += amt_to_pay
                
                if subaccount:
                    subaccount.balance -= amt_to_pay
                    subaccount.reserved_credit_balance -= amt_to_pay
                    subaccount.save()
                    
                    tx = CoreTransaction.objects.filter(
                        account=subaccount,
                        credit_card_bill=bill,
                        amount=amt_to_pay,
                        status='pending'
                    ).first()
                    if tx:
                        tx.status = 'realized'
                        tx.is_applied_to_balance = True
                        tx._skip_balance_update = True
                        tx.save()
                
                inst.status = 'paid'
                inst.save()
            else:
                # Cobertura parcial (Boundary split)
                amt_to_pay = pool
                remaining_amt = inst.amount - amt_to_pay
                pool = Decimal('0.00')
                total_paid += amt_to_pay
                
                next_bill = get_or_create_next_bill()
                
                # Incrementa o número de parcelas na transação matriz para manter unicidade
                matrix_tx = inst.transaction
                matrix_tx.installment_count += 1
                matrix_tx.save()
                
                if new_subaccount_id is not None:
                    from .services import YNABBudgetService
                    # Force recalculation for the bill month
                    for inst in installments_to_affect:
                        YNABBudgetService.calculate_envelope_states(user, inst.bill.month, inst.bill.year)
                
                # Cria a parcela residual para a próxima fatura
                Installment.objects.create(
                    transaction=matrix_tx,
                    bill=next_bill,
                    number=matrix_tx.installment_count,
                    amount=remaining_amt,
                    status='pending',
                    subaccount=subaccount
                )
                
                if subaccount:
                    subaccount.balance -= amt_to_pay
                    subaccount.reserved_credit_balance -= amt_to_pay
                    subaccount.save()
                    
                    tx = CoreTransaction.objects.filter(
                        account=subaccount,
                        credit_card_bill=bill,
                        amount=inst.amount,
                        status='pending'
                    ).first()
                    if tx:
                        import calendar
                        # Cria transação pendente residual para o mês seguinte
                        CoreTransaction.objects.create(
                            account=subaccount,
                            category=tx.category,
                            amount=remaining_amt,
                            description=tx.description,
                            date=date(next_bill.year, next_bill.month, min(tx.date.day, calendar.monthrange(next_bill.year, next_bill.month)[1])),
                            is_income=tx.is_income,
                            status='pending',
                            is_applied_to_balance=False,
                            credit_card_bill=next_bill
                        )
                        tx.amount = amt_to_pay
                        tx.status = 'realized'
                        tx.is_applied_to_balance = True
                        tx._skip_balance_update = True
                        tx.save()
                
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
            slice_amount = round(inst.amount * factor, 2)
            remaining_amount = inst.amount - slice_amount
            total_paid += slice_amount
            
            subaccount = inst.subaccount
            if remaining_amount > 0:
                # Incrementa o número de parcelas na transação matriz para manter unicidade
                matrix_tx = inst.transaction
                matrix_tx.installment_count += 1
                matrix_tx.save()
                
                if new_subaccount_id is not None:
                    from .services import YNABBudgetService
                    # Force recalculation for the bill month
                    for inst in installments_to_affect:
                        YNABBudgetService.calculate_envelope_states(user, inst.bill.month, inst.bill.year)
                
                # Cria a parcela residual na próxima fatura
                Installment.objects.create(
                    transaction=matrix_tx,
                    bill=next_bill,
                    number=matrix_tx.installment_count,
                    amount=remaining_amount,
                    status='pending',
                    subaccount=subaccount
                )
            
            if subaccount:
                subaccount.balance -= slice_amount
                subaccount.reserved_credit_balance -= slice_amount
                subaccount.save()
                
                tx = CoreTransaction.objects.filter(
                    account=subaccount,
                    credit_card_bill=bill,
                    amount=inst.amount,
                    status='pending'
                ).first()
                if tx:
                    if remaining_amount > 0:
                        import calendar
                        # Cria transação pendente residual para o mês seguinte
                        CoreTransaction.objects.create(
                            account=subaccount,
                            category=tx.category,
                            amount=remaining_amount,
                            description=tx.description,
                            date=date(next_bill.year, next_bill.month, min(tx.date.day, calendar.monthrange(next_bill.year, next_bill.month)[1])),
                            is_income=tx.is_income,
                            status='pending',
                            is_applied_to_balance=False,
                            credit_card_bill=next_bill
                        )
                    tx.amount = slice_amount
                    tx.status = 'realized'
                    tx.is_applied_to_balance = True
                    tx._skip_balance_update = True
                    tx.save()
                    
            inst.amount = slice_amount
            inst.status = 'paid'
            inst.save()

    # Criação dos lançamentos contábeis de pagamento/transferência da conta corrente (checking) se informado
    if payment_account_id and total_paid > 0:
        payment_account = Account.objects.get(id=payment_account_id, user=user)
        
        # Transação de saída da conta de pagamento
        payment_tx = CoreTransaction(
            account=payment_account,
            amount=total_paid,
            description=f"Pagamento de Fatura: {credit_card.account.name}",
            date=date.today(),
            is_income=False,
            status='realized',
            is_applied_to_balance=True
        )
        payment_tx._skip_balance_update = True
        payment_tx.save()
        payment_account.balance -= total_paid
        payment_account.save()
        
        # Transação de entrada no cartão de crédito
        card_tx = CoreTransaction(
            account=credit_card.account,
            amount=total_paid,
            description=f"Pagamento da Fatura",
            date=date.today(),
            is_income=True,
            status='realized',
            is_applied_to_balance=True,
            credit_card_bill=bill
        )
        card_tx._skip_balance_update = True
        card_tx.save()
        credit_card.account.balance += total_paid
        credit_card.account.save()

    # Fecha a fatura caso todas as parcelas estejam pagas
    if not bill.installments.filter(status__in=['pending', 'posted']).exists():
        bill.is_closed = True
        bill.is_paid = True
        bill.save()

    return total_paid


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
                category__isnull=False,
                is_applied_to_balance=True
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
            category__isnull=False,
            is_applied_to_balance=True
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


class CreditCardManagementService:
    @staticmethod
    def manage_installment(installment, mode, action, new_data=None):
        from .models import Transaction as CoreTransaction, Installment
        from decimal import Decimal
        from django.db import transaction
        
        with transaction.atomic():
            matrix_tx = installment.transaction
            user = matrix_tx.credit_card.account.user
            credit_card = matrix_tx.credit_card
            
            installments_to_affect = []
            if mode == 'single':
                installments_to_affect = [installment]
            elif mode == 'future':
                installments_to_affect = list(matrix_tx.installments.filter(number__gte=installment.number).order_by('number'))
            elif mode == 'all':
                installments_to_affect = list(matrix_tx.installments.all().order_by('number'))
                
            if action == 'delete':
                for inst in installments_to_affect:
                    CoreTransaction.objects.filter(
                        account=credit_card.account,
                        description__startswith=matrix_tx.description,
                        description__contains=f'(Parcela {inst.number}/'
                    ).delete()
                    
                    CoreTransaction.objects.filter(
                        account__user=user,
                        credit_card_bill=inst.bill,
                        description__startswith=matrix_tx.description,
                        description__contains=f'(Parcela {inst.number}/'
                    ).delete()
                    
                    matrix_tx.total_amount -= inst.amount
                    matrix_tx.installment_count -= 1
                    inst.delete()
                    
                if matrix_tx.installment_count <= 0:
                    matrix_tx.delete()
                else:
                    matrix_tx.save()
                    
            elif action == 'edit':
                new_amount = Decimal(str(new_data.get('amount'))) if new_data and 'amount' in new_data else None
                new_description = new_data.get('description') if new_data else None
                new_subaccount_id = new_data.get('subaccount_id') if new_data else None
                old_desc = matrix_tx.description
                
                for inst in installments_to_affect:
                    if new_amount is not None:
                        diff = new_amount - inst.amount
                        matrix_tx.total_amount += diff
                        inst.amount = new_amount
                        
                    old_subaccount_id = inst.subaccount_id
                    if new_subaccount_id is not None and old_subaccount_id != new_subaccount_id:
                        inst.subaccount_id = new_subaccount_id
                        
                        # Update reserved credit balance manually when subaccount changes retroactively
                        if inst.status in ['pending', 'unpaid']:
                            from finance.models import Account
                            if old_subaccount_id:
                                old_acc = Account.objects.filter(id=old_subaccount_id).first()
                                if old_acc:
                                    old_acc.reserved_credit_balance -= inst.amount
                                    old_acc.save()
                                    
                            new_acc = Account.objects.filter(id=new_subaccount_id).first()
                            if new_acc:
                                new_acc.reserved_credit_balance += inst.amount
                                new_acc.save()

                    inst.save()
                    
                    if new_amount is not None:
                        cc_txs = CoreTransaction.objects.filter(
                            account=credit_card.account,
                            description__startswith=old_desc,
                            description__contains=f'(Parcela {inst.number}/'
                        )
                        for t in cc_txs:
                            t._skip_balance_update = False
                            t.amount = new_amount
                            t.save()
                            
                        # Atualiza também a transação pendente na subconta
                        ynab_txs = CoreTransaction.objects.filter(
                            account__user=user,
                            credit_card_bill=inst.bill,
                            description__startswith=old_desc,
                            description__contains=f'(Parcela {inst.number}/'
                        )
                        for t in ynab_txs:
                            t._skip_balance_update = False
                            t.amount = new_amount
                            t.save()
                    
                    if new_subaccount_id is not None:
                        ynab_txs = CoreTransaction.objects.filter(
                            account__user=user,
                            credit_card_bill=inst.bill,
                            description__startswith=old_desc,
                            description__contains=f'(Parcela {inst.number}/'
                        )
                        for t in ynab_txs:
                            t._skip_balance_update = True
                            t.account_id = new_subaccount_id
                            t.save()
                
                if new_description is not None:
                    matrix_tx.description = new_description
                    
                    for inst in installments_to_affect:
                        new_parcela_desc = f"{new_description} (Parcela {inst.number}/{matrix_tx.installment_count})" if matrix_tx.installment_count > 1 else new_description
                        inst.description = new_parcela_desc
                        inst.save()
                        
                        cc_txs = CoreTransaction.objects.filter(
                            account=credit_card.account,
                            description__startswith=old_desc,
                            description__contains=f'(Parcela {inst.number}/'
                        )
                        for t in cc_txs:
                            t._skip_balance_update = True
                            t.description = new_parcela_desc
                            t.save()
                            
                        ynab_txs = CoreTransaction.objects.filter(
                            account__user=user,
                            credit_card_bill=inst.bill,
                            description__startswith=old_desc,
                            description__contains=f'(Parcela {inst.number}/'
                        )
                        for t in ynab_txs:
                            t._skip_balance_update = True
                            t.description = new_parcela_desc
                            t.save()
                            
                matrix_tx.save()
                
                if new_subaccount_id is not None:
                    from .services import YNABBudgetService
                    # Force recalculation for the bill month
                    for inst in installments_to_affect:
                        YNABBudgetService.calculate_envelope_states(user, inst.bill.month, inst.bill.year)


class BudgetAutomationService:
    """
    Serviço de alocação inteligente de receita nos envelopes de orçamento.
    Consome do pool RTA e distribui para MonthlyBudget de acordo com as
    regras de target definidas em cada Category.
    """

    @staticmethod
    @transaction.atomic
    def smart_allocate(user, amount, mode, month=None, year=None, savings_category_id=None):
        """
        Aloca `amount` do RTA para os envelopes de categoria.
        Modos:
          - RECURRING_TARGETS: preenche envelopes conforme target_value de cada categoria.
          - EXTRA_PROPORTIONAL: distribui extra proporcional aos ratios dos targets.
          - EXTRA_SAVINGS: injeta 100% do extra numa categoria de poupança designada.

        Retorna dict com breakdown da alocação e saldo não alocado.
        """
        from .models import Category, MonthlyBudget
        from datetime import date as dt_date

        today = dt_date.today()
        m = month or today.month
        y = year or today.year
        pool = Decimal(str(amount))
        if pool <= Decimal('0.00'):
            return {'allocated': {}, 'remainder': Decimal('0.00'), 'total_allocated': Decimal('0.00')}

        cats = Category.objects.filter(user=user, parent__isnull=False, target_value__gt=Decimal('0.00'))
        allocated = {}

        if mode == 'RECURRING_TARGETS':
            for cat in cats:
                if pool <= Decimal('0.00'):
                    break
                target = cat.target_value if cat.target_type == 'FIXED' else round(pool * cat.target_value / Decimal('100.00'), 2)
                # Obter quanto já está alocado neste mês
                mb, created = MonthlyBudget.objects.get_or_create(
                    category=cat, month=m, year=y, defaults={'amount': Decimal('0.00')}
                )
                gap = max(Decimal('0.00'), target - mb.amount)
                fill = min(gap, pool) if cat.target_type == 'FIXED' else min(target, pool)
                if fill > Decimal('0.00'):
                    mb.amount += fill
                    mb.save()
                    pool -= fill
                    allocated[cat.id] = {'name': cat.name, 'amount': fill}

        elif mode == 'EXTRA_PROPORTIONAL':
            total_target = sum(
                c.target_value for c in cats if c.target_type == 'FIXED'
            ) + sum(
                pool * c.target_value / Decimal('100.00') for c in cats if c.target_type == 'PERCENTAGE'
            )
            if total_target > Decimal('0.00'):
                for cat in cats:
                    if pool <= Decimal('0.00'):
                        break
                    t = cat.target_value if cat.target_type == 'FIXED' else round(pool * cat.target_value / Decimal('100.00'), 2)
                    ratio = t / total_target
                    share = round(Decimal(str(amount)) * ratio, 2)
                    share = min(share, pool)
                    if share > Decimal('0.00'):
                        mb, _ = MonthlyBudget.objects.get_or_create(
                            category=cat, month=m, year=y, defaults={'amount': Decimal('0.00')}
                        )
                        mb.amount += share
                        mb.save()
                        pool -= share
                        allocated[cat.id] = {'name': cat.name, 'amount': share}

        elif mode == 'EXTRA_SAVINGS':
            if not savings_category_id:
                raise ValueError("savings_category_id é obrigatório para o modo EXTRA_SAVINGS.")
            cat = Category.objects.get(id=savings_category_id, user=user)
            mb, _ = MonthlyBudget.objects.get_or_create(
                category=cat, month=m, year=y, defaults={'amount': Decimal('0.00')}
            )
            mb.amount += pool
            mb.save()
            allocated[cat.id] = {'name': cat.name, 'amount': pool}
            pool = Decimal('0.00')

        total_alloc = Decimal(str(amount)) - pool
        return {'allocated': allocated, 'remainder': pool, 'total_allocated': total_alloc}


class BudgetRebalancingService:
    """
    Serviço de rebalanceamento automático dos envelopes de orçamento.
    Opera sobre MonthlyBudget.amount para redistribuir fundos entre categorias
    sem tocar no pool RTA (exceto surplus_sweep que devolve ao RTA).
    """

    @staticmethod
    @transaction.atomic
    def auto_shield(user, month, year):
        """
        Escudo automático: identifica categorias com saldo negativo e cobre o déficit
        puxando proporcionalmente APENAS de categorias com available > target_value.
        CRÍTICO: NÃO toca no pool RTA.

        Retorna dict com categorias doadoras, receptoras e valores transferidos.
        """
        from .models import Category, MonthlyBudget

        states = YNABBudgetService.calculate_envelope_states(user, month, year)
        envelopes = states['envelope_states']

        cats = {c.id: c for c in Category.objects.filter(user=user, parent__isnull=False)}

        # Separar deficitárias e superavitárias (acima do target)
        deficit_cats = {}  # cat_id -> deficit (positivo)
        donor_cats = {}    # cat_id -> excesso doável (acima do target)

        for cat_id, env in envelopes.items():
            available = env['available']
            cat = cats.get(cat_id)
            if not cat:
                continue
            if available < Decimal('0.00'):
                deficit_cats[cat_id] = -available
            elif available > cat.target_value and cat.target_value > Decimal('0.00'):
                donor_cats[cat_id] = available - cat.target_value

        total_deficit = sum(deficit_cats.values())
        total_donor_pool = sum(donor_cats.values())

        if total_deficit <= Decimal('0.00') or total_donor_pool <= Decimal('0.00'):
            return {'donors': {}, 'recipients': {}, 'total_moved': Decimal('0.00'), 'uncovered_deficit': total_deficit}

        # Quanto realmente conseguimos cobrir
        coverable = min(total_deficit, total_donor_pool)
        donors_log = {}
        recipients_log = {}

        # 1. Puxar dos doadores proporcionalmente
        for cat_id, excess in donor_cats.items():
            ratio = excess / total_donor_pool
            pull = round(coverable * ratio, 2)
            if pull > Decimal('0.00'):
                mb, _ = MonthlyBudget.objects.get_or_create(
                    category_id=cat_id, month=month, year=year, defaults={'amount': Decimal('0.00')}
                )
                mb.amount -= pull
                mb.save()
                donors_log[cat_id] = {'name': cats[cat_id].name, 'pulled': pull}

        # 2. Distribuir para deficitárias proporcionalmente
        for cat_id, deficit in deficit_cats.items():
            ratio = deficit / total_deficit
            push = round(coverable * ratio, 2)
            if push > Decimal('0.00'):
                mb, _ = MonthlyBudget.objects.get_or_create(
                    category_id=cat_id, month=month, year=year, defaults={'amount': Decimal('0.00')}
                )
                mb.amount += push
                mb.save()
                recipients_log[cat_id] = {'name': cats[cat_id].name, 'received': push}

        uncovered = max(Decimal('0.00'), total_deficit - coverable)
        return {'donors': donors_log, 'recipients': recipients_log, 'total_moved': coverable, 'uncovered_deficit': uncovered}

    @staticmethod
    @transaction.atomic
    def surplus_sweep(user, month, year):
        """
        Varredura de excedentes: categorias cujo available > ceiling_value (ceiling > 0)
        têm o excesso removido do MonthlyBudget, devolvendo-o ao pool RTA.

        Retorna dict com categorias varridas e total devolvido ao RTA.
        """
        from .models import Category, MonthlyBudget

        states = YNABBudgetService.calculate_envelope_states(user, month, year)
        envelopes = states['envelope_states']

        cats = {c.id: c for c in Category.objects.filter(
            user=user, parent__isnull=False, ceiling_value__gt=Decimal('0.00')
        )}

        swept = {}
        total_swept = Decimal('0.00')

        for cat_id, cat in cats.items():
            env = envelopes.get(cat_id)
            if not env:
                continue
            available = env['available']
            if available > cat.ceiling_value:
                excess = available - cat.ceiling_value
                mb = MonthlyBudget.objects.filter(category_id=cat_id, month=month, year=year).first()
                if mb and mb.amount > Decimal('0.00'):
                    reduction = min(excess, mb.amount)
                    mb.amount -= reduction
                    mb.save()
                    swept[cat_id] = {'name': cat.name, 'excess_removed': reduction}
                    total_swept += reduction

        return {'swept_categories': swept, 'total_returned_to_rta': total_swept}

    @staticmethod
    @transaction.atomic
    def month_end_cascade(user, current_month, current_year, target_category_id):
        """
        Cascata de fim de mês: categorias voláteis (com ceiling_value definido, interpretadas
        como não-acumulativas) têm seu saldo remanescente transferido 100% para a
        target_category_id.

        Retorna dict com categorias drenadas e total transferido.
        """
        from .models import Category, MonthlyBudget

        states = YNABBudgetService.calculate_envelope_states(user, current_month, current_year)
        envelopes = states['envelope_states']

        # Categorias voláteis: possuem ceiling_value > 0 (interpretadas como "não acumulam")
        volatile_cats = Category.objects.filter(
            user=user, parent__isnull=False, ceiling_value__gt=Decimal('0.00')
        ).exclude(id=target_category_id)

        drained = {}
        total_flushed = Decimal('0.00')

        for cat in volatile_cats:
            env = envelopes.get(cat.id)
            if not env:
                continue
            available = env['available']
            if available > Decimal('0.00'):
                # Reduz o MonthlyBudget desta categoria
                mb = MonthlyBudget.objects.filter(category=cat, month=current_month, year=current_year).first()
                if mb:
                    drain = min(available, mb.amount)
                    if drain > Decimal('0.00'):
                        mb.amount -= drain
                        mb.save()
                        drained[cat.id] = {'name': cat.name, 'flushed': drain}
                        total_flushed += drain

        # Deposita tudo na categoria alvo
        if total_flushed > Decimal('0.00'):
            target_mb, _ = MonthlyBudget.objects.get_or_create(
                category_id=target_category_id, month=current_month, year=current_year,
                defaults={'amount': Decimal('0.00')}
            )
            target_mb.amount += total_flushed
            target_mb.save()

        target_cat = Category.objects.filter(id=target_category_id).first()
        return {
            'drained_categories': drained,
            'target_category': target_cat.name if target_cat else str(target_category_id),
            'total_transferred': total_flushed,
        }


class DebtorPaymentService:
    @staticmethod
    @transaction.atomic
    def pay_subaccount_group(debtor_id, subaccount_id, payment_amount):
        from .models import Debtor, DebtItem, Account, Transaction as CoreTransaction
        from django.utils import timezone
        from decimal import Decimal

        debtor = Debtor.objects.get(pk=debtor_id)
        subaccount = Account.objects.get(pk=subaccount_id)
        payment_amount_dec = Decimal(str(payment_amount))

        # 1. Inject the incoming payment_amount directly back into the targeted SubAccount
        CoreTransaction.objects.create(
            account=subaccount,
            amount=payment_amount_dec,
            is_income=True,
            description=f"Pagamento de dívida - {debtor.name}",
            date=timezone.now().date(),
            status='realized'
        )

        # 2. Fetch all DebtItem records matching debtor_id AND subaccount_id where status in ['PENDING', 'PARTIAL'] ordered chronologically
        items = DebtItem.objects.filter(
            debtor_id=debtor_id,
            origin_subaccount_id=subaccount_id,
            status__in=['PENDING', 'PARTIAL']
        ).order_by('date_created', 'id')

        # 3. Process through these items using strict FIFO
        remaining = payment_amount_dec
        for item in items:
            if remaining <= Decimal('0.00'):
                break
            due = item.total_amount - item.paid_amount
            if remaining >= due:
                item.paid_amount = item.total_amount
                item.status = 'SETTLED'
                remaining -= due
            else:
                item.paid_amount += remaining
                item.status = 'PARTIAL'
                remaining = Decimal('0.00')
            item.save()

        return {'status': 'success', 'remaining_unallocated': remaining}


class DebtorCreationService:
    @staticmethod
    @transaction.atomic
    def register_itemized_debts(debtor_id, subaccount_id, items_payload):
        from .models import Debtor, DebtItem, Account
        from decimal import Decimal

        debtor = Debtor.objects.get(pk=debtor_id)
        subaccount = Account.objects.get(pk=subaccount_id)  # Validate that the subaccount exists

        created_items = []
        for item in items_payload:
            prod_name = item.get('product_name')
            total = Decimal(str(item.get('total_amount')))
            
            debt_item = DebtItem.objects.create(
                debtor=debtor,
                origin_subaccount=subaccount,
                product_name=prod_name,
                total_amount=total,
                paid_amount=Decimal('0.00'),
                status='PENDING'
            )
            created_items.append(debt_item)
            
        return created_items


class DebtItemMutationService:
    @staticmethod
    @transaction.atomic
    def update_debt_item(debt_item_id, origin_subaccount_id=None, total_amount=None):
        from .models import DebtItem, Account
        from decimal import Decimal

        item = DebtItem.objects.select_for_update().get(pk=debt_item_id)
        old_subaccount = item.origin_subaccount
        old_total_amount = item.total_amount

        # Update subaccount if provided
        if origin_subaccount_id is not None:
            new_subaccount = Account.objects.get(pk=origin_subaccount_id)
        else:
            new_subaccount = old_subaccount

        # Update total amount if provided
        if total_amount is not None:
            new_total_amount = Decimal(str(total_amount))
        else:
            new_total_amount = old_total_amount

        # Atomic Rebalancing
        if new_subaccount != old_subaccount:
            old_subaccount.balance = Decimal(str(old_subaccount.balance)) - old_total_amount
            old_subaccount.save()

            new_subaccount.balance = Decimal(str(new_subaccount.balance)) + new_total_amount
            new_subaccount.save()
        elif new_total_amount != old_total_amount:
            new_subaccount.balance = Decimal(str(new_subaccount.balance)) - old_total_amount + new_total_amount
            new_subaccount.save()

        item.origin_subaccount = new_subaccount
        item.total_amount = new_total_amount
        item.save()
        return item

    @staticmethod
    @transaction.atomic
    def delete_debt_item(debt_item_id):
        from .models import DebtItem
        from decimal import Decimal

        item = DebtItem.objects.select_for_update().get(pk=debt_item_id)
        subaccount = item.origin_subaccount
        
        # Remove financial weight
        subaccount.balance = Decimal(str(subaccount.balance)) - item.total_amount
        subaccount.save()
        
        item.delete()




