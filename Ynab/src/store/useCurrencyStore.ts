import { create } from "zustand";
import { Currency } from "../types";

interface CurrencyState {
  rates: Record<string, number>;
  lastUpdated: string | null;
  baseCurrency: Currency;
  isLoading: boolean;
  fetchRates: () => Promise<void>;
  convert: (amount: number, from: Currency, to: Currency) => number;
  setBaseCurrency: (cur: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  (set, get) => ({
    rates: {
      EUR: 1,
      BRL: 6.0,
      USD: 1.08,
    },
    lastUpdated: null,
    baseCurrency: (typeof window !== "undefined" && localStorage.getItem("baseCurrency")) || "EUR",
    isLoading: false,

    fetchRates: async () => {
      set({ isLoading: true });
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/EUR");
        const data = await response.json();
        
        if (data && data.rates) {
          set({
            rates: {
              ...data.rates,
              EUR: 1, // ensure base is exactly 1
            },
            lastUpdated: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
      } finally {
        set({ isLoading: false });
      }
    },

    convert: (amount, from, to) => {
      const { rates } = get();
      const rateFrom = rates[from] || 1;
      const rateTo = rates[to] || 1;
      // Convert to EUR first (base)
      const inEur = amount / rateFrom;
      // Convert from EUR to target
      return inEur * rateTo;
    },

    setBaseCurrency: (cur: Currency) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("baseCurrency", cur);
      }
      set({ baseCurrency: cur });
    },
  })
);
