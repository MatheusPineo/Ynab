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
    
    for i in range(1, installment_count + 1):
        bill_month = current_month
        bill_year = current_year
        
        # Obtém ou cria a Fatura
        bill, _ = CreditCardBill.objects.get_or_create(
            credit_card=credit_card,
            month=bill_month,
            year=bill_year
        )
        
        amount_part = base_installment_amount
        if i == 1:
            amount_part += remainder  # Adiciona a diferença de centavos na primeira parcela
            
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
        CoreTransaction.objects.create(
            account=expense_envelope,
            amount=installment.amount,
            description=f"Reserva YNAB: {matrix_tx.description} (Parcela {installment.number})",
            date=today,
            is_income=False,
            status='realized',
            is_applied_to_balance=True
        )
        expense_envelope.balance -= installment.amount
        expense_envelope.save()
        
        # Aloca no envelope de pagamento do cartão
        CoreTransaction.objects.create(
            account=payment_envelope,
            amount=installment.amount,
            description=f"Reserva YNAB: {matrix_tx.description} (Parcela {installment.number})",
            date=today,
            is_income=True,
            status='realized',
            is_applied_to_balance=True
        )
        payment_envelope.balance += installment.amount
        payment_envelope.save()

        # Registra a transação de despesa real sob a conta do cartão de crédito
        CoreTransaction.objects.create(
            account=credit_card.account,
            category=category,
            amount=installment.amount,
            description=f"{matrix_tx.description} (Parcela {installment.number}/{matrix_tx.installment_count})" if matrix_tx.installment_count > 1 else matrix_tx.description,
            date=matrix_tx.date,
            is_income=False,
            status='realized',
            is_applied_to_balance=True
        )
        credit_card.account.balance -= installment.amount
        credit_card.account.save()
