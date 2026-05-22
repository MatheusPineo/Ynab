import json
import requests
from datetime import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from finance.models import DailyCDIRate

class Command(BaseCommand):
    help = 'Sincroniza os dados do CDI (via BCB SGS 4389)'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando sincronização de dados de mercado...")
        
        try:
            self.stdout.write("Buscando CDI no Banco Central (SGS 4389)...")
            # Buscando desde 01/01/2024 para garantir o histórico passado
            url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados?formato=json&dataInicial=01/01/2024&dataFinal=31/12/2026"
            response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
            response.raise_for_status()
            
            data = response.json()
            count_cdi = 0
            for item in data:
                item_date = datetime.strptime(item['data'], "%d/%m/%Y").date()
                annual_rate = Decimal(str(item['valor']))
                
                obj, created = DailyCDIRate.objects.update_or_create(
                    date=item_date,
                    defaults={'annual_rate': annual_rate}
                )
                if created:
                    count_cdi += 1
                    
            self.stdout.write(self.style.SUCCESS(f"Sucesso! {count_cdi} novas taxas CDI adicionadas."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro ao buscar CDI no BCB: {e}"))

        self.stdout.write(self.style.SUCCESS("Processo de sincronização concluído."))
