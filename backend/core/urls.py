from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, CategoryViewSet, TransactionViewSet, GoalViewSet, 
    MonthlyBudgetViewSet, ping, UpdateProfileView, ChangePasswordView,
    TwoFactorSetupView, TwoFactorVerifyView, TwoFactorDisableView, TwoFactorLoginView,
    IconUploadView
)

# O Router do DRF cria automaticamente as rotas GET, POST, PUT, DELETE
router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'monthly-budgets', MonthlyBudgetViewSet, basename='monthly-budget')

urlpatterns = [
    path('icons/upload/', IconUploadView.as_view(), name='account-upload-icon'),
    path('', include(router.urls)),
    path('ping/', ping, name='ping'),
    path('auth/profile/update/', UpdateProfileView.as_view(), name='profile-update'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='password-change'),
    path('auth/2fa/setup/', TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('auth/2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('auth/2fa/disable/', TwoFactorDisableView.as_view(), name='2fa-disable'),
    path('auth/2fa/login/', TwoFactorLoginView.as_view(), name='2fa-login'),
]


