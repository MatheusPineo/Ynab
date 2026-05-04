import { useState, useMemo, useEffect } from "react";
import { NetWorthHeader } from "@/components/dashboard/NetWorthHeader";
import { AccountAccordion } from "@/components/dashboard/AccountAccordion";
import { useAccountStore } from "@/store/useAccountStore";
import { useCurrencyStore, type Currency } from "@/store/useCurrencyStore";
import { AddRootAccountModal } from "@/components/dashboard/AddRootAccountModal";

const Accounts = () => {
  const { tree, fetchAccounts } = useAccountStore();
  const { fetchRates, convert, isLoading, baseCurrency, setBaseCurrency } = useCurrencyStore();


  useEffect(() => {
    fetchRates();
    fetchAccounts();
  }, [fetchAccounts, fetchRates]);

  // Recalculate net worth using real-time rates from store
  const total = useMemo(() => {
    const totalsByCur = useAccountStore.getState().totalsByCurrency(tree);

    return (Object.entries(totalsByCur) as [Currency, number][]).reduce(
      (acc, [cur, amount]) => acc + convert(amount, cur, baseCurrency),
      0,
    );
  }, [tree, baseCurrency, convert]);

  return (
    <>
      <NetWorthHeader base={baseCurrency} onBaseChange={setBaseCurrency} customTotal={total} />

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
        {/* Botão para adicionar nova conta raiz */}
        <AddRootAccountModal />
      </div>

      <AccountAccordion tree={tree} />

      <div className="h-8" />
    </>
  );
};

export default Accounts;
