import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "EUR" | "BRL" | "USD";

interface CurrencyState {
  rates: Record<Currency, number>;
  lastUpdated: string | null;
  isLoading: boolean;
  fetchRates: () => Promise<void>;
  convert: (amount: number, from: Currency, to: Currency) => number;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      rates: {
        EUR: 1,
        BRL: 6.0, // Fallback values
        USD: 1.08,
      },
      lastUpdated: null,
      isLoading: false,

      fetchRates: async () => {
        set({ isLoading: true });
        try {
          // Using a free, no-key-required API
          const response = await fetch("https://open.er-api.com/v6/latest/EUR");
          const data = await response.json();
          
          if (data && data.rates) {
            set({
              rates: {
                EUR: 1,
                BRL: data.rates.BRL,
                USD: data.rates.USD,
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
        // Convert to EUR first (base)
        const inEur = amount / rates[from];
        // Convert from EUR to target
        return inEur * rates[to];
      },
    }),
    {
      name: "vault-currency-storage",
    }
  )
);
