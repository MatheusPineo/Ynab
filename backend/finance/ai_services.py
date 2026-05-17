import os
import base64
import logging
import time
import mimetypes
from datetime import date
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class AIExtractionService:
    """
    Serviço utilitário altamente defensivo para realizar extração inteligente e multimodal
    de faturas, notas fiscais e recibos utilizando a API do Google Gemini 1.5 Flash.
    Usa a funcionalidade de Structured Outputs (JSON Schema Estrito) para garantir
    que a API do Gemini retorne apenas o JSON estruturado esperado.
    """

    def __init__(self, api_key: str = None) -> None:
        # Recupera a chave das configurações do Django ou de variável de ambiente
        self.api_key = api_key or getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    def get_fallback_data(self, merchant_name: str = "Erro na Extração") -> dict:
        """Retorna uma estrutura padrão defensiva de fallback com suporte a múltiplas transações."""
        return {
            "transactions": [
                {
                    "amount": None,
                    "date": str(date.today()),
                    "merchant": merchant_name,
                    "currency": "BRL",
                    "approved": False
                }
            ]
        }

    def extract_receipt_data(self, file_path: str, mime_type: str = None) -> dict:
        """
        Recebe o caminho físico de um arquivo de recibo ou nota fiscal, codifica-o em Base64,
        deduz seu MIME type dinamicamente e faz uma requisição HTTP POST robusta para o Gemini 1.5 Flash.
        """
        if not self.api_key:
            logger.warning("[AI Service] Gemini API Key não configurada. Utilizando resposta padrão de fallback.")
            return self.get_fallback_data("Sem Chave API")

        if not os.path.exists(file_path):
            logger.error(f"[AI Service] Arquivo físico não encontrado em: {file_path}")
            return self.get_fallback_data("Arquivo não Encontrado")

        try:
            # 1. Determinar o tipo MIME dinamicamente se não fornecido
            if not mime_type:
                mime_type, _ = mimetypes.guess_type(file_path)
                if not mime_type:
                    mime_type = 'image/jpeg'  # fallback clássico

            logger.info(f"[AI Service] Preparando upload do arquivo: {file_path} (MIME: {mime_type})")

            # 2. Ler arquivo e codificar em Base64
            with open(file_path, 'rb') as f:
                file_bytes = f.read()
                base64_data = base64.b64encode(file_bytes).decode('utf-8')

            # 3. Construir o payload JSON de chamada do Gemini 1.5 Flash com Structured Outputs
            system_prompt = (
                "You are an advanced, professional financial document parser designed to extract transactional metadata "
                "from receipts, bills, invoices, notifications, and purchase confirmations. Your job is to analyze the document image or PDF "
                "and identify all transactions (e.g. payments, purchases, debit notifications). If the document contains multiple transactions "
                "(for example, a screenshot with multiple bank or payment app notifications), you must extract EACH of them as a separate item "
                "in the 'transactions' array. If there is only a single transaction, return it as a list of size 1 in the 'transactions' array. "
                "Never include markdown formatting, backticks, or extra conversational text in your response."
            )

            prompt_text = (
                "Please extract all transactions from this financial document and return them inside the 'transactions' array. "
                "Each transaction item in the list must contain: "
                "1. Total transaction amount as a numeric float value. "
                "2. Transaction date formatted strictly as YYYY-MM-DD. "
                "3. Official merchant, business or store name (e.g. Uber, Amazon, McDonald's). "
                "4. Currency code in ISO 4217 format (e.g. BRL, USD, EUR, GBP)."
            )

            schema = {
                "type": "OBJECT",
                "properties": {
                    "transactions": {
                        "type": "ARRAY",
                        "description": "List of transactions identified in the document/image. If there is only one transaction, return a list with one item.",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "amount": {
                                    "type": "NUMBER",
                                    "description": "Transaction amount as a numeric float value (e.g., 1.89). Null if missing."
                                },
                                "date": {
                                    "type": "STRING",
                                    "description": "Transaction date formatted strictly as YYYY-MM-DD. Use today's date if missing."
                                },
                                "merchant": {
                                    "type": "STRING",
                                    "description": "Official store, supplier, or merchant name. 'Desconhecido' if missing."
                                },
                                "currency": {
                                    "type": "STRING",
                                    "description": "3-letter ISO 4217 currency code (e.g., EUR, BRL, USD). Default to BRL if missing."
                                }
                            },
                            "required": ["amount", "date", "merchant", "currency"]
                        }
                    }
                },
                "required": ["transactions"]
            }

            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt_text},
                            {
                                "inlineData": {
                                    "mimeType": mime_type,
                                    "data": base64_data
                                }
                            }
                        ]
                    }
                ],
                "systemInstruction": {
                    "parts": [
                        {"text": system_prompt}
                    ]
                },
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "responseSchema": schema,
                    "temperature": 0.1
                }
            }

            # 4. Enviar a requisição POST com retentativas inteligentes (Exponential Backoff) se receber 429
            url = f"{self.api_url}?key={self.api_key}"
            headers = {"Content-Type": "application/json"}
            
            max_retries = 3
            timeout_seconds = 15
            current_delay = 2

            for attempt in range(1, max_retries + 1):
                try:
                    logger.info(f"[AI Service] Enviando requisição para o Gemini (Tentativa {attempt}/{max_retries})...")
                    response = requests.post(url, json=payload, headers=headers, timeout=timeout_seconds)
                    
                    # Se receber limite de taxa (Rate Limit 429), aplica backoff exponencial
                    if response.status_code == 429:
                        logger.warning(f"[AI Service] Limite de requisições excedido (429). Aguardando {current_delay}s...")
                        time.sleep(current_delay)
                        current_delay *= 2
                        continue

                    # Lança exceção para qualquer outro status de erro HTTP
                    response.raise_for_status()

                    # Processa a resposta bem-sucedida do Gemini
                    result_json = response.json()
                    
                    # Navega na estrutura de resposta do Gemini
                    # candidates -> content -> parts -> text
                    candidates = result_json.get('candidates', [])
                    if not candidates:
                        logger.error("[AI Service] Resposta sem candidatos retornada pelo Gemini.")
                        return self.get_fallback_data("Sem Candidatos")

                    content_parts = candidates[0].get('content', {}).get('parts', [])
                    if not content_parts or 'text' not in content_parts[0]:
                        logger.error("[AI Service] Resposta estruturada vazia ou sem texto retornado pelo Gemini.")
                        return self.get_fallback_data("Texto Vazio")

                    raw_text = content_parts[0]['text'].strip()
                    logger.info(f"[AI Service] Retorno bruto da extração da IA: {raw_text}")

                    # Como especificamos structured output, o raw_text deve ser estritamente o JSON esperado
                    import json
                    parsed_suggestions = json.loads(raw_text)
                    
                    # Sanitização final defensiva para garantir chaves obrigatórias
                    transactions = []
                    for tx in parsed_suggestions.get("transactions", []):
                        transactions.append({
                            "amount": tx.get("amount"),
                            "date": tx.get("date"),
                            "merchant": tx.get("merchant", "Desconhecido"),
                            "currency": tx.get("currency", "BRL"),
                            "approved": False
                        })
                        
                    if not transactions:
                        fallback_tx = self.get_fallback_data("Desconhecido")["transactions"][0]
                        transactions = [fallback_tx]
                        
                    return {"transactions": transactions}

                except requests.exceptions.HTTPError as he:
                    logger.error(f"[AI Service] Erro HTTP na tentativa {attempt}: {str(he)}")
                    if attempt == max_retries:
                        raise
                except requests.exceptions.Timeout as te:
                    logger.error(f"[AI Service] Timeout na tentativa {attempt}: {str(te)}")
                    if attempt == max_retries:
                        raise
                except Exception as e:
                    logger.error(f"[AI Service] Erro imprevisto na tentativa {attempt}: {str(e)}")
                    if attempt == max_retries:
                        raise
                    
                time.sleep(1)

        except Exception as e:
            logger.exception(f"[AI Service] Falha catastrófica ao extrair dados com o Gemini: {str(e)}")
            return self.get_fallback_data("Erro na Fila de Extração")

        return self.get_fallback_data("Limite Excedido")
