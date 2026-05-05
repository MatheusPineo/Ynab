import { create } from "zustand";
import api from "../lib/api";

export interface CategoryNode {
  id: string;
  name: string;
  assigned_amount: number;
  spent_amount: number;
  parent: string | null;
  children?: CategoryNode[];
}

interface BudgetState {
  categoryGroups: CategoryNode[];
  isLoading: boolean;
  error: string | null;

  fetchCategoryGroups: (month: number, year: number) => Promise<void>;
  assignMoney: (categoryId: string, amount: number, month: number, year: number) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  categoryGroups: [],
  isLoading: false,
  error: null,

  fetchCategoryGroups: async (month, year) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get(`/categories/tree/?month=${month}&year=${year}`);
      set({ categoryGroups: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || "Erro ao buscar categorias" 
      });
    }
  },

  assignMoney: async (categoryId, amount, month, year) => {
    try {
      set({ isLoading: true });
      await api.post(`/monthly-budgets/set_budget/`, {
        category: categoryId,
        month,
        year,
        amount,
      });
      // Recarregar a árvore após atribuir
      const response = await api.get(`/categories/tree/?month=${month}&year=${year}`);
      set({ categoryGroups: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || "Erro ao alocar dinheiro" 
      });
      throw new Error(error.response?.data?.error || "Erro ao alocar dinheiro");
    }
  },
}));
