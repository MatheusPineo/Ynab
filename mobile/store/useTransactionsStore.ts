import { create } from "zustand";
import api from "../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  status: "realized" | "pending";
  date: string;
  account: string;
  category?: string;
  account_name?: string;
  category_name?: string;
  isOffline?: boolean; // Tag for local offline transactions
}

interface OfflineQueueItem {
  id: string;
  type: "transaction" | "transfer";
  data: any;
}

interface TransactionsState {
  transactions: Transaction[];
  offlineQueue: OfflineQueueItem[];
  isLoading: boolean;
  error: string | null;

  fetchTransactions: (month?: number, year?: number) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  toggleStatus: (id: string, currentStatus: "realized" | "pending") => Promise<void>;
  addTransaction: (transactionData: {
    description: string;
    amount: number;
    is_income: boolean;
    date: string;
    account: string;
    category?: string | null;
    status: "realized" | "pending";
  }) => Promise<void>;
  addTransfer: (transferData: {
    from_account: string;
    to_account: string;
    amount: number;
    description: string;
    date: string;
  }) => Promise<void>;
  
  loadOfflineQueue: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: [],
  offlineQueue: [],
  isLoading: false,
  error: null,

  loadOfflineQueue: async () => {
    try {
      const stored = await AsyncStorage.getItem("@vault_offline_queue");
      if (stored) {
        set({ offlineQueue: JSON.parse(stored) });
      }
    } catch (err) {
      console.error("Erro ao carregar fila offline", err);
    }
  },

  syncOfflineQueue: async () => {
    const { offlineQueue } = get();
    if (offlineQueue.length === 0) return;

    console.log(`Tentando sincronizar ${offlineQueue.length} itens offline...`);
    const remainingQueue: OfflineQueueItem[] = [];

    for (const item of offlineQueue) {
      try {
        if (item.type === "transaction") {
          await api.post("/transactions/", item.data);
        } else if (item.type === "transfer") {
          await api.post("/transactions/transfer/", item.data);
        }
      } catch (err: any) {
        // If it's still a network error, keep it in the queue and stop syncing remaining to preserve order
        if (!err.response || err.code === "ERR_NETWORK") {
          remainingQueue.push(item);
        }
        // If it's a backend validation error, we might drop or keep it. Let's keep it to be safe or log it.
      }
    }

    set({ offlineQueue: remainingQueue });
    await AsyncStorage.setItem("@vault_offline_queue", JSON.stringify(remainingQueue));
  },

  fetchTransactions: async (month, year) => {
    try {
      set({ isLoading: true, error: null });
      
      // Auto-attempt to sync offline items on pull-to-refresh / fetch
      await get().syncOfflineQueue();

      const url = month && year 
        ? `/transactions/?month=${month}&year=${year}` 
        : "/transactions/";
      const response = await api.get(url);
      
      // Merge with any remaining local unsynced offline transactions so the user sees them listed!
      const currentOffline = get().offlineQueue;
      const localItems: Transaction[] = currentOffline
        .filter((item) => item.type === "transaction")
        .map((item) => {
          const t = item.data;
          return {
            id: item.id,
            description: t.description,
            amount: t.amount,
            type: t.is_income ? "income" : "expense",
            status: t.status,
            date: t.date,
            account: t.account,
            category_name: "Aguardando Rede...",
            isOffline: true,
          };
        });

      set({ 
        transactions: [...localItems, ...response.data], 
        isLoading: false 
      });
    } catch (error: any) {
      // If we failed to fetch because of offline status, don't show blank! Show cached + offline
      const currentOffline = get().offlineQueue;
      const localItems: Transaction[] = currentOffline
        .filter((item) => item.type === "transaction")
        .map((item) => {
          const t = item.data;
          return {
            id: item.id,
            description: t.description,
            amount: t.amount,
            type: t.is_income ? "income" : "expense",
            status: t.status,
            date: t.date,
            account: t.account,
            category_name: "Pendendo Sincronização",
            isOffline: true,
          };
        });

      // Still set loaded items (even if partially) and report error if appropriate
      set({ 
        transactions: [...localItems, ...get().transactions],
        isLoading: false, 
        error: !error.response ? "Modo Offline Ativo" : (error.response?.data?.error || "Erro ao carregar transações")
      });
    }
  },

  deleteTransaction: async (id) => {
    // If it's a local offline transaction, remove it instantly from local state and queue!
    if (id.startsWith("offline_")) {
      set((state) => {
        const nextQueue = state.offlineQueue.filter((item) => item.id !== id);
        AsyncStorage.setItem("@vault_offline_queue", JSON.stringify(nextQueue));
        return {
          transactions: state.transactions.filter((t) => t.id !== id),
          offlineQueue: nextQueue,
        };
      });
      return;
    }

    try {
      set({ isLoading: true });
      await api.delete(`/transactions/${id}/`);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || "Erro ao excluir transação" 
      });
      throw new Error(error.response?.data?.error || "Erro ao excluir transação");
    }
  },

  toggleStatus: async (id, currentStatus) => {
    if (id.startsWith("offline_")) {
      throw new Error("Não é possível alterar o status de transações offline ainda não sincronizadas.");
    }

    try {
      const newStatus = currentStatus === "realized" ? "pending" : "realized";
      const response = await api.patch(`/transactions/${id}/`, { status: newStatus });
      set((state) => ({
        transactions: state.transactions.map((t) => 
          t.id === id ? { ...t, status: response.data.status } : t
        ),
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Erro ao atualizar status");
    }
  },

  addTransaction: async (transactionData) => {
    try {
      set({ isLoading: true });
      await api.post("/transactions/", transactionData);
      await get().fetchTransactions();
    } catch (error: any) {
      set({ isLoading: false });
      
      // CHECK IF NETWORK/OFFLINE ERROR
      if (!error.response || error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        const tempId = `offline_tx_${Date.now()}`;
        const currentQueue = get().offlineQueue;
        const updatedQueue = [
          ...currentQueue, 
          { id: tempId, type: "transaction" as const, data: transactionData }
        ];

        set({ offlineQueue: updatedQueue });
        await AsyncStorage.setItem("@vault_offline_queue", JSON.stringify(updatedQueue));
        
        // Add instantly to in-memory list
        const tempItem: Transaction = {
          id: tempId,
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.is_income ? "income" : "expense",
          status: transactionData.status,
          date: transactionData.date,
          account: transactionData.account,
          category_name: "Fila Offline",
          isOffline: true,
        };
        
        set((state) => ({
          transactions: [tempItem, ...state.transactions]
        }));

        throw new Error("offline_saved");
      }

      throw new Error(error.response?.data?.error || "Erro ao registrar transação");
    }
  },

  addTransfer: async (transferData) => {
    try {
      set({ isLoading: true });
      await api.post("/transactions/transfer/", transferData);
      await get().fetchTransactions();
    } catch (error: any) {
      set({ isLoading: false });

      // CHECK IF NETWORK/OFFLINE ERROR
      if (!error.response || error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        const tempId = `offline_tf_${Date.now()}`;
        const currentQueue = get().offlineQueue;
        const updatedQueue = [
          ...currentQueue, 
          { id: tempId, type: "transfer" as const, data: transferData }
        ];

        set({ offlineQueue: updatedQueue });
        await AsyncStorage.setItem("@vault_offline_queue", JSON.stringify(updatedQueue));

        // Add local representations
        const tempItem: Transaction = {
          id: tempId,
          description: transferData.description || "Transferência entre contas",
          amount: transferData.amount,
          type: "expense", // Display representation
          status: "realized",
          date: transferData.date,
          account: transferData.from_account,
          category_name: "Fila Offline (Transferência)",
          isOffline: true,
        };

        set((state) => ({
          transactions: [tempItem, ...state.transactions]
        }));

        throw new Error("offline_saved");
      }

      throw new Error(error.response?.data?.error || "Erro ao realizar transferência");
    }
  },
}));
