import { create } from "zustand";
import api from "../lib/api";

export interface AccountNode {
  id: string;
  name: string;
  account_type: "checking" | "savings" | "investment" | "credit" | "loan";
  balance: number;
  currency: "BRL" | "USD" | "EUR";
  parent: string | null;
  children?: AccountNode[];
}

interface AccountState {
  tree: AccountNode[];
  isLoading: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  addAccount: (accountData: {
    name: string;
    balance: number;
    account_type: string;
    currency: string;
    parent: string | null;
  }) => Promise<void>;
  updateAccount: (id: string, updates: Partial<AccountNode>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  tree: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get("/accounts/tree/");
      set({ tree: Array.isArray(response.data) ? response.data : [], isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Erro ao buscar contas",
      });
    }
  },

  addAccount: async (accountData) => {
    try {
      set({ isLoading: true });
      await api.post("/accounts/", accountData);
      await get().fetchAccounts();
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || "Erro ao criar conta");
    }
  },

  updateAccount: async (id, updates) => {
    try {
      set({ isLoading: true });
      await api.patch(`/accounts/${id}/`, updates);
      await get().fetchAccounts();
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || "Erro ao atualizar conta");
    }
  },

  deleteAccount: async (id) => {
    try {
      set({ isLoading: true });
      await api.delete(`/accounts/${id}/`);
      await get().fetchAccounts();
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || "Erro ao excluir conta");
    }
  },
}));
