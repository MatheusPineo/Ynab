import datetime
from decimal import Decimal, ROUND_HALF_UP

class BrazilianFixedIncomeEngine:
    """
    Motor matemático de Renda Fixa Brasileira.
    Inclui cálculos de Dias Úteis (Base 252), Feriados Nacionais e impostos regressivos (IOF e IR).
    """

    # Tabela regressiva de IOF para resgates antes de 30 dias. Índice 0 = Dia 1.
    IOF_TABLE = [
        0.96, 0.93, 0.90, 0.86, 0.83, 0.80, 0.76, 0.73, 0.70, 0.66,
        0.63, 0.60, 0.56, 0.53, 0.50, 0.46, 0.43, 0.40, 0.36, 0.33,
        0.30, 0.26, 0.23, 0.20, 0.16, 0.13, 0.10, 0.06, 0.03, 0.00
    ]

    @staticmethod
    def get_easter_date(year: int) -> datetime.date:
        """Calcula o dia da Páscoa (Algoritmo de Meeus/Jones/Butcher)."""
        a = year % 19
        b = year // 100
        c = year % 100
        d = b // 4
        e = b % 4
        f = (b + 8) // 25
        g = (b - f + 1) // 3
        h = (19 * a + b - d - g + 15) % 30
        i = c // 4
        k = c % 4
        l = (32 + 2 * e + 2 * i - h - k) % 7
        m = (a + 11 * h + 22 * l) // 451
        month = (h + l - 7 * m + 114) // 31
        day = ((h + l - 7 * m + 114) % 31) + 1
        return datetime.date(year, month, day)

    @staticmethod
    def get_brazilian_holidays(year: int) -> set:
        """Retorna um conjunto de datas (datetime.date) de todos os feriados nacionais."""
        holidays = {
            datetime.date(year, 1, 1),   # Confraternização Universal
            datetime.date(year, 4, 21),  # Tiradentes
            datetime.date(year, 5, 1),   # Dia do Trabalhador
            datetime.date(year, 9, 7),   # Independência do Brasil
            datetime.date(year, 10, 12), # Nossa Senhora Aparecida
            datetime.date(year, 11, 2),  # Finados
            datetime.date(year, 11, 15), # Proclamação da República
            datetime.date(year, 11, 20), # Dia da Consciência Negra (Feriado Nacional a partir de 2024)
            datetime.date(year, 12, 25)  # Natal
        }
        
        easter = BrazilianFixedIncomeEngine.get_easter_date(year)
        # Feriados Móveis
        carnaval_tuesday = easter - datetime.timedelta(days=47)
        carnaval_monday = easter - datetime.timedelta(days=48)
        good_friday = easter - datetime.timedelta(days=2)
        corpus_christi = easter + datetime.timedelta(days=60)
        
        holidays.update([carnaval_monday, carnaval_tuesday, good_friday, corpus_christi])
        return holidays

    @staticmethod
    def get_business_days(start_date: datetime.date, end_date: datetime.date) -> int:
        """
        Calcula dias úteis entre start_date (inclusivo) e end_date (exclusivo) base 252.
        Exclui finais de semana e feriados nacionais.
        """
        if start_date >= end_date:
            return 0
            
        business_days = 0
        current_date = start_date
        
        # Cache de feriados por ano
        holidays_by_year = {}
        
        while current_date < end_date:
            # Pula final de semana
            if current_date.weekday() >= 5:
                current_date += datetime.timedelta(days=1)
                continue
                
            year = current_date.year
            if year not in holidays_by_year:
                holidays_by_year[year] = BrazilianFixedIncomeEngine.get_brazilian_holidays(year)
                
            if current_date not in holidays_by_year[year]:
                business_days += 1
                
            current_date += datetime.timedelta(days=1)
            
        return business_days

    @staticmethod
    def calculate_ir_rate(calendar_days: int) -> float:
        """Tabela Regressiva de Imposto de Renda."""
        if calendar_days <= 180:
            return 0.225
        elif calendar_days <= 360:
            return 0.20
        elif calendar_days <= 720:
            return 0.175
        return 0.15

    @staticmethod
    def calculate_iof_rate(calendar_days: int) -> float:
        """Tabela Regressiva de IOF (Zera no 30º dia)."""
        if calendar_days >= 30 or calendar_days <= 0:
            return 0.0
        return BrazilianFixedIncomeEngine.IOF_TABLE[calendar_days - 1]

    @staticmethod
    def calculate_net_yield(principal: float, start_date: datetime.date, current_date: datetime.date, annual_rate: float, percent_cdi: float = 1.0) -> dict:
        """
        Calcula o rendimento bruto e líquido de um ativo pós-fixado aplicando
        juros compostos por dias úteis, e deduzindo IOF e IR regressivo.
        
        Args:
            principal (float): Valor aportado inicialmente.
            start_date (date): Data da aplicação.
            current_date (date): Data de resgate ou cálculo.
            annual_rate (float): Taxa CDI anual. Ex: 0.105 (10.5%).
            percent_cdi (float): % da taxa. Ex: 1.10 (110% do CDI).
            
        Returns: dict com lucro bruto, taxas e lucro líquido final.
        """
        if start_date >= current_date:
            return {
                'gross_value': principal,
                'gross_profit': 0.0,
                'iof_amount': 0.0,
                'ir_amount': 0.0,
                'net_profit': 0.0,
                'net_value': principal,
                'business_days': 0,
                'calendar_days': 0
            }

        business_days = BrazilianFixedIncomeEngine.get_business_days(start_date, current_date)
        calendar_days = (current_date - start_date).days

        # Juros Compostos Base 252
        # Fator diário = (1 + annual_rate)^(1/252) - 1
        effective_annual_rate = annual_rate * percent_cdi
        gross_value = principal * ((1 + effective_annual_rate) ** (business_days / 252))
        gross_profit = gross_value - principal

        # Deduz IOF
        iof_rate = BrazilianFixedIncomeEngine.calculate_iof_rate(calendar_days)
        iof_amount = gross_profit * iof_rate
        base_ir = gross_profit - iof_amount

        # Deduz IR
        ir_rate = BrazilianFixedIncomeEngine.calculate_ir_rate(calendar_days)
        ir_amount = base_ir * ir_rate

        net_profit = gross_profit - iof_amount - ir_amount
        net_value = principal + net_profit

        return {
            'gross_value': round(gross_value, 2),
            'gross_profit': round(gross_profit, 2),
            'iof_amount': round(iof_amount, 2),
            'ir_amount': round(ir_amount, 2),
            'net_profit': round(net_profit, 2),
            'net_value': round(net_value, 2),
            'business_days': business_days,
            'calendar_days': calendar_days
        }
