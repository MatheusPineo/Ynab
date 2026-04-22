import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authenticatedFetch } from "@/lib/api";
import {
  type AccountNode,
  type Transaction,
  accountsTree as initialTree,
} from "@/data/mockData";

export interface BudgetCategory {
  id: string;
  name: string;
  assigned: number;
  spent: number;
}

export interface CategoryGroup {
  id: string;
  name: string;
  categories: BudgetCategory[];
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  emoji: string;
}

const initialCategories: CategoryGroup[] = [
  {
    id: "g1",
    name: "Custos Fixos",
    categories: [
      { id: "c1", name: "Aluguel", assigned: 800, spent: 0 },
      { id: "c2", name: "Água e Luz", assigned: 150, spent: 0 },
    ],
  },
];

const initialGoals: Goal[] = [];

interface AccountState {
  tree: AccountNode[];
  transactions: Transaction[];
  categoryGroups: CategoryGroup[];
  goals: Goal[];
  fetchAccounts: () => Promise<void>;
  addNode: (parentId: string, node: Partial<AccountNode>) => void;
  updateNode: (id: string, updates: Partial<AccountNode>) => void;
  deleteNode: (id: string) => void;
  setTree: (newTree: AccountNode[]) => void;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  assignMoney: (categoryId: string, amount: number) => void;
  addCategoryGroup: (name: string) => void;
  addCategory: (groupId: string, name: string) => void;
  setCategoryGroups: (groups: CategoryGroup[]) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  updateGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  getAccountName: (id: string) => string;
  getCategoryName: (id: string) => string;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      tree: initialTree,
      transactions: [],
      categoryGroups: initialCategories,
      goals: initialGoals,

      fetchAccounts: async () => {
        try {
          const response = await authenticatedFetch("/accounts/");
          if (!response.ok) throw new Error("Falha ao buscar contas");
          const data = await response.json();
          set({ tree: data });
        } catch (error) {
          console.error("Erro ao buscar contas:", error);
        }
      },

      addNode: (parentId, partialNode) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNode: AccountNode = { id, name: partialNode.name || "Nova", balance: partialNode.balance ?? 0, base: partialNode.base ?? 0, ...partialNode };
        set((state) => ({ tree: addNodeRecursive(state.tree, parentId, newNode) }));
      },

      updateNode: (id, updates) => {
        const updateRecursive = (nodes: AccountNode[]): AccountNode[] => nodes.map(n => n.id === id ? { ...n, ...updates } : n.children ? { ...n, children: updateRecursive(n.children) } : n);
        set((state) => ({ tree: updateRecursive(state.tree) }));
      },

      deleteNode: (id) => {
        const deleteRecursive = (nodes: AccountNode[]): AccountNode[] => nodes.filter(n => n.id !== id).map(n => ({ ...n, children: n.children ? deleteRecursive(n.children) : undefined }));
        set((state) => ({ tree: deleteRecursive(state.tree) }));
      },

      setTree: (newTree) => set({ tree: newTree }),
      addTransaction: (t) => set((state) => ({ transactions: [{...t, id: Math.random().toString()}, ...state.transactions] })),
      updateTransaction: (id, updates) => set((state) => ({ transactions: state.transactions.map(t => t.id === id ? {...updates, id} : t) })),
      deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),
      assignMoney: (catId, amt) => set((state) => ({ categoryGroups: state.categoryGroups.map(g => ({...g, categories: g.categories.map(c => c.id === catId ? {...c, assigned: amt} : c)})) })),
      addCategoryGroup: (name) => set((state) => ({ categoryGroups: [...state.categoryGroups, { id: Math.random().toString(), name, categories: [] }] })),
      addCategory: (gId, name) => set((state) => ({ categoryGroups: state.categoryGroups.map(g => g.id === gId ? {...g, categories: [...g.categories, {id: Math.random().toString(), name, assigned:0, spent:0}]} : g) })),
      setCategoryGroups: (groups) => set({ categoryGroups: groups }),
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, {...goal, id: Math.random().toString()}] })),
      updateGoal: (id, amt) => set((state) => ({ goals: state.goals.map(g => g.id === id ? {...g, currentAmount: amt} : g) })),
      deleteGoal: (id) => set((state) => ({ goals: state.goals.filter(g => g.id !== id) })),
      getAccountName: (id) => "Conta",
      getCategoryName: (id) => "Categoria"
    }),
    { name: "vault-accounts-storage" }
  )
);
