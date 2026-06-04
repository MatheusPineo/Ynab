import posthog from "posthog-js";

/**
 * Envia uma exceção capturada (em blocos try/catch) explicitamente para o PostHog.
 * Garante compatibilidade tanto com navegadores quanto com Capacitor nativo.
 */
export function trackHandledException(error: unknown, context?: Record<string, any>) {
  try {
    if (typeof window !== "undefined" && posthog && typeof posthog.captureException === "function") {
      const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error));
      posthog.captureException(err, { extra: context });
    }
  } catch (phError) {
    console.error("Falha ao registrar exceção tratada no PostHog:", phError);
  }
}

/**
 * Registra falhas de validação de formulário no PostHog para analisar gargalos de UX.
 */
export function trackFormValidationFailure(formId: string, fieldName: string, errorMessage: string) {
  try {
    if (typeof window !== "undefined" && posthog && typeof posthog.capture === "function") {
      posthog.capture("form_validation_failed", {
        form_id: formId,
        field_name: fieldName,
        error_message: errorMessage,
      });
    }
  } catch (phError) {
    console.error("Falha ao registrar falha de validação de formulário no PostHog:", phError);
  }
}
