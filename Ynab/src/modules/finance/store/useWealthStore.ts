import { create } from "zustand";
import { authenticatedFetch } from "@/shared/lib/api";

export interface InvestmentAsset {
  id: number;
  ticker: string;
  name: string;
  asset_type: 'FIXED_INCOME' | 'TREASURY' | 'STOCK' | 'FII' | 'ETF' | 'CRYPTO' | 'BOND' | 'MUTUAL_FUND' | 'OTHER';
  currency: string;
  due_date?: string;
  indexer?: string;
  title_type?: string;
  rate_type?: string;
  issuer?: string;
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
  currency: string;
  asset_type: 'FIXED_INCOME' | 'TREASURY' | 'STOCK' | 'FII' | 'ETF' | 'CRYPTO' | 'BOND' | 'MUTUAL_FUND' | 'OTHER';
  quantity: number;
  average_cost: number;
  total_cost_basis: number;
  current_price?: number;
  net_value?: number;
  total_profit_loss?: number;
  percentage_yield?: number;
  indexer?: string;
  rate_type?: string;
  interest_rate?: number;
  macro_category?: string;
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
  updateActivity: (id: number, data: Partial<InvestmentActivity>) => Promise<void>;
  deleteActivity: (id: number) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
  updateAssetBalance: (assetId: number, newBalance: number) => Promise<void>;
  updateMacroBalance: (accountId: number | null, macroName: string, newBalance: number) => Promise<void>;
  updateAccountBalance: (accountId: number | null, newBalance: number) => Promise<void>;
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
        useWealthStore.getState().fetchSummary();
      } else {
        throw new Error("Erro ao registrar atividade");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateActivity: async (id: number, data: Partial<InvestmentActivity>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch(`/wealth/activities/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const updatedActivity = await response.json();
        set((state) => ({
          activities: state.activities.map(a => a.id === id ? updatedActivity : a),
          isLoading: false
        }));
        useWealthStore.getState().fetchSummary();
      } else {
        throw new Error("Erro ao atualizar atividade");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteActivity: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch(`/wealth/activities/${id}/`, {
        method: 'DELETE'
      });
      if (response.ok) {
        set((state) => ({
          activities: state.activities.filter(a => a.id !== id),
          isLoading: false
        }));
        useWealthStore.getState().fetchSummary();
      } else {
        throw new Error("Erro ao deletar atividade");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteAsset: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch(`/wealth/assets/${id}/`, {
        method: 'DELETE'
      });
      if (response.ok) {
        set((state) => ({
          assets: state.assets.filter(a => a.id !== id),
          isLoading: false
        }));
        useWealthStore.getState().fetchSummary();
        useWealthStore.getState().fetchActivities();
      } else {
        throw new Error("Erro ao deletar ativo");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateAssetBalance: async (assetId: number, newBalance: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch("/wealth/batch-update/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ asset_id: assetId, new_balance: newBalance }]
        })
      });
      if (response.ok) {
        set({ isLoading: false });
        await useWealthStore.getState().fetchSummary();
      } else {
        throw new Error("Erro ao atualizar saldo do ativo");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateMacroBalance: async (accountId: number | null, macroName: string, newBalance: number) => {
    const { summary, activities } = useWealthStore.getState();
    if (!summary) return;

    // Agrupa os ativos para encontrar a macro categoria correta
    // Para simplificar, passamos as contas como vazias já que o agrupador usa apenas para o nome da conta e IDs
    const grouped = groupWealthHoldings(summary.holdings, activities, []);
    const accountNode = grouped.find((acc) => acc.account_id === accountId);
    if (!accountNode) return;

    const macroNode = accountNode.macroCategories.find((m) => m.name === macroName);
    if (!macroNode) return;

    const updates = distributeProportionally(macroNode.assets, newBalance);
    if (updates.length === 0) return;

    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch("/wealth/batch-update/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (response.ok) {
        set({ isLoading: false });
        await useWealthStore.getState().fetchSummary();
      } else {
        throw new Error("Erro ao atualizar saldos da categoria macro");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateAccountBalance: async (accountId: number | null, newBalance: number) => {
    const { summary, activities } = useWealthStore.getState();
    if (!summary) return;

    const grouped = groupWealthHoldings(summary.holdings, activities, []);
    const accountNode = grouped.find((acc) => acc.account_id === accountId);
    if (!accountNode) return;

    // Distribui de cima para baixo
    // Coleta todos os ativos da conta
    const allAssets: UnitaryAssetNode[] = [];
    accountNode.macroCategories.forEach((m) => {
      allAssets.push(...m.assets);
    });

    if (allAssets.length === 0) return;

    const updates = distributeProportionally(allAssets, newBalance);
    if (updates.length === 0) return;

    set({ isLoading: true, error: null });
    try {
      const response = await authenticatedFetch("/wealth/batch-update/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (response.ok) {
        set({ isLoading: false });
        await useWealthStore.getState().fetchSummary();
      } else {
        throw new Error("Erro ao atualizar saldos da conta");
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  }
}));

import { groupWealthHoldings, distributeProportionally, UnitaryAssetNode } from "./wealth-utils";
