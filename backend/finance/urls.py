from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, CategoryViewSet, TransactionViewSet, GoalViewSet, 
    MonthlyBudgetViewSet, IconUploadView, DistributionTemplateViewSet, 
    DebtViewSet, DebtPaymentViewSet, ResetDataView, CreditCardViewSet
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'monthly-budgets', MonthlyBudgetViewSet, basename='monthly-budget')
router.register(r'distribution-templates', DistributionTemplateViewSet, basename='distribution-template')
router.register(r'debts', DebtViewSet, basename='debt')
router.register(r'debt-payments', DebtPaymentViewSet, basename='debt-payment')
router.register(r'credit-cards', CreditCardViewSet, basename='credit-card')

urlpatterns = [
    path('icons/upload/', IconUploadView.as_view(), name='account-upload-icon'),
    path('auth/profile/reset-data/', ResetDataView.as_view(), name='profile-reset-data'),
    path('', include(router.urls)),
]
