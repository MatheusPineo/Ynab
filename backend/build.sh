#!/usr/bin/env bash
# Sair se houver erro
set -o errexit

# Instalar dependências
pip install -r requirements.txt

# Coletar arquivos estáticos
python manage.py collectstatic --no-input

# Aplicar migrações ao banco de dados
python manage.py migrate

# Sincronizar dados do mercado (BCB/B3) para cálculos de rentabilidade
python manage.py sync_market_data
