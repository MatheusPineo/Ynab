import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT * FROM core_debt;")
print("Debts:", cursor.fetchall())
cursor.execute("SELECT * FROM auth_user;")
print("Users:", cursor.fetchall())
