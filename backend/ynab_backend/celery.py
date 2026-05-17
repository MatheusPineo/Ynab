import os
from celery import Celery

# Define o Django settings padrão do Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')

app = Celery('ynab_backend')

# Configura o Celery usando as configurações do settings com o prefixo 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-detecta tarefas (tasks.py) em todos os apps registrados no INSTALLED_APPS
app.autodiscover_tasks()
