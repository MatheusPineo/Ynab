import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { toast } from "sonner";

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
  // Se a URL não termina com /api e não é localhost, adiciona o /api automaticamente
  if (!url.includes("/api") && !url.startsWith("http://localhost")) {
    url = url.replace(/\/$/, "") + "/api";
  }
  return url.replace(/\/$/, ""); // Retorna sem barra no final
};

const BASE_URL = getBaseUrl();
console.log("🚀 API Base URL configurada como:", BASE_URL);

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
    let response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: getHeaders(accessToken),
    });

    if (response.status === 401) {
      const newAccessToken = await useAuthStore.getState().refreshAccessToken();
      if (newAccessToken) {
        response = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers: getHeaders(newAccessToken),
        });
      } else {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
    }

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || (typeof errorData === 'object' && Object.keys(errorData).length > 0 ? JSON.stringify(errorData) : null) || errorMessage;
      } catch {
        // Fallback robusto se a resposta não for JSON (como páginas HTML 404/500 do servidor)
        errorMessage = `Erro de conexão com o servidor (Status ${response.status}: ${response.statusText || 'Não Encontrado'})`;
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
}
