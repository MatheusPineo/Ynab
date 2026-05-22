import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authenticatedFetch } from "@/shared/lib/api";

interface SidebarStore {
  hiddenItems: string[];
  toggleItem: (key: string) => void;
  setHiddenItems: (items: string[]) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      hiddenItems: [],
      toggleItem: (key) =>
        set((state) => {
          const newItems = state.hiddenItems.includes(key)
            ? state.hiddenItems.filter((item) => item !== key)
            : [...state.hiddenItems, key];
          
          authenticatedFetch("/core/profile/update/", {
            method: "POST",
            body: JSON.stringify({ hidden_sidebar_items: newItems }),
          }).catch(() => {});
          
          return { hiddenItems: newItems };
        }),
      setHiddenItems: (items) => set({ hiddenItems: items }),
    }),
    {
      name: "vault_sidebar_preferences",
    }
  )
);
