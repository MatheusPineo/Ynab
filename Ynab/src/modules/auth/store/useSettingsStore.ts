import { create } from "zustand";

interface SettingsState {
  isPrivateMode: boolean;
  showDecimals: boolean;
  togglePrivateMode: () => void;
  toggleDecimals: () => void;
  setPrivateMode: (val: boolean) => void;
  setDecimals: (val: boolean) => void;
}

const safeGetItem = (key: string): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

const safeSetItem = (key: string, value: string) => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

export const useSettingsStore = create<SettingsState>((set) => ({
  isPrivateMode: safeGetItem("vault_private_mode") === "true",
  showDecimals: safeGetItem("vault_show_decimals") !== "false", // default true

  togglePrivateMode: () => set((state) => {
    const newVal = !state.isPrivateMode;
    safeSetItem("vault_private_mode", String(newVal));
    return { isPrivateMode: newVal };
  }),

  toggleDecimals: () => set((state) => {
    const newVal = !state.showDecimals;
    safeSetItem("vault_show_decimals", String(newVal));
    return { showDecimals: newVal };
  }),

  setPrivateMode: (val) => {
    safeSetItem("vault_private_mode", String(val));
    set({ isPrivateMode: val });
  },

  setDecimals: (val) => {
    safeSetItem("vault_show_decimals", String(val));
    set({ showDecimals: val });
  },
}));
