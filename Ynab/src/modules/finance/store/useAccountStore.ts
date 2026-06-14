import { create } from "zustand";
import { authenticatedFetch } from "@/shared/lib/api";
import {
  type AccountNode,
  type Transaction,
  type Currency,
  type Goal,
} from "@/types";
import { toast } from "sonner";

export interface DistributionTemplateItem {
  id?: string;
  account?: string | null;
  category?: string | null;
  percentage?: number;
  fixed_amount?: number;
}

export interface DistributionTemplate {
  id?: string;
  name: string;
  is_active?: boolean;
  is_archived?: boolean;
  trigger_payee?: string | null;
  fallback_category?: number | null;
  created_at?: string;
  items: DistributionTemplateItem[];
}

export interface CategoryNode {
  id: string;
  name: string;
  assigned_amount: number;
  spent_amount: number;
  available_amount?: number;
  rollover_amount?: number;
  overspending_type?: string | null;
  target_value?: number;
  target_type?: 'FIXED' | 'PERCENTAGE' | 'NEEDED_FOR_SPENDING' | 'SAVINGS_BUILDER';
  target_behavior?: 'NEEDED_FOR_SPENDING' | 'SAVINGS_BUILDER';
  ceiling_value?: number;
  parent: string | null;
  macro_rule?: 'NEEDS' | 'WANTS' | 'SAVINGS' | 'NONE';
  macro_allocation?: 'NEEDS' | 'WANTS' | 'SAVINGS' | 'NONE';
  children?: CategoryNode[];
}

export type CategoryGroup = CategoryNode;

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  emoji: string;
}

const initialGoals: Goal[] = [];

interface AccountState {
  tree: AccountNode[];
  transactions: Transaction[];
  globalPendingTransactions: Transaction[];
  categoryGroups: CategoryGroup[];
  readyToAssignBalance: number;
  goals: Goal[];
  currentMonth: number;
  currentYear: number;
  pendingIcons: Record<string, Blob>;
  distributionTemplates: DistributionTemplate[];
  
  fetchDistributionTemplates: () => Promise<void>;
  saveDistributionTemplate: (template: DistributionTemplate) => Promise<void>;
  executeBulkTransfer: (payload: { from_account: string, total_amount: number, date: string, distributions: {to_account: string, amount: number}[], source_transaction?: string }) => Promise<void>;
  keepInAccount: (transactionId: string) => Promise<void>;
  deleteDistributionTemplate: (id: string) => Promise<void>;
  toggleTemplateActive: (id: string, currentStatus: boolean) => Promise<void>;
  toggleTemplateArchived: (id: string, currentStatus: boolean) => Promise<void>;
  
  // Period Actions
  setCurrentPeriod: (month: number, year: number) => void;

  // Accounts Actions
  fetchAccounts: () => Promise<void>;
  addNode: (parentId: string, node: Partial<AccountNode>) => Promise<void>;
  updateNode: (id: string, updates: Partial<AccountNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  coverOverspending: (accountId: string) => Promise<void>;
  distributeExcess: (accountId: string) => Promise<void>;
  setTree: (newTree: AccountNode[]) => void;
  setPendingIcon: (id: string, blob: Blob | null) => void;
  
  // Transactions Actions
  fetchTransactions: () => Promise<void>;
  fetchGlobalPendingTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Categories Actions
  fetchCategoryGroups: () => Promise<void>;
  assignMoney: (categoryId: string, amount: number) => Promise<void>;
  autoAssign: (rule: string) => Promise<void>;
  addCategoryGroup: (name: string, currency?: 'EUR' | 'BRL') => Promise<void>;
  addCategory: (groupId: string, name: string, currency?: 'EUR' | 'BRL') => Promise<void>;
  updateCategory: (id: string, updates: Partial<CategoryNode>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setCategoryGroups: (groups: CategoryGroup[]) => void;

  // Rebalancing Actions
  autoShield: () => Promise<any>;
  surplusSweep: () => Promise<any>;
  monthEndCascade: (targetCategoryId: string) => Promise<any>;
  
  // Goals Actions
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  copyBudgetFromPreviousMonth: () => Promise<void>;
  autoAssignFunds: () => Promise<void>;
  
  // Helpers
  getAccount: (id: string) => AccountNode | undefined;
  getAccountName: (id: string) => string;
  getCategoryName: (id: string) => string;
  totalsByCurrency: (tree: AccountNode[]) => Record<Currency, number>;
  getHistory: () => { date: string; balance: number }[];

  // Smart Income Splitter Simulator
  splitterDraft: {
    grossReceived: number;
    needsFundValue: number;
    remainingPartner: number;
    rule: string;
  } | null;
  setSplitterDraft: (draft: { grossReceived: number; needsFundValue: number; remainingPartner: number; rule: string; } | null) => void;
}

const now = new Date();

export const useAccountStore = create<AccountState>()(
    (set, get) => ({
      tree: [],
      transactions: [],
      globalPendingTransactions: [],
      categoryGroups: [],
      readyToAssignBalance: 0,
      goals: initialGoals,
      pendingIcons: {},
      distributionTemplates: [],
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),

      setPendingIcon: (id, blob) => {
        set((state) => {
          const newPending = { ...state.pendingIcons };
          if (blob) {
            newPending[id] = blob;
          } else {
            delete newPending[id];
          }
          return { pendingIcons: newPending };
        });
      },

      setCurrentPeriod: (month, year) => {
        set({ currentMonth: month, currentYear: year });
        get().fetchCategoryGroups();
        get().fetchTransactions();
        get().fetchAccounts();
      },

      // --- ACCOUNTS ---
      fetchAccounts: async () => {
        try {
          const { currentMonth, currentYear } = get();
          const response = await authenticatedFetch(`/accounts/tree/?month=${currentMonth}&year=${currentYear}`);
          if (!response.ok) throw new Error("Falha ao buscar contas");
          const data = await response.json();
          set({ tree: Array.isArray(data) ? data : [] });
        } catch (error) {
          console.error("Erro ao buscar contas:", error);
          set({ tree: [] });
        }
      },

      addNode: async (parentId, partialNode) => {
        try {
          const newAccountData = {
            name: partialNode.name || "Nova",
            balance: partialNode.balance ?? 0,
            account_type: partialNode.account_type || "checking",
            parent: parentId !== "root" ? parentId : null,
            currency: partialNode.currency || "EUR",
            ceiling: partialNode.ceiling ?? null,
            exclude_from_totals: partialNode.exclude_from_totals ?? false,
            bank_domain: partialNode.bank_domain ?? "",
            icon_url: partialNode.icon_url ?? null,
          };

          const response = await authenticatedFetch("/accounts/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newAccountData),
          });

          if (!response.ok) throw new Error("Falha ao criar conta");
          
          await get().fetchAccounts();
          await get().fetchTransactions();
          toast.success(`Conta "${partialNode.name}" criada!`);
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      updateNode: async (id, updates) => {
        try {
          const response = await authenticatedFetch(`/accounts/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(updates),
          });

          if (!response.ok) throw new Error("Falha ao atualizar conta");
          
          await get().fetchAccounts();
          await get().fetchTransactions();
          toast.success("Conta atualizada com sucesso!");
        } catch (error: any) {
          toast.error(error.message);
          throw error; // Re-throw para o componente saber que falhou
        }
      },

      deleteNode: async (id) => {
        try {
          const response = await authenticatedFetch(`/accounts/${id}/`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Falha ao excluir conta");
          
          await get().fetchAccounts();
          await get().fetchTransactions();
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      coverOverspending: async (accountId) => {
        try {
          const response = await authenticatedFetch(`/accounts/${accountId}/cover_overspending/`, {
            method: "POST",
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Falha ao cobrir saldo negativo");
          }
          
          await get().fetchAccounts();
          await get().fetchTransactions();
          toast.success("Saldo negativo coberto com sucesso!");
        } catch (error: any) {
          toast.error(error.message);
          throw error;
        }
      },

      distributeExcess: async (accountId) => {
        try {
          const response = await authenticatedFetch(`/accounts/${accountId}/distribute_excess/`, {
            method: "POST",
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Falha ao distribuir excedente");
          }

          await get().fetchAccounts();
          await get().fetchTransactions();
          toast.success("Excedente distribuído com sucesso!");
        } catch (error: any) {
          toast.error(error.message);
          throw error;
        }
      },

      setTree: (newTree) => set({ tree: newTree }),

      // --- TRANSACTIONS ---
      fetchTransactions: async () => {
        try {
          const { currentMonth, currentYear } = get();
          const response = await authenticatedFetch(`/transactions/?month=${currentMonth}&year=${currentYear}`);
          if (!response.ok) throw new Error("Falha ao buscar transações");
          const data = await response.json();
          set({ transactions: Array.isArray(data) ? data : [] });
        } catch (error) {
          console.error("Erro ao buscar transações:", error);
          set({ transactions: [] });
        }
        
        // Sempre buscar as pendências globais junto
        get().fetchGlobalPendingTransactions();
      },

      fetchGlobalPendingTransactions: async () => {
        try {
          const response = await authenticatedFetch(`/transactions/?status=pending`);
          if (!response.ok) throw new Error("Falha ao buscar pendências globais");
          const data = await response.json();
          set({ globalPendingTransactions: Array.isArray(data) ? data : [] });
        } catch (error) {
          console.error("Erro ao buscar pendências globais:", error);
          set({ globalPendingTransactions: [] });
        }
      },

      addTransaction: async (t) => {
        try {
          const response = await authenticatedFetch("/transactions/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t),
          });
          if (!response.ok) throw new Error("Falha ao criar transação");
          await get().fetchTransactions();
          toast.success("Transação adicionada!");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      updateTransaction: async (id, updates) => {
        try {
          const response = await authenticatedFetch(`/transactions/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error("Falha ao atualizar transação");
          await get().fetchTransactions();
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      deleteTransaction: async (id) => {
        try {
          const response = await authenticatedFetch(`/transactions/${id}/`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Falha ao excluir transação");
          await get().fetchTransactions();
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      // --- CATEGORIES ---
      fetchCategoryGroups: async () => {
        try {
          const { currentMonth, currentYear } = get();
          const response = await authenticatedFetch(`/categories/tree/?month=${currentMonth}&year=${currentYear}`);
          if (!response.ok) throw new Error("Falha ao buscar categorias");
          const rtaHeader = response.headers.get('X-Ready-To-Assign');
          const data = await response.json();
          set({
            categoryGroups: data,
            readyToAssignBalance: rtaHeader ? parseFloat(rtaHeader) : 0,
          });
        } catch (error) {
          console.error("Erro ao buscar categorias:", error);
        }
      },

      assignMoney: async (catId, amt) => {
        try {
          const { currentMonth, currentYear } = get();
          const response = await authenticatedFetch(`/monthly-budgets/set_budget/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              category: catId, 
              month: currentMonth, 
              year: currentYear, 
              amount: amt 
            }),
          });
          if (!response.ok) throw new Error("Falha ao alocar dinheiro");
          await get().fetchCategoryGroups();
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      autoAssign: async (rule: string) => {
        try {
          const { currentMonth, currentYear } = get();
          const response = await authenticatedFetch(`/categories/auto_assign/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rule, month: currentMonth, year: currentYear }),
          });
          if (!response.ok) throw new Error("Falha no Auto-Assign");
          await get().fetchCategoryGroups();
          toast.success("Orçamento preenchido automaticamente!");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      addCategoryGroup: async (name, currency) => {
        try {
          const response = await authenticatedFetch("/categories/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, parent: null, currency: currency || "EUR" }),
          });
          if (!response.ok) throw new Error("Falha ao criar grupo");
          await get().fetchCategoryGroups();
          toast.success(`Grupo "${name}" criado!`);
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      addCategory: async (gId, name, currency) => {
        try {
          const response = await authenticatedFetch("/categories/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, parent: gId, currency: currency || "EUR" }),
          });
          if (!response.ok) throw new Error("Falha ao criar categoria");
          await get().fetchCategoryGroups();
          toast.success(`Categoria "${name}" criada!`);
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      updateCategory: async (id, updates) => {
        try {
          const response = await authenticatedFetch(`/categories/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error("Falha ao atualizar categoria");
          await get().fetchCategoryGroups();
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      deleteCategory: async (id) => {
        try {
          const response = await authenticatedFetch(`/categories/${id}/`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Falha ao excluir categoria");
          await get().fetchCategoryGroups();
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      setCategoryGroups: (groups) => set({ categoryGroups: groups }),

      // --- REBALANCING ACTIONS ---
      autoShield: async () => {
        try {
          const { currentMonth, currentYear } = get();
          const response = await authenticatedFetch(`/categories/auto_shield/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month: currentMonth, year: currentYear }),
          });
          if (!response.ok) throw new Error("Falha ao cobrir rombos");
          const result = await response.json();
          await get().fetchCategoryGroups();
          toast.success(`Escudo aplicado! ${result.total_moved.toFixed(2)}€ redistribuídos.`);
          return result;
        } catch (error: any) {
          toast.error(error.message);
          throw error;
        }
      },

      surplusSweep: async () => {
        try {
          const { currentMonth, currentYear } = get();
          const response = await authenticatedFetch(`/categories/surplus_sweep/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month: currentMonth, year: currentYear }),
          });
          if (!response.ok) throw new Error("Falha ao recolher sobras");
          const result = await response.json();
          await get().fetchCategoryGroups();
          toast.success(`Sobras recolhidas! ${result.total_returned_to_rta.toFixed(2)}€ devolvidos ao RTA.`);
          return result;
        } catch (error: any) {
          toast.error(error.message);
          throw error;
        }
      },

      monthEndCascade: async (targetCategoryId: string) => {
        try {
          const { currentMonth, currentYear } = get();
          const response = await authenticatedFetch(`/categories/month_end_cascade/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month: currentMonth, year: currentYear, target_category_id: targetCategoryId }),
          });
          if (!response.ok) throw new Error("Falha na cascata de fim de mês");
          const result = await response.json();
          await get().fetchCategoryGroups();
          toast.success(`Limpeza concluída! ${result.total_transferred.toFixed(2)}€ transferidos para ${result.target_category}.`);
          return result;
        } catch (error: any) {
          toast.error(error.message);
          throw error;
        }
      },

      // --- GOALS ---
      fetchGoals: async () => {
        try {
          const response = await authenticatedFetch("/goals/");
          if (!response.ok) throw new Error("Falha ao buscar metas");
          const data = await response.json();
          set({ goals: data });
        } catch (error) {
          console.error("Erro ao buscar metas:", error);
        }
      },

      addGoal: async (goal) => {
        try {
          const response = await authenticatedFetch("/goals/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(goal),
          });
          if (!response.ok) throw new Error("Falha ao criar meta");
          await get().fetchGoals();
          toast.success("Meta criada!");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      updateGoal: async (id, updates) => {
        try {
          const response = await authenticatedFetch(`/goals/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error("Falha ao atualizar meta");
          await get().fetchGoals();
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      deleteGoal: async (id) => {
        try {
          const response = await authenticatedFetch(`/goals/${id}/`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Falha ao excluir meta");
          await get().fetchGoals();
          toast.success("Meta excluída!");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      copyBudgetFromPreviousMonth: async () => {
        try {
          const { currentMonth, currentYear, categoryGroups } = get();
          const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
          const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

          // Busca orçamentos do mês anterior
          const response = await authenticatedFetch(`/monthly-budgets/?month=${prevMonth}&year=${prevYear}`);
          if (!response.ok) throw new Error("Falha ao buscar orçamentos do mês anterior");
          const prevBudgets = await response.json();

          // Aplica para o mês atual
          for (const budget of prevBudgets) {
            await authenticatedFetch(`/monthly-budgets/set_budget/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                category: budget.category, 
                month: currentMonth, 
                year: currentYear, 
                amount: budget.amount 
              }),
            });
          }
          await get().fetchCategoryGroups();
          toast.success("Orçamento copiado com sucesso!");
        } catch (error: any) {
          toast.error("Erro ao copiar orçamento: " + error.message);
        }
      },

      autoAssignFunds: async () => {
        try {
          const { categoryGroups, readyToAssignBalance, assignMoney } = get();
          let currentPool = readyToAssignBalance;

          if (currentPool <= 0) {
            toast.warning("Não há saldo disponível para alocar (Ready to Assign) no momento.");
            return;
          }

          // Coleta todas as categorias folhas da árvore
          const leaves: CategoryNode[] = [];
          const walk = (nodes: CategoryNode[]) => {
            if (!Array.isArray(nodes)) return;
            for (const node of nodes) {
              if (!node) continue;
              if (node.children && node.children.length > 0) {
                walk(node.children);
              } else {
                leaves.push(node);
              }
            }
          };
          walk(categoryGroups);

          // Filtra apenas categorias que possuem metas configuradas (target_value > 0)
          const targetCategories = leaves.filter(cat => cat.target_value && cat.target_value > 0);

          if (targetCategories.length === 0) {
            toast.warning("Nenhuma categoria com metas de provisão (target_value) cadastrada.");
            return;
          }

          // Ordena as categorias priorizando NEEDED_FOR_SPENDING sobre SAVINGS_BUILDER
          targetCategories.sort((a, b) => {
            const getBehavior = (cat: CategoryNode) => 
              cat.target_type === 'SAVINGS_BUILDER' || cat.target_behavior === 'SAVINGS_BUILDER' 
                ? 'SAVINGS_BUILDER' 
                : 'NEEDED_FOR_SPENDING';
            
            const behaviorA = getBehavior(a);
            const behaviorB = getBehavior(b);

            if (behaviorA === 'NEEDED_FOR_SPENDING' && behaviorB !== 'NEEDED_FOR_SPENDING') return -1;
            if (behaviorA !== 'NEEDED_FOR_SPENDING' && behaviorB === 'NEEDED_FOR_SPENDING') return 1;
            return 0;
          });

          let totalAllocatedThisRun = 0;

          // Itera sobre as metas para distribuir os fundos
          for (const cat of targetCategories) {
            if (currentPool <= 0) {
              toast.info("O saldo disponível para alocação esgotou durante a distribuição.");
              break;
            }

            const targetVal = cat.target_value || 0;
            const behavior = cat.target_type === 'SAVINGS_BUILDER' || cat.target_behavior === 'SAVINGS_BUILDER'
              ? 'SAVINGS_BUILDER'
              : 'NEEDED_FOR_SPENDING';
            let amountToAssign = 0;

            if (behavior === 'NEEDED_FOR_SPENDING') {
              // Condition A: Aloca apenas a diferença necessária para atingir a meta
              const available = cat.available_amount || 0;
              if (available < targetVal) {
                amountToAssign = targetVal - available;
              }
            } else {
              // Condition B: SAVINGS_BUILDER - ignora o saldo atual e aloca o target completo
              amountToAssign = targetVal;
            }

            if (amountToAssign > 0) {
              // Garante que não alocamos mais do que temos no RTA
              const finalAssign = Math.min(amountToAssign, currentPool);
              
              // O valor alocado acumula sobre o valor que a categoria já possuía de alocação no mês
              const newAssignedAmount = (cat.assigned_amount || 0) + finalAssign;
              
              await assignMoney(cat.id, newAssignedAmount);
              
              currentPool -= finalAssign;
              totalAllocatedThisRun += finalAssign;
            }
          }

          await get().fetchCategoryGroups();
          toast.success(`Distribuição concluída! R$ ${totalAllocatedThisRun.toFixed(2)} alocados com sucesso.`);
        } catch (error: any) {
          toast.error("Erro na distribuição das metas: " + error.message);
        }
      },

      // --- DISTRIBUTIONS ---
      fetchDistributionTemplates: async () => {
        try {
          const response = await authenticatedFetch("/distribution-templates/");
          if (!response.ok) throw new Error("Falha ao buscar modelos");
          const data = await response.json();
          set({ distributionTemplates: data });
        } catch (error) {
          console.error("Erro ao buscar modelos de distribuição:", error);
        }
      },

      saveDistributionTemplate: async (template) => {
        try {
          const method = template.id ? "PUT" : "POST";
          const url = template.id ? `/distribution-templates/${template.id}/` : "/distribution-templates/";
          
          const response = await authenticatedFetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(template),
          });
          
          if (!response.ok) throw new Error("Falha ao salvar modelo");
          await get().fetchDistributionTemplates();
          toast.success("Modelo salvo com sucesso!");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      deleteDistributionTemplate: async (id) => {
        try {
          const response = await authenticatedFetch(`/distribution-templates/${id}/`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Falha ao excluir modelo");
          await get().fetchDistributionTemplates();
          toast.success("Modelo excluído com sucesso!");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      toggleTemplateActive: async (id, currentStatus) => {
        try {
          const response = await authenticatedFetch(`/distribution-templates/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !currentStatus }),
          });
          if (!response.ok) throw new Error("Falha ao alternar status ativo");
          await get().fetchDistributionTemplates();
          toast.success(!currentStatus ? "Modelo ativado!" : "Modelo desativado!");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      toggleTemplateArchived: async (id, currentStatus) => {
        try {
          const response = await authenticatedFetch(`/distribution-templates/${id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_archived: !currentStatus }),
          });
          if (!response.ok) throw new Error("Falha ao arquivar/desarquivar modelo");
          await get().fetchDistributionTemplates();
          toast.success(!currentStatus ? "Modelo arquivado!" : "Modelo desarquivado!");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      executeBulkTransfer: async (payload) => {
        try {
          const response = await authenticatedFetch("/transactions/bulk_transfer/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error("Falha ao executar distribuição");
          
          // Atualizar saldos e transações
          await get().fetchAccounts();
          await get().fetchTransactions();
          toast.success("Distribuição concluída!");
        } catch (error: any) {
          toast.error(error.message);
          throw error;
        }
      },

      keepInAccount: async (transactionId) => {
        try {
          const response = await authenticatedFetch(`/transactions/${transactionId}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transfer_group: crypto.randomUUID() }),
          });
          if (!response.ok) throw new Error("Falha ao atualizar transação");
          await get().fetchTransactions();
          toast.success("Receita mantida na conta original.");
        } catch (error: any) {
          toast.error(error.message);
        }
      },

      // --- HELPERS ---
      getAccount: (id) => {
        const idStr = String(id);
        const tree = Array.isArray(get().tree) ? get().tree : [];
        const findAccount = (nodes: AccountNode[]): AccountNode | undefined => {
          if (!Array.isArray(nodes)) return undefined;
          for (const node of nodes) {
            if (node && String(node.id) === idStr) return node;
            if (node && Array.isArray(node.children)) {
              const found = findAccount(node.children);
              if (found) return found;
            }
          }
        };
        return findAccount(tree);
      },

      getAccountName: (id) => {
        const acc = get().getAccount(id);
        return acc ? acc.name : "Conta";
      },

      getCategoryName: (id) => {
        const idStr = String(id);
        const groups = Array.isArray(get().categoryGroups) ? get().categoryGroups : [];
        const findCategory = (nodes: CategoryNode[]): string | undefined => {
          if (!Array.isArray(nodes)) return undefined;
          for (const node of nodes) {
            if (node && String(node.id) === idStr) return node.name;
            if (node && Array.isArray(node.children)) {
              const name = findCategory(node.children);
              if (name) return name;
            }
          }
        };
        return findCategory(groups) || "Categoria";
      },

      totalsByCurrency: (tree: AccountNode[]): Record<Currency, number> => {
        const totals: Record<Currency, number> = { EUR: 0, BRL: 0, USD: 0 };
        const walk = (node: AccountNode, inherited: Currency) => {
          if (!node) return;
          const cur = node.currency ?? inherited;
          if (!node.exclude_from_totals) {
            const balance = Number(node.balance) || 0;
            totals[cur] += balance;
          }
          if (Array.isArray(node.children)) {
            node.children.forEach((c) => walk(c, cur));
          }
        };
        if (Array.isArray(tree)) {
          tree.forEach((root) => {
            if (root) walk(root, root.currency ?? "EUR");
          });
        }
        return totals;
      },

      getHistory: () => {
        const transactions = get().transactions || [];
        if (!transactions || !transactions.length) return [];

        // Ordenar transações por data
        const sorted = [...transactions].sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        let currentBalance = 0; // Simplified
        const history: { date: string; balance: number }[] = [];
        
        sorted.forEach(t => {
          const amount = t.is_income ? t.amount : -t.amount;
          currentBalance += amount;
          history.push({ date: t.date, balance: currentBalance });
        });
        
        return history;
      },

      splitterDraft: null,
      setSplitterDraft: (draft) => set({ splitterDraft: draft }),
    })
);

export const selectMacroDistribution = (state: { categoryGroups: CategoryGroup[], transactions: Transaction[], currentMonth: number, currentYear: number }) => {
  let needsAssigned = 0;
  let wantsAssigned = 0;
  let savingsAssigned = 0;

  const traverseAndSum = (node: CategoryNode) => {
    if (!node) return;
    const allocation = node.macro_allocation || node.macro_rule;
    
    if (allocation === 'NEEDS') {
      needsAssigned += node.assigned_amount || 0;
      return;
    } else if (allocation === 'WANTS') {
      wantsAssigned += node.assigned_amount || 0;
      return;
    } else if (allocation === 'SAVINGS') {
      savingsAssigned += node.assigned_amount || 0;
      return;
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        traverseAndSum(child);
      }
    }
  };

  const groups = Array.isArray(state.categoryGroups) ? state.categoryGroups : [];
  for (const group of groups) {
    if (group) {
      traverseAndSum(group);
    }
  }

  const txs = Array.isArray(state.transactions) ? state.transactions : [];
  const totalInc = txs.reduce((acc, t) => {
    if (!t || !t.date || typeof t.date !== "string") return acc;
    const parts = t.date.split('-');
    if (parts.length < 2) return acc;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const isCorrectPeriod = month === state.currentMonth && year === state.currentYear;
    if (t.is_income && isCorrectPeriod) {
      return acc + Math.abs(Number(t.amount) || 0);
    }
    return acc;
  }, 0);

  const needsPct = totalInc > 0 ? (needsAssigned / totalInc) * 100 : 0;
  const wantsPct = totalInc > 0 ? (wantsAssigned / totalInc) * 100 : 0;
  const savingsPct = totalInc > 0 ? (savingsAssigned / totalInc) * 100 : 0;

  return {
    needsAssigned,
    wantsAssigned,
    savingsAssigned,
    totalIncome: totalInc,
    needsPct,
    wantsPct,
    savingsPct,
  };
};
