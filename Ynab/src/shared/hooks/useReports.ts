import { useQuery } from "@tanstack/react-query";
import { authenticatedFetch } from "@/shared/lib/api";

export interface MonthlyCashflowItem {
  name: string;
  Entradas: number;
  Saídas: number;
}

export interface ExpenseByCategoryItem {
  name: string;
  value: number;
  percent: string;
}

export interface ExpenseByCategoryResponse {
  chartData: ExpenseByCategoryItem[];
  total: number;
  highSpendAlerts: string[];
}

export interface NetWorthItem {
  name: string;
  Ativos: number;
  Passivos: number;
  "Patrimônio Líquido": number;
}

export interface CreditCardUsageItem {
  card_name: string;
  total_spent: number;
}

export const useReports = () => {
  const useMonthlyCashflow = (month: number, year: number) => {
    return useQuery<MonthlyCashflowItem[]>({
      queryKey: ["reports", "monthly_cashflow", month, year],
      queryFn: async () => {
        const response = await authenticatedFetch(`/reports/monthly_cashflow/?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Failed to fetch monthly cashflow");
        return response.json();
      },
    });
  };

  const useExpensesByCategory = (month: number, year: number) => {
    return useQuery<ExpenseByCategoryResponse>({
      queryKey: ["reports", "expenses_by_category", month, year],
      queryFn: async () => {
        const response = await authenticatedFetch(`/reports/expenses_by_category/?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Failed to fetch expenses by category");
        return response.json();
      },
    });
  };

  const useNetWorthEvolution = (months: number = 6) => {
    return useQuery<NetWorthItem[]>({
      queryKey: ["reports", "net_worth_evolution", months],
      queryFn: async () => {
        const response = await authenticatedFetch(`/reports/net_worth_evolution/?months=${months}`);
        if (!response.ok) throw new Error("Failed to fetch net worth evolution");
        return response.json();
      },
    });
  };

  const useCreditCardUsage = (month: number, year: number) => {
    return useQuery<CreditCardUsageItem[]>({
      queryKey: ["reports", "credit_card_usage", month, year],
      queryFn: async () => {
        const response = await authenticatedFetch(`/reports/credit_card_usage/?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Failed to fetch credit card usage");
        return response.json();
      },
    });
  };

  return {
    useMonthlyCashflow,
    useExpensesByCategory,
    useNetWorthEvolution,
    useCreditCardUsage,
  };
};
