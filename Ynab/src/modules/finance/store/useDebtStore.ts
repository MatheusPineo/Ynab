import { create } from "zustand";
import { authenticatedFetch } from "@/shared/lib/api";
import { toast } from "sonner";

export interface DebtPayment {
  id: string;
  debt: string;
  amount: number;
  date: string;
  account: string | null;
  account_name: string | null;
  transaction: string | null;
  created_at: string;
}

export interface Debt {
  id: string;
  counterparty_name: string;
  original_amount: number;
  currency: string;
  is_mine: boolean;
  notes: string;
  created_at: string;
  amount_paid: number;
  amount_remaining: number;
  payments: DebtPayment[];
}

interface DebtState {
  debts: Debt[];
  loading: boolean;
  fetchDebts: () => Promise<void>;
  addDebt: (data: Partial<Debt>) => Promise<void>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addPayment: (data: { debt: string; amount: number; date: string; account: string | null }) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
}

export const useDebtStore = create<DebtState>((set, get) => ({
  debts: [],
  loading: false,

  fetchDebts: async () => {
    set({ loading: true });
    try {
      const res = await authenticatedFetch("/debts/");
      if (!res.ok) throw new Error("Falha ao buscar dívidas");
      const data = await res.json();
      set({ debts: data });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      set({ loading: false });
    }
  },

  addDebt: async (data) => {
    try {
      const res = await authenticatedFetch("/debts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Falha ao criar dívida");
      }
      await get().fetchDebts();
      toast.success("Dívida criada com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  },

  updateDebt: async (id, data) => {
    try {
      const res = await authenticatedFetch(`/debts/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Falha ao atualizar dívida");
      await get().fetchDebts();
      toast.success("Dívida atualizada!");
    } catch (error: any) {
      toast.error(error.message);
    }
  },

  deleteDebt: async (id) => {
    try {
      const res = await authenticatedFetch(`/debts/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir dívida");
      await get().fetchDebts();
      toast.success("Dívida excluída.");
    } catch (error: any) {
      toast.error(error.message);
    }
  },

  addPayment: async (data) => {
    try {
      const res = await authenticatedFetch("/debt-payments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Falha ao registrar pagamento");
      }
      await get().fetchDebts();
      toast.success("Pagamento registrado com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  },

  deletePayment: async (paymentId) => {
    try {
      const res = await authenticatedFetch(`/debt-payments/${paymentId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover pagamento");
      await get().fetchDebts();
      toast.success("Pagamento removido.");
    } catch (error: any) {
      toast.error(error.message);
    }
  },
}));
