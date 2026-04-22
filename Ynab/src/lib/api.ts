import { useAuthStore } from "@/store/useAuthStore";

const BASE_URL = "http://localhost:8000/api";

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const { accessToken } = useAuthStore.getState();

  const headers = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Aqui poderíamos implementar a lógica de refresh token
    useAuthStore.getState().logout();
    throw new Error("Sessão expirada");
  }

  return response;
}
