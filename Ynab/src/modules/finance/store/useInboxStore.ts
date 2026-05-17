import { create } from "zustand";
import { authenticatedFetch } from "@/shared/lib/api";
import { toast } from "sonner";

export interface TransactionInbox {
  id: string;
  file: string; // URL da imagem/pdf física no Django
  status: "pending" | "processing" | "ready" | "failed";
  ai_suggestions: {
    amount?: number | null;
    date?: string | null;
    merchant?: string | null;
    currency?: string | null;
    transactions?: Array<{
      amount?: number | null;
      date?: string | null;
      merchant?: string | null;
      currency?: string | null;
      approved?: boolean;
    }>;
  };
  error_message?: string | null;
  processed_at?: string | null;
  validated_transaction?: string | null;
  created_at: string;
  updated_at: string;
}

interface InboxState {
  inboxItems: TransactionInbox[];
  isLoading: boolean;
  
  // Actions
  fetchInboxItems: () => Promise<void>;
  uploadInboxFiles: (files: FileList | File[]) => Promise<void>;
  approveInboxItem: (
    id: string, 
    payload: { 
      account: string; 
      category?: string | null; 
      amount: number; 
      description: string; 
      date: string; 
      is_income: boolean; 
      index?: number;
    }
  ) => Promise<boolean>;
  deleteInboxItem: (id: string) => Promise<void>;
}

export const useInboxStore = create<InboxState>()((set, get) => ({
  inboxItems: [],
  isLoading: false,

  fetchInboxItems: async () => {
    set({ isLoading: true });
    try {
      const response = await authenticatedFetch("/inbox/");
      if (!response.ok) throw new Error("Falha ao buscar itens da inbox");
      const data = await response.json();
      set({ inboxItems: Array.isArray(data) ? data : [] });
    } catch (error: any) {
      console.error("Erro ao buscar inbox:", error);
      toast.error("Erro ao carregar notas pendentes.");
    } finally {
      set({ isLoading: false });
    }
  },

  uploadInboxFiles: async (files) => {
    set({ isLoading: true });
    try {
      const formData = new FormData();
      // Adiciona todos os arquivos
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await authenticatedFetch("/inbox/upload/", {
        method: "POST",
        body: formData, // Deixamos o browser setar multipart/form-data com o boundary
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha no upload dos arquivos");
      }

      toast.success("Arquivos carregados! Processamento por IA iniciado em segundo plano.");
      await get().fetchInboxItems();
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload das imagens.");
    } finally {
      set({ isLoading: false });
    }
  },

  approveInboxItem: async (id, payload) => {
    set({ isLoading: true });
    try {
      const response = await authenticatedFetch(`/inbox/${id}/approve/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao aprovar e criar transação");
      }

      toast.success("Comprovante homologado e transação criada com sucesso!");
      await get().fetchInboxItems();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar nota fiscal.");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteInboxItem: async (id) => {
    try {
      const response = await authenticatedFetch(`/inbox/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Falha ao excluir item da inbox");
      
      toast.success("Comprovante descartado.");
      set((state) => ({
        inboxItems: state.inboxItems.filter((item) => item.id !== id),
      }));
    } catch (error: any) {
      toast.error(error.message || "Erro ao descartar item.");
    }
  },
}));
