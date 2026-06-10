import { useEffect } from "react";
import { AccountAccordion } from "@/modules/finance/components/AccountAccordion";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";
import { AddRootAccountModal } from "@/modules/finance/components/AddRootAccountModal";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";

const Accounts = () => {
  const { tree, fetchAccounts } = useAccountStore();
  const { fetchRates, isLoading } = useCurrencyStore();

  useEffect(() => {
    fetchRates();
    fetchAccounts();
  }, [fetchAccounts, fetchRates]);

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between gap-4 mt-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
            Minhas contas
            <HelpTooltip content="Visualize e gerencie todos os seus locais de armazenamento de dinheiro (bancos, carteiras, cartões)." side="right" />
            {isLoading && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Toque numa conta para expandir. Cadastre aqui apenas locais reais onde seu dinheiro repousa (Bancos, Carteiras, Corretoras).
          </p>
        </div>
        {/* Botão para adicionar nova conta raiz */}
        <div className="shrink-0">
          <AddRootAccountModal />
        </div>
      </div>

      <AccountAccordion tree={tree} />

      <div className="h-8" />
    </>
  );
};

export default Accounts;
