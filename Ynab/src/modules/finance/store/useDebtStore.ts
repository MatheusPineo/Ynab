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

export interface DebtCharge {
  id: string;
  debt: string;
  amount: number;
  description: string;
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
  total_amount: number;
  payments: DebtPayment[];
  charges: DebtCharge[];
  origin_transaction?: string | null;
  origin_category?: string | null;
  applied_rule?: string | null;
  reimburses_category?: boolean;
  origin_transaction_description?: string | null;
  origin_transaction_amount?: number | null;
  origin_category_name?: string | null;
  applied_rule_name?: string | null;
}

export interface SplitRuleItem {
  id?: string;
  debtor: string;
  debtor_name?: string;
  percentage?: number;
  fixed_amount?: number;
}

export interface SplitRule {
  id: string;
  name: string;
  items: SplitRuleItem[];
  created_at: string;
}

export interface TransactionDraft {
  description: string;
  amount: number;
  type: string;
  accountId: string;
  categoryId: string;
  status: string;
  date: string;
  isRecurring: boolean;
  recurrenceInterval: string;
  splitRuleId?: string;
  sharedAmount?: number;
  applySplit?: boolean;
}

interface DebtState {
  debts: Debt[];
  splitRules: SplitRule[];
  transactionDraft: TransactionDraft | null;
  loading: boolean;
  fetchDebts: () => Promise<void>;
  addDebt: (data: Partial<Debt>) => Promise<void>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addPayment: (data: { debt: string; amount: number; date: string; account: string | null }) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  addDebtAmount: (id: string, data: { amount: number; description: string; date: string; account: string | null }) => Promise<void>;
  updateCharge: (chargeId: string, data: Partial<DebtCharge>) => Promise<void>;
  deleteCharge: (chargeId: string) => Promise<void>;
  fetchSplitRules: () => Promise<void>;
  setTransactionDraft: (draft: TransactionDraft | null) => void;
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

  addDebtAmount: async (id, data) => {
    try {
      const res = await authenticatedFetch(`/debts/${id}/add_debt_amount/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Falha ao adicionar débito");
      }
      await get().fetchDebts();
      toast.success("Débito adicionado com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  },

  updateCharge: async (chargeId, data) => {
    try {
      const res = await authenticatedFetch(`/debt-charges/${chargeId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Falha ao atualizar débito");
      await get().fetchDebts();
      toast.success("Débito atualizado!");
    } catch (error: any) {
      toast.error(error.message);
    }
  },

  deleteCharge: async (chargeId) => {
    try {
      const res = await authenticatedFetch(`/debt-charges/${chargeId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover débito");
      await get().fetchDebts();
      toast.success("Débito removido.");
    } catch (error: any) {
      toast.error(error.message);
    }
  },

  splitRules: [],
  transactionDraft: null,

  fetchSplitRules: async () => {
    try {
      const res = await authenticatedFetch("/split-rules/");
      if (res.ok) {
        const data = await res.json();
        set({ splitRules: data || [] });
      }
    } catch (err) {
      console.error("Erro ao buscar regras de rateio:", err);
    }
  },

  setTransactionDraft: (draft) => {
    set({ transactionDraft: draft });
  },
}));
