import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authenticatedFetch } from "@/shared/lib/api";

interface SidebarStore {
  hiddenItems: string[];
  sidebarOrder: string[];
  toggleItem: (key: string) => void;
  setHiddenItems: (items: string[]) => void;
  setSidebarOrder: (order: string[]) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      hiddenItems: [],
      sidebarOrder: [],
      toggleItem: (key) =>
        set((state) => {
          const newItems = state.hiddenItems.includes(key)
            ? state.hiddenItems.filter((item) => item !== key)
            : [...state.hiddenItems, key];
          
          authenticatedFetch("/auth/profile/update/", {
            method: "POST",
            body: JSON.stringify({ 
              hidden_sidebar_items: newItems,
              sidebar_order: state.sidebarOrder 
            }),
          }).catch(() => {});
          
          return { hiddenItems: newItems };
        }),
      setHiddenItems: (items) => set({ hiddenItems: items }),
      setSidebarOrder: (order) =>
        set((state) => {
          authenticatedFetch("/auth/profile/update/", {
            method: "POST",
            body: JSON.stringify({ 
              hidden_sidebar_items: state.hiddenItems,
              sidebar_order: order 
            }),
          }).catch(() => {});
          return { sidebarOrder: order };
        }),
    }),
    {
      name: "vault_sidebar_preferences",
    }
  )
);
