import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  two_factor_enabled?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post("/token/", { username: email, password }); // Django REST Framework SimpleJWT usa 'username'
      
      if (response.data.two_factor_required) {
        return { 
          twoFactorRequired: true, 
          userId: response.data.user_id 
        };
      }

      const { access, user } = response.data;
      
      await AsyncStorage.setItem("auth-token", access);
      await AsyncStorage.setItem("user-data", JSON.stringify(user));
      
      set({ 
        token: access, 
        user, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });
      
      return { success: true };
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || "Falha ao fazer login" 
      });
      throw new Error(error.response?.data?.error || "Credenciais inválidas");
    }
  },

  register: async (email, password, name) => {
    try {
      set({ isLoading: true, error: null });
      // Mapeamento correto para RegisterView no Django
      await api.post("/register/", { username: email, email, password, name });
      
      // Auto-login logo após criar conta
      return await get().login(email, password);
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || "Falha ao criar conta" 
      });
      throw new Error(error.response?.data?.error || "Erro ao registrar. E-mail pode já estar em uso.");
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post("/auth/google/", { 
        credential: "demo_google_credential_token_from_mobile" 
      });
      const { access, user } = response.data;
      
      await AsyncStorage.setItem("auth-token", access);
      await AsyncStorage.setItem("user-data", JSON.stringify(user));
      
      set({ 
        token: access, 
        user, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });
      return { success: true };
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: "Falha na autenticação do Google" 
      });
      throw new Error("Erro de login com Google. Tente novamente.");
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem("auth-token");
      await AsyncStorage.removeItem("user-data");
      set({ user: null, token: null, isAuthenticated: false });
    } catch (e) {
      // Ignorar erros
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("auth-token");
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const userDataStr = await AsyncStorage.getItem("user-data");
      let user = null;
      if (userDataStr) {
        user = JSON.parse(userDataStr);
      }
      
      set({ 
        token, 
        user,
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
