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
  login: (email: string, name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, name) => {
        // Mocking a network delay for a real-app feel
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const mockUser: User = {
          id: "1",
          name: name || "Usuário Vault",
          email: email,
          avatar: "https://github.com/shadcn.png",
        };

        set({ user: mockUser, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "vault-auth-storage",
    }
  )
);
