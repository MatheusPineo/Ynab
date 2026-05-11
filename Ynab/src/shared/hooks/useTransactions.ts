import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/shared/lib/api";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { Transaction } from "@/types";
import { toast } from "sonner";

export const useTransactions = (month?: number, year?: number) => {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", month, year],
    queryFn: async () => {
      const url = month && year 
        ? `/transactions/?month=${month}&year=${year}` 
        : "/transactions/";
      const response = await authenticatedFetch(url);
      return response.json();
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (newT: Omit<Transaction, "id">) => {
      const response = await authenticatedFetch("/transactions/", {
        method: "POST",
        body: JSON.stringify(newT),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      const store = useAccountStore.getState();
      store.fetchAccounts();
      store.fetchCategoryGroups();
      store.fetchTransactions();
      toast.success("Transação adicionada!");
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Transaction> }) => {
      const response = await authenticatedFetch(`/transactions/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      const store = useAccountStore.getState();
      store.fetchAccounts();
      store.fetchCategoryGroups();
      store.fetchTransactions();
      toast.success("Transação atualizada!");
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      await authenticatedFetch(`/transactions/${id}/`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      const store = useAccountStore.getState();
      store.fetchAccounts();
      store.fetchCategoryGroups();
      store.fetchTransactions();
      toast.success("Transação excluída!");
    },
  });

  const importFile = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await authenticatedFetch("/transactions/import_file/", {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(data.message || "Arquivo importado com sucesso!");
    },
  });

  const transferTransaction = useMutation({
    mutationFn: async (data: { 
      from_account: string; 
      to_account: string; 
      amount: number; 
      to_amount: number; 
      description: string; 
      date: string 
    }) => {
      const response = await authenticatedFetch("/transactions/transfer/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao realizar transferência");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      const store = useAccountStore.getState();
      store.fetchAccounts();
      store.fetchTransactions();
      toast.success("Transferência realizada com sucesso!");
    },
  });

  return { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, importFile, transferTransaction };
};
