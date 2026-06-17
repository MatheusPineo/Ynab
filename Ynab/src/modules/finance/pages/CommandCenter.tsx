import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";
import { useAssetStore } from "@/modules/finance/store/useAssetStore";
import { useDebtStore } from "@/modules/finance/store/useDebtStore";
import { formatMoney } from "@/shared/lib/currency-utils";
import { Wallet, ArrowRightLeft, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { NetWorthHeader } from "@/modules/finance/components/NetWorthHeader";
import { PullToRefresh } from "@/shared/components/dashboard/PullToRefresh";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";
import { MoveMoneyModal } from "@/modules/finance/components/MoveMoneyModal";

const CommandCenter = () => {
  const { 
    fetchAccounts, fetchCategoryGroups, fetchTransactions, fetchGlobalPendingTransactions,
    tree, categoryGroups, globalPendingTransactions, readyToAssignBalance, currentMonth, currentYear,
    autoAssignFunds
  } = useAccountStore();
  
  const { fetchRates, convert, baseCurrency, setBaseCurrency } = useCurrencyStore();
  const { fetchAssets, assets } = useAssetStore();
  const { fetchDebts, debts } = useDebtStore();

  useEffect(() => {
    Promise.all([
      fetchAccounts(),
      fetchCategoryGroups(),
      fetchTransactions(),
      fetchGlobalPendingTransactions(),
      fetchRates(),
      fetchAssets(),
      fetchDebts()
    ]).catch(err => console.error("Erro no carregamento do Command Center:", err));
  }, [fetchAccounts, fetchCategoryGroups, fetchTransactions, fetchGlobalPendingTransactions, fetchRates, fetchAssets, fetchDebts, currentMonth, currentYear]);

  const handleRefresh = async () => {
    await Promise.all([
      fetchAccounts(), fetchCategoryGroups(), fetchTransactions(), fetchGlobalPendingTransactions(), fetchRates(), fetchAssets(), fetchDebts()
    ]);
  };

  // NetWorth Calculation (True Physical Balance)
  const netWorth = useMemo(() => {
    const totalsByCur = useAccountStore.getState().totalsByCurrency(tree);
    const cash = Object.entries(totalsByCur).reduce((acc, [cur, amount]) => acc + convert(amount, cur as any, baseCurrency), 0);
    const sumEffectiveAssets = assets.reduce((acc, asset) => acc + (Number(asset.effective_asset_value) || 0), 0);
    const linkedDebtIds = new Set(assets.map(a => a.linked_debt).filter(Boolean));
    const unlinkedDebtsAmount = debts
      .filter(d => d.is_mine && !linkedDebtIds.has(d.id))
      .reduce((acc, d) => acc + convert(Number(d.amount_remaining) || 0, (d.currency || baseCurrency) as any, baseCurrency), 0);
    return cash + sumEffectiveAssets - unlinkedDebtsAmount;
  }, [tree, convert, baseCurrency, assets, debts]);

  // Pending Clearing Calculations
  const pendingTotal = useMemo(() => {
    return globalPendingTransactions.reduce((acc, t) => acc + (!t.is_income ? Math.abs(Number(t.amount)) : 0), 0);
  }, [globalPendingTransactions]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-6 pb-10 animate-in fade-in duration-500">
        
        {/* 1. TOP HEADER: Physical Truth */}
        <div className="relative">
          <NetWorthHeader base={baseCurrency} onBaseChange={setBaseCurrency} customTotal={netWorth} />
        </div>

        {/* 2. WATERFALL ROUTING: Ready to Assign */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl border p-5 backdrop-blur-md transition-all duration-500",
            readyToAssignBalance > 0 
              ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
              : "bg-card/40 border-border/60 shadow-soft"
          )}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", readyToAssignBalance > 0 ? "bg-emerald-500/20" : "bg-muted/30")}>
                <Wallet className={cn("h-5 w-5", readyToAssignBalance > 0 ? "text-emerald-500" : "text-muted-foreground")} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest opacity-80">Pronto para Alocar</h2>
                <p className={cn("text-2xl font-black tracking-tight", readyToAssignBalance > 0 ? "text-emerald-400" : "text-foreground")}>
                  {formatMoney(readyToAssignBalance, baseCurrency)}
                </p>
              </div>
            </div>
            {readyToAssignBalance > 0 ? (
              <Button onClick={autoAssignFunds} className="gradient-primary text-xs font-bold rounded-xl h-9 px-6 shadow-glow">
                Distribuir Fundos
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" /> Todo dinheiro tem uma função
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 3. MAIN GRID (70%): The Operating Ledger (Envelopes) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Livro Razão Operacional</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              {categoryGroups.map((group) => (
                <div key={group.id} className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-soft">
                  <div className="bg-muted/20 px-4 py-3 border-b border-border/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.name}</h4>
                  </div>
                  <div className="divide-y divide-border/40">
                    {group.children?.map((cat) => {
                      const available = (cat.assigned_amount || 0) - (cat.spent_amount || 0);
                      const isOverspent = available < 0;
                      const progressPct = cat.assigned_amount > 0 ? Math.min(100, ((cat.spent_amount || 0) / cat.assigned_amount) * 100) : 0;

                      return (
                        <div key={cat.id} className={cn("p-4 transition-colors hover:bg-muted/10 group", isOverspent && "bg-rose-500/5")}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                            <span className={cn("text-sm font-bold font-mono", isOverspent ? "text-rose-400" : "text-emerald-400")}>
                              {formatMoney(available, baseCurrency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2 font-mono">
                            <span>Alocado: {formatMoney(cat.assigned_amount || 0, baseCurrency)}</span>
                            <span>Gasto: {formatMoney(cat.spent_amount || 0, baseCurrency)}</span>
                          </div>
                          <div className="relative h-1.5 w-full rounded-full bg-muted/40 overflow-hidden mb-3">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-700", isOverspent ? "bg-rose-500" : "bg-emerald-500")}
                              style={{ width: `${Math.max(progressPct, isOverspent ? 100 : 0)}%` }}
                            />
                          </div>
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoveMoneyModal
                              sourceCategory={cat}
                              currentAvailable={available}
                              trigger={
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold gap-1 rounded-lg hover:bg-primary/10 hover:text-primary">
                                  <ArrowRightLeft className="h-3 w-3" /> Mover Dinheiro
                                </Button>
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. RIGHT SIDEBAR (30%): The Clearing House */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-card/40 backdrop-blur-md p-5 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Câmara de Compensação</h3>
              </div>
              <p className="text-[10px] text-muted-foreground mb-4">Obrigações em trânsito. O dinheiro ainda está no banco, mas já foi deduzido dos envelopes.</p>
              
              <div className="bg-background/40 border border-border/40 rounded-xl p-4 mb-4 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total a Liquidar</span>
                <span className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                  {formatMoney(pendingTotal, baseCurrency)}
                </span>
              </div>

              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                {globalPendingTransactions.length > 0 ? globalPendingTransactions.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-border/40 bg-card/60 hover:border-amber-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-semibold text-foreground truncate pr-2">{t.description}</p>
                      <p className="text-xs font-bold text-rose-400 font-mono shrink-0">-{formatMoney(Math.abs(Number(t.amount)), baseCurrency)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] text-muted-foreground">
                        {t.date ? format(parseISO(t.date), "dd MMM", { locale: ptBR }) : ""}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border text-amber-500 bg-amber-500/10 border-amber-500/20">
                        Aguardando Fatura
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center flex flex-col items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mb-2" />
                    <span className="text-xs text-muted-foreground">Nenhuma transação em trânsito.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </PullToRefresh>
  );
};

export default CommandCenter;
