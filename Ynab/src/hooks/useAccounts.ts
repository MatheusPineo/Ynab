import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/api";
import { AccountNode } from "@/types";
import { toast } from "sonner";

export const useAccounts = () => {
  const queryClient = useQueryClient();

  const { data: tree = [], isLoading } = useQuery<AccountNode[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await authenticatedFetch("/accounts/tree/");
      if (!response.ok) throw new Error("Erro ao buscar contas");
      return response.json();
    },
  });

  const addAccount = useMutation({
    mutationFn: async (newAcc: any) => {
      const response = await authenticatedFetch("/accounts/", {
        method: "POST",
        body: JSON.stringify(newAcc),
      });
      if (!response.ok) throw new Error("Erro ao criar conta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Conta criada!");
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/accounts/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir conta");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Conta excluída!");
    },
  });

  return { tree, isLoading, addAccount, deleteAccount };
};
