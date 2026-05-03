import { create } from "zustand";

export type Currency = "EUR" | "BRL" | "USD";

interface CurrencyState {
  rates: Record<Currency, number>;
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
        BRL: 6.0, // Fallback values
        USD: 1.08,
      },
      lastUpdated: null,
      baseCurrency: (typeof window !== "undefined" && localStorage.getItem("baseCurrency") as Currency) || "EUR",
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
        const inEur = amount / (rates[from] || 1);
        // Convert from EUR to target
        return inEur * (rates[to] || 1);
      },
      setBaseCurrency: (cur: Currency) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("baseCurrency", cur);
        }
        set({ baseCurrency: cur });
      },
    })
);
