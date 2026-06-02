import { useState, useEffect } from "react";
import { formatMoney } from "@/shared/lib/currency-utils";
import { useWealthStore } from "../store/useWealthStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { TrendingUp, TrendingDown, Landmark, Briefcase, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AddInvestmentActivityModal } from "../components/AddInvestmentActivityModal";
import { InvestmentLedger } from "../components/InvestmentLedger";

export default function Investments() {
  const { summary, activities, fetchSummary, fetchActivities, deleteAsset, isLoading } = useWealthStore();
  
  useEffect(() => {
    fetchSummary();
    fetchActivities();
  }, [fetchSummary, fetchActivities]);

  const totalNetWorth = summary?.total_net_worth || 0;
  
  // Agrupar holdings
  const fixedIncomeHoldings = summary?.holdings.filter(h => h.asset_type === 'FIXED_INCOME' || h.asset_type === 'TREASURY') || [];
  const stockHoldings = summary?.holdings.filter(h => h.asset_type === 'STOCK') || [];
  const otherHoldings = summary?.holdings.filter(h => !['FIXED_INCOME', 'TREASURY', 'STOCK'].includes(h.asset_type)) || [];

  const getNetValue = (h: any) => h.net_value ?? (h.quantity * h.average_cost);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in">
      
      {/* HEADER: PORTFOLIO SUMMARY */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investimentos</h1>
          <p className="text-muted-foreground mt-1">Gestão inteligente de portfólio e custódia.</p>
        </div>
        <AddInvestmentActivityModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="col-span-1 md:col-span-2 relative overflow-hidden rounded-2xl sm:rounded-3xl gradient-card border border-border/60 p-4 sm:p-8 shadow-elevated transition-all">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full"
            style={{ background: "var(--gradient-glow)" }}
          />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.18em] text-muted-foreground">
              <Landmark className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              Patrimônio Líquido Total
            </div>

            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <h1 className="text-2xl xs:text-3xl sm:text-5xl font-bold tabular tracking-tight text-gradient-mixed transition-all duration-500">
                {formatMoney(totalNetWorth, 'BRL')}
              </h1>
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Yield Saudável
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground ml-2">Valor Bruto (Sem dedução de IR)</span>
            </div>
          </div>
        </section>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground font-medium text-sm">Resumo da Carteira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Renda Fixa & Tesouro</span>
                </div>
                <span className="text-sm">{formatMoney(fixedIncomeHoldings.reduce((acc, h) => acc + getNetValue(h), 0), 'BRL')}</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Renda Variável</span>
                </div>
                <span className="text-sm">{formatMoney(stockHoldings.reduce((acc, h) => acc + getNetValue(h), 0), 'BRL')}</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Outros / Cripto</span>
                </div>
                <span className="text-sm">{formatMoney(otherHoldings.reduce((acc, h) => acc + getNetValue(h), 0), 'BRL')}</span>
             </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="inventory">Inventário de Ativos</TabsTrigger>
          <TabsTrigger value="ledger">Histórico</TabsTrigger>
        </TabsList>
        
        {/* TABS: ASSET INVENTORY LIST */}
        <TabsContent value="inventory" className="mt-6 space-y-6">
          
          {fixedIncomeHoldings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-500" /> Renda Fixa (Brasil)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixedIncomeHoldings.map((asset) => (
                  <Card key={asset.asset_id} className="relative hover:border-primary/50 transition-colors group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start pr-6">
                        <div>
                          <CardTitle className="text-base">{asset.ticker}</CardTitle>
                          <CardDescription className="text-xs truncate max-w-[150px]">{asset.name}</CardDescription>
                        </div>
                        {asset.rate_type === 'PREFIXED' || asset.indexer === 'PRE' ? (
                          <Badge variant="outline" className="text-[10px]">
                            {asset.interest_rate}% a.a.
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {asset.interest_rate}% {asset.indexer || 'CDI'}
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Deseja excluir este investimento?")) {
                            deleteAsset(asset.asset_id);
                          }
                        }}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir Investimento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatMoney(getNetValue(asset), asset.currency)}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Valor Bruto</div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                        <span>Aportado: {formatMoney(asset.total_cost_basis, asset.currency)}</span>
                        {asset.percentage_yield !== undefined && (
                            <span className={asset.percentage_yield >= 0 ? "text-emerald-500" : "text-red-500"}>
                                {asset.percentage_yield >= 0 ? '+' : ''}{asset.percentage_yield}%
                            </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {stockHoldings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> Renda Variável
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stockHoldings.map((asset) => (
                  <Card key={asset.asset_id} className="relative hover:border-primary/50 transition-colors group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start pr-6">
                        <div>
                          <CardTitle className="text-base">{asset.ticker}</CardTitle>
                          <CardDescription className="text-xs truncate max-w-[150px]">{asset.name}</CardDescription>
                        </div>
                        <span className="text-xs font-mono">{asset.quantity} cotas</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Deseja excluir este investimento?")) {
                            deleteAsset(asset.asset_id);
                          }
                        }}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir Investimento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                          <div className="text-2xl font-bold">{formatMoney(getNetValue(asset), asset.currency)}</div>
                          {asset.percentage_yield !== undefined && (
                              <Badge variant="outline" className={asset.percentage_yield >= 0 ? "text-emerald-500 border-emerald-500/30" : "text-red-500 border-red-500/30"}>
                                  {asset.percentage_yield >= 0 ? <TrendingUp className="h-3 w-3 mr-1"/> : <TrendingDown className="h-3 w-3 mr-1"/>}
                                  {asset.percentage_yield}%
                              </Badge>
                          )}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 mt-1">Valor Bruto</div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>Cota Atual: {formatMoney(asset.current_price || asset.average_cost, asset.currency)}</span>
                        <span>PM: {formatMoney(asset.average_cost, asset.currency)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </TabsContent>

        {/* TABS: ACTIVITY LEDGER */}
        <TabsContent value="ledger" className="mt-6">
          <InvestmentLedger />
        </TabsContent>
      </Tabs>
    </div>
  );
}
