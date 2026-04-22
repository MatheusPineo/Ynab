import { useState, useMemo, useEffect } from "react";
import { NetWorthHeader } from "@/components/dashboard/NetWorthHeader";
import { AccountAccordion } from "@/components/dashboard/AccountAccordion";
import { netWorth } from "@/data/mockData";
import { useAccountStore } from "@/store/useAccountStore";
import { useCurrencyStore, type Currency } from "@/store/useCurrencyStore";

const Dashboard = () => {
  const [base, setBase] = useState<Currency>("EUR");
  const { tree, fetchAccounts } = useAccountStore();
  const { fetchRates, convert, isLoading } = useCurrencyStore();

  useEffect(() => {
    fetchRates();
    fetchAccounts();
  }, [fetchAccounts, fetchRates]);

  // Recalculate net worth using real-time rates from store
  const total = useMemo(() => {
    // Custom networth logic using the store's convert function
    const totalsByCur: Record<Currency, number> = { EUR: 0, BRL: 0, USD: 0 };
    
    const walk = (node: any, inherited: Currency) => {
      const cur = (node.currency || inherited) as Currency;
      if (typeof node.balance === "number") {
        totalsByCur[cur] += node.balance;
      }
      node.children?.forEach((c: any) => walk(c, cur));
    };
    
    tree.forEach((root) => walk(root, (root.currency || "EUR") as Currency));
    
    return (Object.entries(totalsByCur) as [Currency, number][]).reduce(
      (acc, [cur, amount]) => acc + convert(amount, cur, base),
      0,
    );
  }, [tree, base, convert]);

  return (
    <>
      <NetWorthHeader base={base} onBaseChange={setBase} customTotal={total} />

      {/* Section header */}
      <div className="flex items-baseline justify-between mt-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
            Minhas contas
            {isLoading && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toque numa conta para expandir. Use o <span className="text-primary">+</span> para criar sub-contas.
          </p>
        </div>
      </div>

      <AccountAccordion tree={tree} />

      <div className="h-8" />
    </>
  );
};

export default Dashboard;
