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
      const data = await response.json();
      // Log de diagnóstico para rastrear bug de transações sumidas
      console.log(`[useTransactions] API ${url} retornou ${Array.isArray(data) ? data.length : 'NÃO-ARRAY'} transações`, Array.isArray(data) ? data.map((t: any) => ({ id: t.id, desc: t.description, acc: t.account, date: t.date })) : data);
      return data;
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
    mutationFn: async ({ id, updates, scope = 'single' }: { id: string; updates: Partial<Transaction>; scope?: 'single' | 'future' | 'all' }) => {
      const response = await authenticatedFetch(`/transactions/${id}/?scope=${scope}`, {
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
    mutationFn: async ({ id, scope = 'single' }: { id: string; scope?: 'single' | 'future' | 'all' }) => {
      await authenticatedFetch(`/transactions/${id}/?scope=${scope}`, {
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

  const payBill = useMutation({
    mutationFn: async (data: { credit_card_id: string; bill_id: string; account_id?: string; amount?: number }) => {
      const response = await authenticatedFetch(`/credit-cards/${data.credit_card_id}/pay_bill/${data.bill_id}/`, {
        method: "POST",
        body: JSON.stringify({
          account_id: data.account_id,
          amount: data.amount
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao pagar a fatura.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      const store = useAccountStore.getState();
      store.fetchAccounts();
      store.fetchCategoryGroups();
      store.fetchTransactions();
      toast.success("Fatura paga com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  return { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, importFile, transferTransaction, payBill };
};
