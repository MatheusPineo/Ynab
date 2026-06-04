from datetime import date, datetime, timedelta
import calendar
from decimal import Decimal
from django.db.models import Sum, Q, Count
from django.db.models.functions import TruncMonth, TruncDay
from .models import Transaction, Account, Category, CreditCardTransaction

class ReportEngine:
    @staticmethod
    def get_monthly_cashflow(user, month: int, year: int):
        """
        Retorna o fluxo de caixa diário (Entradas vs Saídas) de um mês específico.
        Utiliza apenas transações com status 'realized' ou 'pending' que representem movimentação no período.
        Não gera dados se não houver transações (retorna array vazio).
        """
        start_date = date(year, month, 1)
        end_date = date(year, month, calendar.monthrange(year, month)[1])

        transactions = Transaction.objects.filter(
            account__user=user,
            date__range=(start_date, end_date),
            status='realized'
        ).annotate(
            day=TruncDay('date')
        ).values('day', 'is_income').annotate(
            total=Sum('amount')
        ).order_by('day')

        if not transactions:
            return []

        day_map = {}
        for tx in transactions:
            day_str = tx['day'].strftime("%d/%m")
            if day_str not in day_map:
                day_map[day_str] = {"name": day_str, "Entradas": Decimal('0.00'), "Saídas": Decimal('0.00')}
            
            if tx['is_income']:
                day_map[day_str]["Entradas"] += tx['total']
            else:
                day_map[day_str]["Saídas"] += tx['total']

        # Converte as Decimals para float para serialização direta e garante ordenação
        results = sorted(list(day_map.values()), key=lambda x: datetime.strptime(x["name"], "%d/%m"))
        for item in results:
            item["Entradas"] = float(item["Entradas"])
            item["Saídas"] = float(item["Saídas"])
            
        return results

    @staticmethod
    def get_expense_by_category(user, month: int, year: int):
        """
        Soma as despesas agrupadas por categoria. 
        """
        start_date = date(year, month, 1)
        end_date = date(year, month, calendar.monthrange(year, month)[1])

        expenses = Transaction.objects.filter(
            account__user=user,
            date__range=(start_date, end_date),
            is_income=False,
            status='realized'
        ).values('category__name').annotate(
            total=Sum('amount')
        ).order_by('-total')

        if not expenses:
            return []

        total_expense = sum(e['total'] for e in expenses)

        chart_data = []
        for e in expenses:
            cat_name = e['category__name'] or "Sem Categoria"
            val = e['total']
            percent = (val / total_expense) * 100 if total_expense > 0 else 0
            chart_data.append({
                "name": cat_name,
                "value": float(val),
                "percent": f"{percent:.1f}%"
            })

        high_spend_alerts = [item["name"] for item in chart_data if float(item["percent"].strip('%')) > 30.0]

        return {
            "chartData": chart_data,
            "total": float(total_expense),
            "highSpendAlerts": high_spend_alerts
        }

    @staticmethod
    def get_net_worth_evolution(user, months_back: int = 6):
        """
        Calcula a evolução do Patrimônio Líquido (Ativos - Passivos) de forma retroativa.
        Usa o saldo atual das contas e reconstrói o saldo no fim dos meses passados subtraindo as transações ocorridas após aquela data.
        """
        # Pega o saldo atual das contas
        accounts = Account.objects.filter(user=user)
        
        asset_types = ['checking', 'savings', 'cash', 'investment']
        liability_types = ['credit_card', 'debt']

        current_assets = sum(a.balance for a in accounts if a.account_type in asset_types)
        current_liabilities = sum(a.balance for a in accounts if a.account_type in liability_types)

        history = []
        now = date.today()

        # Determinar os limites das datas históricas de corte
        month_dates = []
        for i in range(months_back - 1, -1, -1):
            target_month = (now.month - 1 - i) % 12 + 1
            target_year = now.year + (now.month - 1 - i) // 12
            
            if i == 0:
                end_of_month = now
            else:
                last_day = calendar.monthrange(target_year, target_month)[1]
                end_of_month = date(target_year, target_month, last_day)
            month_dates.append((target_year, target_month, end_of_month))

        # Obter a data mais antiga de corte
        oldest_date = month_dates[0][2]

        # Fazer uma única query agrupada no banco para todas as transações após oldest_date
        all_txs_after = Transaction.objects.filter(
            account__user=user,
            date__gt=oldest_date,
            is_applied_to_balance=True
        ).values('date', 'account__account_type', 'is_income', 'amount')

        for target_year, target_month, end_of_month in month_dates:
            assets_diff = Decimal('0.00')
            liabilities_diff = Decimal('0.00')

            # Filtrar em memória as transações posteriores a end_of_month (muito rápido, sem tocar no banco)
            for tx in all_txs_after:
                if tx['date'] > end_of_month:
                    amt = tx['amount']
                    is_income = tx['is_income']
                    acc_type = tx['account__account_type']

                    if acc_type in asset_types:
                        if is_income:
                            assets_diff += amt
                        else:
                            assets_diff -= amt
                    elif acc_type in liability_types:
                        if is_income:
                            liabilities_diff += amt
                        else:
                            liabilities_diff -= amt

            past_assets = current_assets - assets_diff
            past_liabilities = current_liabilities - liabilities_diff
            net_worth = past_assets + past_liabilities

            month_abbr = calendar.month_abbr[target_month].capitalize()
            pt_months = {1:"Jan", 2:"Fev", 3:"Mar", 4:"Abr", 5:"Mai", 6:"Jun", 7:"Jul", 8:"Ago", 9:"Set", 10:"Out", 11:"Nov", 12:"Dez"}
            month_name = pt_months.get(target_month, month_abbr)

            history.append({
                "name": month_name,
                "Ativos": float(past_assets),
                "Passivos": abs(float(past_liabilities)),
                "Patrimônio Líquido": float(net_worth)
            })

        return history

    @staticmethod
    def get_credit_card_usage(user, month: int, year: int):
        """
        Retorna o uso dos cartões de crédito no mês selecionado.
        """
        start_date = date(year, month, 1)
        end_date = date(year, month, calendar.monthrange(year, month)[1])

        # Utiliza diretamente a tabela de parcelas (Installments) ou as transações matriciais de cartão.
        usage = CreditCardTransaction.objects.filter(
            credit_card__account__user=user,
            date__range=(start_date, end_date)
        ).values('credit_card__account__name').annotate(
            total=Sum('total_amount')
        )

        if not usage:
            return []

        return [
            {
                "card_name": u['credit_card__account__name'],
                "total_spent": float(u['total'])
            }
            for u in usage
        ]
