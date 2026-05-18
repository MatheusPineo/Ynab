import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ynab_backend.settings')
django.setup()

from django.contrib.auth.models import User

user = User.objects.get(username='matheuskrx@gmail.com')
user.set_password('password123')
user.save()
print("PASSWORD RESET SUCCESSFUL FOR matheuskrx@gmail.com!")
