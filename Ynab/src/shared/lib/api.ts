import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { toast } from "sonner";
import posthog from "posthog-js";

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  if (!url.includes("/api") && !url.startsWith("http://localhost")) {
    url = url.replace(/\/$/, "") + "/api";
  }
  return url.replace(/\/$/, "");
};

const BASE_URL = getBaseUrl();
console.log("🚀 API Base URL configurada como:", BASE_URL);

// TRAVA DE CONCORRÊNCIA: Armazena a promessa de atualização global ativa
let activeRefreshPromise: Promise<string | null> | null = null;

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  let { accessToken } = useAuthStore.getState();

  const getHeaders = (token: string | null) => {
    const defaultHeaders: any = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    if (options.body instanceof FormData) {
      delete defaultHeaders["Content-Type"];
    }
    return defaultHeaders;
  };

  try {
    let response;
    try {
      response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: getHeaders(accessToken),
      });
    } catch (netError: any) {
      try {
        if (typeof window !== 'undefined' && posthog) {
          posthog.capture("network_failure", {
            endpoint,
            method: options.method || "GET",
            error_message: netError.message || String(netError),
            type: "cors_or_offline"
          });
        }
      } catch (phError) {
        console.error("Falha ao reportar erro de rede no PostHog:", phError);
      }
      throw netError;
    }

    // Tratamento de expiração com Fila de Espera (Lock) e sincronização com localStorage
    if (response.status === 401) {
      // Se não houver nenhuma renovação acontecendo agora, inicia a primeira
      if (!activeRefreshPromise) {
        activeRefreshPromise = useAuthStore.getState().refreshAccessToken()
          .then((token) => {
            activeRefreshPromise = null; // Libera a trava para futuras expirações
            if (token) {
              localStorage.setItem('accessToken', token);
            }
            return token;
          })
          .catch((err) => {
            activeRefreshPromise = null; // Libera a trava em caso de falha catastrófica
            throw err;
          });
      }

      // Todas as requisições paralelas paradas no 401 aguardam o término do MESMO token-refresh
      const newAccessToken = await activeRefreshPromise;

      if (newAccessToken) {
        try {
          response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: getHeaders(newAccessToken),
          });
        } catch (netError: any) {
          try {
            if (typeof window !== 'undefined' && posthog) {
              posthog.capture("network_failure", {
                endpoint,
                method: options.method || "GET",
                error_message: netError.message || String(netError),
                type: "cors_or_offline"
              });
            }
          } catch (phError) {
            console.error("Falha ao reportar erro de rede no PostHog:", phError);
          }
          throw netError;
        }
      } else {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
    }

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      let rawErrorData: any = null;
      try {
        const clonedResponse = response.clone();
        rawErrorData = await clonedResponse.json();
        errorMessage = rawErrorData.detail || rawErrorData.error || (typeof rawErrorData === 'object' && Object.keys(rawErrorData).length > 0 ? JSON.stringify(rawErrorData) : null) || errorMessage;
      } catch {
        errorMessage = `Erro de conexão com o servidor (Status ${response.status}: ${response.statusText || 'Não Encontrado'})`;
      }

      try {
        if (typeof window !== 'undefined' && posthog) {
          const sanitizedDetail = rawErrorData ? { ...rawErrorData } : { message: errorMessage };
          if (sanitizedDetail.password) sanitizedDetail.password = "[REDACTED]";
          if (sanitizedDetail.access) sanitizedDetail.access = "[REDACTED]";
          if (sanitizedDetail.refresh) sanitizedDetail.refresh = "[REDACTED]";
          if (sanitizedDetail.token) sanitizedDetail.token = "[REDACTED]";

          posthog.capture("api_failure", {
            endpoint,
            method: options.method || "GET",
            status_code: response.status,
            error_detail: JSON.stringify(sanitizedDetail)
          });
        }
      } catch (phError) {
        console.error("Falha ao reportar erro de API no PostHog:", phError);
      }

      throw new Error(errorMessage);
    }

    return response;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
}