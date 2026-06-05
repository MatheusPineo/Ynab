import { create } from "zustand";
import { authenticatedFetch } from "@/shared/lib/api";
import { toast } from "sonner";

export interface Asset {
  id: string;
  name: string;
  purchase_value: number;
  current_market_value: number;
  liquidity_tier: 'IMMEDIATE' | 'MEDIUM' | 'ILLIQUID';
  linked_debt: string | null;
  linked_debt_name: string | null;
  effective_asset_value: number;
  created_at: string;
}

export interface RunwaySummary {
  total_liquid_assets: number;
  average_monthly_expenses: number;
  runway_months: number | null;
}

interface AssetStore {
  assets: Asset[];
  runway: RunwaySummary | null;
  isLoading: boolean;
  error: string | null;

  fetchAssets: () => Promise<void>;
  fetchRunway: () => Promise<void>;
  createAsset: (data: Partial<Asset>) => Promise<void>;
  updateAsset: (id: string, data: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  runway: null,
  isLoading: false,
  error: null,

  fetchAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await authenticatedFetch("/assets/");
      if (!res.ok) throw new Error("Falha ao carregar ativos patrimoniais.");
      const data = await res.json();
      set({ assets: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error(err.message);
    }
  },

  fetchRunway: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await authenticatedFetch("/assets/runway/");
      if (!res.ok) throw new Error("Falha ao carregar projeção de runway.");
      const data = await res.json();
      set({ runway: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error(err.message);
    }
  },

  createAsset: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authenticatedFetch("/assets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Falha ao registrar ativo.");
      }
      toast.success("Ativo registrado com sucesso!");
      // Recarrega em paralelo
      await Promise.all([get().fetchAssets(), get().fetchRunway()]);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error(err.message);
      throw err;
    }
  },

  updateAsset: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authenticatedFetch(`/assets/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Falha ao atualizar ativo.");
      toast.success("Ativo atualizado!");
      await Promise.all([get().fetchAssets(), get().fetchRunway()]);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error(err.message);
    }
  },

  deleteAsset: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authenticatedFetch(`/assets/${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir ativo.");
      toast.success("Ativo excluído.");
      await Promise.all([get().fetchAssets(), get().fetchRunway()]);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error(err.message);
    }
  },
}));
