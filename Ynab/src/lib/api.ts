import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Erro ${response.status}`);
    }

    return response;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
}
