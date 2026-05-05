import { create } from "zustand";
import api from "../lib/api";

export interface TemplateItem {
  id: string;
  account: string;
  percentage: number | null;
  fixed_amount: number | null;
}

export interface DistributionTemplate {
  id: string;
  name: string;
  items: TemplateItem[];
}

interface DistributionState {
  templates: DistributionTemplate[];
  isLoading: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;
  executeDistribution: (payload: {
    from_account: string;
    total_amount: number;
    date: string;
    distributions: { to_account: string; amount: number }[];
  }) => Promise<void>;
}

export const useDistributionStore = create<DistributionState>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get("/distribution-templates/");
      set({
        templates: Array.isArray(response.data) ? response.data : [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Erro ao buscar modelos de distribuição",
      });
    }
  },

  executeDistribution: async (payload) => {
    try {
      set({ isLoading: true });
      await api.post("/transactions/bulk_transfer/", payload);
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.error || "Erro ao executar lote de distribuição"
      );
    }
  },
}));
