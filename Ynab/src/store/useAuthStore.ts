import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      login: async (email, password) => {
        let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
        if (!baseUrl.includes("/api") && !baseUrl.startsWith("http://localhost")) {
          baseUrl = baseUrl.replace(/\/$/, "") + "/api";
        }
        baseUrl = baseUrl.replace(/\/$/, "");

        const response = await fetch(`${baseUrl}/token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password }),
        });

        if (!response.ok) throw new Error("Falha na autenticação");

        const data = await response.json();
        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          isAuthenticated: true,
          user: { id: "1", name: "Usuário", email },
        });
      },

      googleLogin: async (token) => {
        console.log("🔑 Iniciando googleLogin com token de tamanho:", token?.length);
        let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
        if (!baseUrl.includes("/api") && !baseUrl.startsWith("http://localhost")) {
          baseUrl = baseUrl.replace(/\/$/, "") + "/api";
        }
        baseUrl = baseUrl.replace(/\/$/, "");

        console.log("🌐 Chamando backend em:", `${baseUrl}/auth/google/`);
        const response = await fetch(`${baseUrl}/auth/google/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) throw new Error("Falha no login com Google");

        const data = await response.json();
        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          isAuthenticated: true,
          user: { 
            id: data.user.id, 
            name: `${data.user.first_name ?? ""} ${data.user.last_name ?? ""}`.trim() || data.user.email, 
            email: data.user.email,
            avatar: data.user.avatar
          },
        });
      },

      register: async (name, email, password) => {
        let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
        if (!baseUrl.includes("/api") && !baseUrl.startsWith("http://localhost")) {
          baseUrl = baseUrl.replace(/\/$/, "") + "/api";
        }
        baseUrl = baseUrl.replace(/\/$/, "");

        const response = await fetch(`${baseUrl}/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao registrar");
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;

        let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
        if (!baseUrl.includes("/api") && !baseUrl.startsWith("http://localhost")) {
          baseUrl = baseUrl.replace(/\/$/, "") + "/api";
        }
        baseUrl = baseUrl.replace(/\/$/, "");

        const response = await fetch(`${baseUrl}/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
          get().logout();
          return null;
        }

        const data = await response.json();
        set({ accessToken: data.access });
        return data.access;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: "vault-auth-storage",
    }
  )
);
