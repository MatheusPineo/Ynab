import logging
from celery import shared_task
from django.utils import timezone
from .models import TransactionInbox
from .ai_services import AIExtractionService

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_inbox_document(self, inbox_id):
    """
    Tarefa assíncrona do Celery para processar um documento da caixa de entrada (inbox).
    Altera o status do item para 'processing', invoca a API do Gemini 1.5 Flash
    para extração multimodal estruturada e atualiza os resultados no banco de dados.
    """
    logger.info(f"[Celery] Iniciando processamento do TransactionInbox ID: {inbox_id}")
    
    try:
        # 1. Carrega o registro do banco de dados
        inbox = TransactionInbox.objects.get(id=inbox_id)
        
        # 2. Transiciona o status para processing
        inbox.status = 'processing'
        inbox.save(update_fields=['status', 'updated_at'])
        logger.info(f"[Celery] Status do TransactionInbox {inbox_id} atualizado para processing.")
        
        # 3. Invoca o serviço de inteligência artificial
        ai_service = AIExtractionService()
        if inbox.file:
            suggestions = ai_service.extract_receipt_data(inbox.file.path)
        elif inbox.ai_suggestions and 'raw_text' in inbox.ai_suggestions:
            suggestions = ai_service.extract_notification_data(inbox.ai_suggestions['raw_text'])
        else:
            raise ValueError("O registro do TransactionInbox não possui um arquivo nem texto de notificação para análise.")
        
        # 4. Grava os resultados estruturados e transiciona o status para ready
        inbox.ai_suggestions = suggestions
        inbox.status = 'ready'
        inbox.processed_at = timezone.now()
        inbox.save(update_fields=['status', 'ai_suggestions', 'processed_at', 'updated_at'])
        
        logger.info(f"[Celery] Processamento concluído com sucesso para o TransactionInbox {inbox_id}.")
        
    except TransactionInbox.DoesNotExist:
        logger.error(f"[Celery] Erro crítico: TransactionInbox ID {inbox_id} não foi encontrado no banco de dados.")
        raise
        
    except Exception as e:
        logger.exception(f"[Celery] Falha durante o processamento do TransactionInbox ID {inbox_id}: {str(e)}")
        # Em caso de qualquer erro imprevisto, marca o item como failed
        try:
            inbox = TransactionInbox.objects.get(id=inbox_id)
            inbox.status = 'failed'
            inbox.error_message = f"Erro na fila assíncrona: {str(e)}"
            inbox.save(update_fields=['status', 'error_message', 'updated_at'])
        except Exception:
            pass
        raise self.retry(exc=e, countdown=5)

