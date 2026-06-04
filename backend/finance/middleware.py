from django.utils.deprecation import MiddlewareMixin
import posthog
import logging
import traceback

logger = logging.getLogger(__name__)

class TelemetryExceptionMiddleware(MiddlewareMixin):
    """
    Middleware personalizado para interceptar exceções não tratadas no Django
    e enviá-las para o PostHog para monitoramento de erros do backend.
    """
    def process_exception(self, request, exception):
        try:
            # Identificação do usuário
            distinct_id = str(request.user.id) if hasattr(request, 'user') and request.user.is_authenticated else "anonymous"
            
            # Obtenção do stack trace formatado
            stack_trace = "".join(traceback.format_exception(type(exception), exception, exception.__traceback__))
            
            # Envia o evento de exceção capturado para o PostHog
            posthog.capture(
                distinct_id=distinct_id,
                event="backend_exception",
                properties={
                    "path": request.path,
                    "method": request.method,
                    "exception_type": type(exception).__name__,
                    "exception_message": str(exception),
                    "stack_trace": stack_trace,
                }
            )
        except Exception as e:
            logger.error(f"Falha ao enviar exceção para o PostHog: {e}")
        return None
