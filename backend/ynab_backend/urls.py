"""
URL configuration for ynab_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import MyTokenObtainPairView, RegisterView, GoogleLoginView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from django.views.static import serve

from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
import os
import requests

def debug_key_view(request):
    env_key = os.environ.get('GEMINI_API_KEY', '')
    settings_key = getattr(settings, 'GEMINI_API_KEY', '')
    test_status = None
    test_response_body = None
    if env_key:
        test_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={env_key}"
        test_payload = {
            "contents": [{"parts": [{"text": "Diga OK."}]}]
        }
        try:
            res = requests.post(test_url, json=test_payload, headers={"Content-Type": "application/json"}, timeout=10)
            test_status = res.status_code
            try:
                test_response_body = res.json()
            except Exception:
                test_response_body = res.text
        except Exception as test_err:
            test_status = "Erro de Conexão"
            test_response_body = str(test_err)

    return JsonResponse({
        "env_key_configured": bool(env_key),
        "env_key_length": len(env_key),
        "env_key_prefix": env_key[:5] if env_key else "",
        "env_key_suffix": env_key[-5:] if env_key else "",
        "settings_key_configured": bool(settings_key),
        "settings_key_length": len(settings_key),
        "settings_key_prefix": settings_key[:5] if settings_key else "",
        "settings_key_suffix": settings_key[-5:] if settings_key else "",
        "gemini_test_status": test_status,
        "gemini_test_response": test_response_body
    })

urlpatterns = [
    path('api/debug-key/', debug_key_view),
    # OpenAPI / Swagger Endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('api/register', RegisterView.as_view()), # Fallback sem barra
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')), # Conecta as rotas do app core no prefixo /api/
    path('api/', include('finance.urls')), # Conecta as rotas do app finance no prefixo /api/
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

