from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, CategoryViewSet, TransactionViewSet, GoalViewSet, 
    MonthlyBudgetViewSet, IconUploadView, DistributionTemplateViewSet, 
    DebtViewSet, DebtPaymentViewSet, DebtChargeViewSet, ResetDataView, CreditCardViewSet,
    InboxUploadView, TransactionInboxViewSet, CategoryGoalViewSet, TransactionRuleViewSet,
    InvestmentAssetViewSet, InvestmentActivityViewSet, WealthSummaryView, DemoModeView,
    ReportsViewSet
)

router = DefaultRouter()
router.register(r'reports', ReportsViewSet, basename='reports')
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'monthly-budgets', MonthlyBudgetViewSet, basename='monthly-budget')
router.register(r'distribution-templates', DistributionTemplateViewSet, basename='distribution-template')
router.register(r'debts', DebtViewSet, basename='debt')
router.register(r'debt-payments', DebtPaymentViewSet, basename='debt-payment')
router.register(r'debt-charges', DebtChargeViewSet, basename='debt-charge')
router.register(r'credit-cards', CreditCardViewSet, basename='credit-card')
router.register(r'inbox', TransactionInboxViewSet, basename='inbox')
router.register(r'category-goals', CategoryGoalViewSet, basename='category-goal')
router.register(r'transaction-rules', TransactionRuleViewSet, basename='transaction-rule')
router.register(r'wealth/assets', InvestmentAssetViewSet, basename='wealth-asset')
router.register(r'wealth/activities', InvestmentActivityViewSet, basename='wealth-activity')

urlpatterns = [
    path('icons/upload/', IconUploadView.as_view(), name='account-upload-icon'),
    path('onboarding/reset/', ResetDataView.as_view(), name='onboarding-reset-data'),
    path('onboarding/demo-mode/', DemoModeView.as_view(), name='onboarding-demo-mode'),
    path('inbox/upload/', InboxUploadView.as_view(), name='inbox-bulk-upload'),
    path('wealth/summary/', WealthSummaryView.as_view(), name='wealth-summary'),
    path('', include(router.urls)),
]
