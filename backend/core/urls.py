from django.urls import path
from .views import (
    ping, UpdateProfileView, ChangePasswordView,
    TwoFactorSetupView, TwoFactorVerifyView, TwoFactorDisableView, TwoFactorLoginView
)

urlpatterns = [
    path('ping/', ping, name='ping'),
    path('auth/profile/update/', UpdateProfileView.as_view(), name='profile-update'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='password-change'),
    path('auth/2fa/setup/', TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('auth/2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('auth/2fa/disable/', TwoFactorDisableView.as_view(), name='2fa-disable'),
    path('auth/2fa/login/', TwoFactorLoginView.as_view(), name='2fa-login'),
]
