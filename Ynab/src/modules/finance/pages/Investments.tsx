import { useState, useEffect } from "react";
import { formatMoney } from "@/shared/lib/currency-utils";
import { useWealthStore } from "../store/useWealthStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { TrendingUp, TrendingDown, Landmark, Briefcase, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AddInvestmentActivityModal } from "../components/AddInvestmentActivityModal";

export default function Investments() {
  const { summary, activities, fetchSummary, fetchActivities, isLoading } = useWealthStore();
  
  useEffect(() => {
    fetchSummary();
    fetchActivities();
  }, [fetchSummary, fetchActivities]);

  const totalNetWorth = summary?.total_net_worth || 0;
  
  // Agrupar holdings
  const fixedIncomeHoldings = summary?.holdings.filter(h => h.asset_type === 'FIXED_INCOME') || [];
  const stockHoldings = summary?.holdings.filter(h => h.asset_type === 'STOCK') || [];
  const otherHoldings = summary?.holdings.filter(h => !['FIXED_INCOME', 'STOCK'].includes(h.asset_type)) || [];

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
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border-zinc-800 shadow-xl dark:from-zinc-950 dark:to-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 font-medium text-sm">Patrimônio Líquido Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <span className="text-5xl font-bold tracking-tighter">
                {formatMoney(totalNetWorth, 'BRL')}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Yield Saudável
                </Badge>
                <span className="text-xs text-zinc-500">Deduzido de IR/IOF</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground font-medium text-sm">Resumo da Carteira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Renda Fixa</span>
                </div>
                <span className="text-sm">{formatMoney(fixedIncomeHoldings.reduce((acc, h) => acc + (h.quantity * h.average_cost), 0), 'BRL')}</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Renda Variável</span>
                </div>
                <span className="text-sm">{formatMoney(stockHoldings.reduce((acc, h) => acc + (h.quantity * h.average_cost), 0), 'BRL')}</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Outros / Cripto</span>
                </div>
                <span className="text-sm">{formatMoney(otherHoldings.reduce((acc, h) => acc + (h.quantity * h.average_cost), 0), 'BRL')}</span>
             </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="inventory">Inventário de Ativos</TabsTrigger>
          <TabsTrigger value="ledger">Histórico (Ledger)</TabsTrigger>
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
                  <Card key={asset.asset_id} className="cursor-pointer hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{asset.ticker}</CardTitle>
                          <CardDescription className="text-xs truncate max-w-[150px]">{asset.name}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px]">100% CDI</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatMoney(asset.quantity * asset.average_cost, asset.currency)}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>Aportado: {formatMoney(asset.total_invested, asset.currency)}</span>
                        <span className="text-emerald-500">Líquido (Pós-IR)</span>
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
                  <Card key={asset.asset_id} className="cursor-pointer hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{asset.ticker}</CardTitle>
                          <CardDescription className="text-xs truncate max-w-[150px]">{asset.name}</CardDescription>
                        </div>
                        <span className="text-xs font-mono">{asset.quantity} cotas</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatMoney(asset.quantity * asset.average_cost, asset.currency)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Preço Médio: {formatMoney(asset.average_cost, asset.currency)}
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
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Livro-razão de todas as compras, vendas e proventos.</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  Nenhuma atividade registrada ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${activity.activity_type === 'BUY' ? 'bg-blue-500/10 text-blue-500' : activity.activity_type === 'SELL' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'}`}>
                          {activity.activity_type === 'BUY' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.asset_ticker} <span className="text-muted-foreground font-normal ml-1">({activity.activity_type})</span></p>
                          <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatMoney(activity.quantity * activity.unit_price, 'BRL')}</p>
                        <p className="text-xs text-muted-foreground">{activity.quantity} cotas a {formatMoney(activity.unit_price, 'BRL')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
