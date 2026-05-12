from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True, default="Organizando o futuro...")
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    
    # 2FA Fields
    two_factor_secret = models.CharField(max_length=32, null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    
    # Preferences
    preferred_currency = models.CharField(max_length=3, default='EUR')
    language = models.CharField(max_length=10, default='pt-BR')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_userprofile'

    def __str__(self):
        return f"Perfil de {self.user.username}"


class SupportTicket(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    name = models.CharField(max_length=150)
    email = models.EmailField()
    ticket_type = models.CharField(max_length=50)
    urgency = models.CharField(max_length=50)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    attachment = models.FileField(upload_to='support_tickets/', null=True, blank=True)
    diagnostic_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_supportticket'
        app_label = 'core'

    def __str__(self):
        return f"Ticket #{self.id or 'Novo'}: {self.subject} ({self.user.username})"
