import { create } from "zustand";
import { authenticatedFetch } from "@/shared/lib/api";

export interface InvestmentAsset {
  id: number;
  ticker: string;
  name: string;
  asset_type: 'FIXED_INCOME' | 'STOCK' | 'FII' | 'CRYPTO' | 'OTHER';
  currency: string;
  created_at: string;
}

export interface InvestmentActivity {
  id: number;
  asset: number;
  asset_ticker?: string;
  asset_name?: string;
  activity_type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT';
  date: string;
  quantity: number;
  unit_price: number;
  fees: number;
  notes: string;
}

export interface AssetHolding {
  asset_id: number;
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  average_cost: number;
  total_invested: number;
  currency: string;
  net_yield?: any; 
}

export interface WealthSummary {
  holdings: AssetHolding[];
  total_net_worth: number;
}

interface WealthStore {
  assets: InvestmentAsset[];
  activities: InvestmentActivity[];
  summary: WealthSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchAssets: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  createAsset: (data: Partial<InvestmentAsset>) => Promise<InvestmentAsset | void>;
  createActivity: (data: Partial<InvestmentActivity>) => Promise<void>;
}

export const useWealthStore = create<WealthStore>((set) => ({
  assets: [],
  activities: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch('/wealth/assets/');
      if (response.ok) {
        const data = await response.json();
        set({ assets: data, isLoading: false });
      } else {
        set({ error: "Erro ao carregar ativos", isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch('/wealth/activities/');
      if (response.ok) {
        const data = await response.json();
        set({ activities: data, isLoading: false });
      } else {
        set({ error: "Erro ao carregar atividades", isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch('/wealth/summary/');
      if (response.ok) {
        const data = await response.json();
        set({ summary: data, isLoading: false });
      } else {
        set({ error: "Erro ao carregar resumo de patrimônio", isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createAsset: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch('/wealth/assets/', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const newAsset = await response.json();
        set((state) => ({ assets: [...state.assets, newAsset], isLoading: false }));
        return newAsset;
      } else {
        throw new Error("Erro ao criar ativo");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  createActivity: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch('/wealth/activities/', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const newActivity = await response.json();
        set((state) => ({ 
          activities: [newActivity, ...state.activities], 
          isLoading: false 
        }));
        // Atualiza o summary após uma nova atividade
        useWealthStore.getState().fetchSummary();
      } else {
        throw new Error("Erro ao registrar atividade");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  }
}));
