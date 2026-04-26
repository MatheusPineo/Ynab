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
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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

      register: async (name, email, password) => {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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

        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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
