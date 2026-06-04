import posthog from "posthog-js";

/**
 * Valida uma invariante lógica de negócios. Se a condição for falsa,
 * envia silenciosamente um alerta ao PostHog sem travar a aplicação.
 */
export function assertBusinessLogic(condition: boolean, anomalyName: string, context: Record<string, any>) {
  if (!condition) {
    console.warn(`[Business Invariant] Anomaly detected: ${anomalyName}`, context);
    try {
      if (typeof window !== "undefined" && posthog && typeof posthog.capture === "function") {
        posthog.capture("business_logic_anomaly", {
          anomaly_name: anomalyName,
          ...context,
        });
      }
    } catch (phError) {
      console.error("Falha ao registrar invariante de negócios no PostHog:", phError);
    }
  }
}
