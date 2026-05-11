import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  has_password?: boolean;
  twoFactorEnabled?: boolean;
  preferredCurrency?: string;
  language?: string;
}


interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<{ twoFactorRequired?: boolean, userId?: string } | void>;
  googleLogin: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verify2FA: (userId: string, code: string) => Promise<void>;
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
        
        // Se o backend diz que 2FA é necessário
        if (data.two_factor_required) {
          return { twoFactorRequired: true, userId: data.user_id };
        }

        if (!data.user) {
          throw new Error("Resposta inválida do servidor: objeto de usuário ausente.");
        }

        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          isAuthenticated: true,
          user: { 
            id: data.user.id, 
            name: `${data.user.first_name ?? ""} ${data.user.last_name ?? ""}`.trim() || data.user.email, 
            email: data.user.email,
            bio: data.user.profile?.bio,
            avatar: data.user.profile?.avatar_url,
            has_password: data.user.has_password,
            twoFactorEnabled: data.user.profile?.two_factor_enabled,
            preferredCurrency: data.user.profile?.preferred_currency,
            language: data.user.profile?.language
          },
        });

        if (data.user.profile?.preferred_currency) {
          useCurrencyStore.getState().setBaseCurrency(data.user.profile.preferred_currency as any);
        }
      },


      verify2FA: async (userId, code) => {
        let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
        if (!baseUrl.includes("/api") && !baseUrl.startsWith("http://localhost")) {
          baseUrl = baseUrl.replace(/\/$/, "") + "/api";
        }
        baseUrl = baseUrl.replace(/\/$/, "");

        const response = await fetch(`${baseUrl}/auth/2fa/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, code }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Falha na verificação do 2FA");
        }

        const data = await response.json();
        if (!data.user) {
          throw new Error("Resposta inválida do servidor: objeto de usuário ausente.");
        }

        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          isAuthenticated: true,
          user: { 
            id: data.user.id, 
            name: `${data.user.first_name ?? ""} ${data.user.last_name ?? ""}`.trim() || data.user.email, 
            email: data.user.email,
            bio: data.user.profile?.bio,
            avatar: data.user.profile?.avatar_url,
            has_password: data.user.has_password,
            twoFactorEnabled: data.user.profile?.two_factor_enabled,
            preferredCurrency: data.user.profile?.preferred_currency,
            language: data.user.profile?.language
          },
        });

        if (data.user.profile?.preferred_currency) {
          useCurrencyStore.getState().setBaseCurrency(data.user.profile.preferred_currency as any);
        }
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
        if (!data.user) {
          throw new Error("Resposta inválida do servidor: objeto de usuário ausente.");
        }

        set({
          accessToken: data.access,
          refreshToken: data.refresh,
          isAuthenticated: true,
          user: { 
            id: data.user.id, 
            name: `${data.user.first_name ?? ""} ${data.user.last_name ?? ""}`.trim() || data.user.email, 
            email: data.user.email,
            bio: data.user.profile?.bio,
            avatar: data.user.profile?.avatar_url,
            has_password: data.user.has_password,
            twoFactorEnabled: data.user.profile?.two_factor_enabled,
            preferredCurrency: data.user.profile?.preferred_currency,
            language: data.user.profile?.language
          },
        });

        if (data.user.profile?.preferred_currency) {
          useCurrencyStore.getState().setBaseCurrency(data.user.profile.preferred_currency as any);
        }
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
          let errorMessage = "Falha ao registrar";
          
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.email && Array.isArray(errorData.email)) {
            errorMessage = errorData.email[0];
          } else if (errorData.username && Array.isArray(errorData.username)) {
            errorMessage = errorData.username[0];
          } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            const firstKey = Object.keys(errorData)[0];
            if (Array.isArray(errorData[firstKey])) {
              errorMessage = errorData[firstKey][0];
            } else if (typeof errorData[firstKey] === 'string') {
              errorMessage = errorData[firstKey];
            }
          }
          
          throw new Error(errorMessage);
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
