import datetime
from django.test import TestCase
from finance.brazilian_fixed_income import BrazilianFixedIncomeEngine

class BrazilianFixedIncomeEngineTests(TestCase):
    def test_business_days_2026(self):
        start = datetime.date(2026, 1, 1)
        end = datetime.date(2026, 12, 31)
        # Feriados de 2026:
        # 01/01 (Qui), 16/02 (Seg - Carnaval), 17/02 (Ter - Carnaval), 03/04 (Sex - Paixão)
        # 21/04 (Ter), 01/05 (Sex), 04/06 (Qui - Corpus), 07/09 (Seg), 12/10 (Seg)
        # 02/11 (Seg), 15/11 (Dom - já descontado final de semana), 20/11 (Sex), 25/12 (Sex)
        # Sábados e Domingos são ~104 no ano.
        # Dias corridos em 2026 (não bissexto) = 365, do 01/01 ao 31/12 dá 364 dias de intervalo no python.
        # Vamos apenas checar se exclui final de semana perfeitamente num espaço curto
        start_short = datetime.date(2026, 4, 1) # Quarta
        end_short = datetime.date(2026, 4, 30) # 29 dias depois
        # Neste período temos 21/04 (Feriado Tiradentes - Terça) e 03/04 (Sexta Santa)
        # Total dias = 29. Finais de semana: 4 e 5, 11 e 12, 18 e 19, 25 e 26 (8 dias)
        # Feriados de semana = 2 (03/04 e 21/04)
        # Úteis = 29 - 8 - 2 = 19
        b_days = BrazilianFixedIncomeEngine.get_business_days(start_short, end_short)
        self.assertEqual(b_days, 19)

    def test_ir_rates(self):
        self.assertEqual(BrazilianFixedIncomeEngine.calculate_ir_rate(100), 0.225)
        self.assertEqual(BrazilianFixedIncomeEngine.calculate_ir_rate(200), 0.20)
        self.assertEqual(BrazilianFixedIncomeEngine.calculate_ir_rate(400), 0.175)
        self.assertEqual(BrazilianFixedIncomeEngine.calculate_ir_rate(800), 0.15)

    def test_net_yield_iof(self):
        # 10 dias corridos = IOF deve ser 0.66 (de acordo com tabela: índice 9 -> dia 10)
        start = datetime.date(2026, 1, 1) # Feriado
        end = datetime.date(2026, 1, 11) # 10 dias
        # Úteis entre 01/01 (Qui) e 11/01 (Dom) = 02, 05, 06, 07, 08, 09 = 6 dias úteis.
        
        principal = 10000.0
        # Vamos supor 10% a.a (0.10) e 100% CDI
        res = BrazilianFixedIncomeEngine.calculate_net_yield(principal, start, end, 0.10, 1.0)
        
        self.assertEqual(res['calendar_days'], 10)
        self.assertEqual(res['business_days'], 6)
        
        # Testando no dia 35, IOF deve ser zero.
        end_35 = datetime.date(2026, 2, 5) # 35 dias
        res_35 = BrazilianFixedIncomeEngine.calculate_net_yield(principal, start, end_35, 0.10, 1.0)
        self.assertEqual(res_35['iof_amount'], 0.0)
        self.assertTrue(res_35['net_profit'] > 0.0)
        self.assertEqual(res_35['calendar_days'], 35)
