import { create } from "zustand";
import { persist } from "zustand/middleware";
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

// Initial Mock Categories
const initialCategories: CategoryGroup[] = [
  {
    id: "g1",
    name: "Custos Fixos",
    categories: [
      { id: "c1", name: "Arrendamento/Aluguel", assigned: 800, spent: 0 },
      { id: "c2", name: "Água e Luz", assigned: 150, spent: 0 },
      { id: "c3", name: "Internet", assigned: 40, spent: 0 },
    ],
  },
  {
    id: "g2",
    name: "Variáveis",
    categories: [
      { id: "c4", name: "Mercado", assigned: 400, spent: 0 },
      { id: "c5", name: "Uber/Transporte", assigned: 100, spent: 0 },
      { id: "c6", name: "Restaurantes", assigned: 200, spent: 0 },
    ],
  },
];

const initialGoals: Goal[] = [
  { id: "goal1", name: "Viagem ao Japão", targetAmount: 5000, currentAmount: 1200, deadline: "2026-12-01", emoji: "🗾" },
  { id: "goal2", name: "Reserva de Emergência", targetAmount: 10000, currentAmount: 4500, deadline: "2025-12-31", emoji: "🛡️" },
  { id: "goal3", name: "MacBook Pro", targetAmount: 2500, currentAmount: 800, deadline: "2025-08-15", emoji: "💻" },
];

interface AccountState {
  tree: AccountNode[];
  transactions: Transaction[];
  categoryGroups: CategoryGroup[];
  goals: Goal[];
  // Actions
  addNode: (parentId: string, node: Partial<AccountNode>) => void;
  updateNode: (id: string, updates: Partial<AccountNode>) => void;
  deleteNode: (id: string) => void;
  setTree: (newTree: AccountNode[]) => void;
  // Transactions
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  // Budget Actions
  assignMoney: (categoryId: string, amount: number) => void;
  addCategoryGroup: (name: string) => void;
  addCategory: (groupId: string, name: string) => void;
  setCategoryGroups: (groups: CategoryGroup[]) => void;
  // Goals Actions
  addGoal: (goal: Omit<Goal, "id">) => void;
  updateGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  // Helpers
  getAccountName: (id: string) => string;
  getCategoryName: (id: string) => string;
}

function findNodeRecursive(nodes: AccountNode[], id: string): AccountNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeRecursive(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function updateBalanceRecursive(nodes: AccountNode[], accountId: string, amount: number): AccountNode[] {
  return nodes.map((node) => {
    if (node.id === accountId) {
      return { ...node, balance: (node.balance || 0) + amount };
    }
    if (node.children) {
      return { ...node, children: updateBalanceRecursive(node.children, accountId, amount) };
    }
    return node;
  });
}

function addNodeRecursive(nodes: AccountNode[], parentId: string, newNode: AccountNode): AccountNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children || []), newNode] };
    }
    if (node.children) {
      return { ...node, children: addNodeRecursive(node.children, parentId, newNode) };
    }
    return node;
  });
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      tree: initialTree,
      transactions: [],
      categoryGroups: initialCategories,
      goals: initialGoals,

      addNode: (parentId, partialNode) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newNode: AccountNode = {
          id,
          name: partialNode.name || "Nova Sub-conta",
          balance: partialNode.balance ?? 0,
          base: partialNode.base ?? 0,
          ...partialNode,
        };
        set((state) => ({ tree: addNodeRecursive(state.tree, parentId, newNode) }));
      },

      updateNode: (id, updates) => {
        const updateRecursive = (nodes: AccountNode[]): AccountNode[] => {
          return nodes.map((node) => {
            if (node.id === id) return { ...node, ...updates };
            if (node.children) return { ...node, children: updateRecursive(node.children) };
            return node;
          });
        };
        set((state) => ({ tree: updateRecursive(state.tree) }));
      },

      deleteNode: (id) => {
        const deleteRecursive = (nodes: AccountNode[]): AccountNode[] => {
          return nodes
            .filter((node) => node.id !== id)
            .map((node) => ({
              ...node,
              children: node.children ? deleteRecursive(node.children) : undefined,
            }));
        };
        set((state) => ({ tree: deleteRecursive(state.tree) }));
      },

      setTree: (newTree) => set({ tree: newTree }),

      addTransaction: (t) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newTransaction: Transaction = { ...t, id };
        
        set((state) => {
          const newGroups = state.categoryGroups.map(group => ({
            ...group,
            categories: group.categories.map(cat => {
              if (cat.id === t.category) {
                return { ...cat, spent: cat.spent + Math.abs(t.amount) };
              }
              return cat;
            })
          }));

          return {
            transactions: [newTransaction, ...state.transactions],
            tree: updateBalanceRecursive(state.tree, t.accountId, t.amount),
            categoryGroups: newGroups
          };
        });
      },

      updateTransaction: (id, updates) => {
        const oldT = get().transactions.find(t => t.id === id);
        if (!oldT) return;

        set((state) => {
          // 1. Revert old balances
          let workingTree = updateBalanceRecursive(state.tree, oldT.accountId, -oldT.amount);
          let workingGroups = state.categoryGroups.map(group => ({
            ...group,
            categories: group.categories.map(cat => 
              cat.id === oldT.category ? { ...cat, spent: cat.spent - Math.abs(oldT.amount) } : cat
            )
          }));

          // 2. Apply new balances
          workingTree = updateBalanceRecursive(workingTree, updates.accountId, updates.amount);
          workingGroups = workingGroups.map(group => ({
            ...group,
            categories: group.categories.map(cat => 
              cat.id === updates.category ? { ...cat, spent: cat.spent + Math.abs(updates.amount) } : cat
            )
          }));

          return {
            transactions: state.transactions.map(t => t.id === id ? { ...updates, id } : t),
            tree: workingTree,
            categoryGroups: workingGroups
          };
        });
      },

      deleteTransaction: (id) => {
        const t = get().transactions.find(t => t.id === id);
        if (!t) return;

        set((state) => ({
          transactions: state.transactions.filter(tr => tr.id !== id),
          tree: updateBalanceRecursive(state.tree, t.accountId, -t.amount),
          categoryGroups: state.categoryGroups.map(group => ({
            ...group,
            categories: group.categories.map(cat => 
              cat.id === t.category ? { ...cat, spent: cat.spent - Math.abs(t.amount) } : cat
            )
          }))
        }));
      },

      assignMoney: (categoryId, amount) => {
        set((state) => ({
          categoryGroups: state.categoryGroups.map(group => ({
            ...group,
            categories: group.categories.map(cat => 
              cat.id === categoryId ? { ...cat, assigned: amount } : cat
            )
          }))
        }));
      },

      addCategoryGroup: (name) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          categoryGroups: [...state.categoryGroups, { id, name, categories: [] }]
        }));
      },

      addCategory: (groupId, name) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          categoryGroups: state.categoryGroups.map(group => 
            group.id === groupId 
              ? { ...group, categories: [...group.categories, { id, name, assigned: 0, spent: 0 }] }
              : group
          )
        }));
      },

      setCategoryGroups: (groups) => set({ categoryGroups: groups }),

      addGoal: (goal) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ goals: [...state.goals, { ...goal, id }] }));
      },

      updateGoal: (id, amount) => {
        set((state) => ({
          goals: state.goals.map(g => g.id === id ? { ...g, currentAmount: amount } : g)
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter(g => g.id !== id) }));
      },

      getAccountName: (id) => {
        const node = findNodeRecursive(get().tree, id);
        return node?.name || "Conta desconhecida";
      },

      getCategoryName: (id) => {
        for (const group of get().categoryGroups) {
          const cat = group.categories.find(c => c.id === id);
          if (cat) return cat.name;
        }
        return "Sem categoria";
      }
    }),
    {
      name: "vault-accounts-storage",
    }
  )
);
