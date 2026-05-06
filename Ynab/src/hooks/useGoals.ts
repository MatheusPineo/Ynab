import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@/lib/api";
import { Goal } from "@/types";
import { toast } from "sonner";

export const useGoals = () => {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const response = await authenticatedFetch("/goals/");
      if (!response.ok) throw new Error("Erro ao buscar metas");
      return response.json();
    },
  });

  const addGoal = useMutation({
    mutationFn: async (newGoal: Omit<Goal, "id">) => {
      const response = await authenticatedFetch("/goals/", {
        method: "POST",
        body: JSON.stringify(newGoal),
      });
      if (!response.ok) throw new Error("Erro ao criar meta");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta criada!");
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
      const response = await authenticatedFetch(`/goals/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = Object.values(errorData).flat().join(" ") || "Erro ao atualizar meta";
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/goals/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao excluir meta");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta excluída!");
    },
  });

  return { goals, isLoading, addGoal, updateGoal, deleteGoal };
};
