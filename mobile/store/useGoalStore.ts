import { create } from "zustand";
import api from "../lib/api";

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: "BRL" | "USD" | "EUR";
  deadline: string | null;
  emoji: string;
  created_at: string;
}

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;

  fetchGoals: () => Promise<void>;
  addGoal: (goalData: {
    name: string;
    target_amount: number;
    current_amount: number;
    currency: string;
    deadline?: string | null;
    emoji?: string;
  }) => Promise<void>;
  updateGoal: (id: string, goalData: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get("/goals/");
      set({
        goals: Array.isArray(response.data) ? response.data : [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Erro ao carregar metas financeiras",
      });
    }
  },

  addGoal: async (goalData) => {
    try {
      set({ isLoading: true });
      await api.post("/goals/", goalData);
      await get().fetchGoals();
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || "Erro ao criar meta");
    }
  },

  updateGoal: async (id, goalData) => {
    try {
      set({ isLoading: true });
      await api.patch(`/goals/${id}/`, goalData);
      await get().fetchGoals();
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || "Erro ao atualizar meta");
    }
  },

  deleteGoal: async (id) => {
    try {
      set({ isLoading: true });
      await api.delete(`/goals/${id}/`);
      await get().fetchGoals();
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || "Erro ao excluir meta");
    }
  },
}));
