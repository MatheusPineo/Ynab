import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/api";
import { Transaction } from "@/types";
import { toast } from "sonner";

export const useTransactions = () => {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await authenticatedFetch("/transactions/");
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
      toast.success("Transação adicionada!");
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
      // Podemos recarregar as contas aqui usando import para garantir atualização do saldo
      toast.success(data.message || "Arquivo importado com sucesso!");
    },
  });

  return { transactions, isLoading, addTransaction, deleteTransaction, importFile };
};
