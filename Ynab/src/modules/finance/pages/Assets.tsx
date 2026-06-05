import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Plus,
  TrendingUp,
  AlertCircle,
  Clock,
  Trash2,
  Edit,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAssetStore } from "../store/useAssetStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { formatMoney } from "@/shared/lib/currency-utils";
import { AddAssetModal } from "../components/AddAssetModal";
import { PullToRefresh } from "@/shared/components/dashboard/PullToRefresh";
import { Progress } from "@/shared/components/ui/progress";

export const Assets = () => {
  const { assets, runway, fetchAssets, fetchRunway, deleteAsset, isLoading } = useAssetStore();
  const { baseCurrency } = useCurrencyStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<any>(null);

  useEffect(() => {
    Promise.all([fetchAssets(), fetchRunway()]).catch((err) =>
      console.error("Erro no fetch paralelo de ativos:", err)
    );
  }, [fetchAssets, fetchRunway]);

  const handleRefresh = async () => {
    await Promise.all([fetchAssets(), fetchRunway()]);
  };

  const totals = useMemo(() => {
    let liquid = 0;
    let illiquid = 0;
    let totalPurchased = 0;

    assets.forEach((asset) => {
      totalPurchased += Number(asset.purchase_value);
      if (asset.liquidity_tier === "ILLIQUID") {
        illiquid += Number(asset.effective_asset_value);
      } else {
        liquid += Number(asset.effective_asset_value);
      }
    });

    const netWorthAssets = liquid + illiquid;

    return { liquid, illiquid, netWorthAssets, totalPurchased };
  }, [assets]);

  const handleEdit = (asset: any) => {
    setAssetToEdit(asset);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este ativo patrimonial?")) {
      await deleteAsset(id);
    }
  };

  // Nivel de progresso do Runway
  const runwayProgress = useMemo(() => {
    if (!runway || runway.runway_months === null) return 0;
    // Normalizar a barra de progresso (considerando 12 meses como meta ideal para 100%)
    return Math.min(100, (runway.runway_months / 12) * 100);
  }, [runway]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-4 sm:gap-6 pb-10 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-widest">
                Gestão Patrimonial
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Ativos & Patrimônio Líquido
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cadastre seus bens de valor, consulte seu valor líquido efetivo e verifique a sua robustez contra emergências.
            </p>
          </div>
          <Button
            onClick={() => {
              setAssetToEdit(null);
              setIsModalOpen(true);
            }}
            className="gradient-primary text-primary-foreground rounded-xl shadow-glow hover:scale-[1.02] transition-transform self-start"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Registrar Ativo
          </Button>
        </div>

        {/* ── PAINEL DO TERMÔMETRO DE LIQUIDEZ ──────────── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl gradient-card border border-border/60 p-5 sm:p-8 shadow-elevated transition-all">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/5 -translate-y-8 translate-x-8" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Termômetro */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                <Sparkles className="h-4 w-4" /> Termômetro de Liquidez (Runway)
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl sm:text-4xl font-black text-foreground">
                    {runway && runway.runway_months !== null ? (
                      <span>{runway.runway_months.toFixed(1)} <span className="text-sm sm:text-lg font-medium text-muted-foreground">meses de autonomia</span></span>
                    ) : (
                      <span className="text-lg font-medium text-muted-foreground">Sem dados suficientes</span>
                    )}
                  </h3>
                  {runway && runway.runway_months !== null && (
                    <span className="text-[10px] text-muted-foreground">Meta ideal: 12 meses</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Progress value={runwayProgress} className="h-3 rounded-full bg-muted/40" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0 meses</span>
                    <span>6 meses</span>
                    <span>12+ meses</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Este termômetro estima por quanto tempo o seu patrimônio líquido altamente realizável (<strong>imediato e médio</strong>) cobre seu custo de vida mensal (atualmente em <strong className="text-foreground">{runway ? formatMoney(runway.average_monthly_expenses, baseCurrency) : "€0,00"}</strong>). Ativos ilíquidos como carros e imóveis são ignorados neste cálculo por segurança.
              </p>
            </div>

            {/* Sumário */}
            <div className="flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-border/60 pt-4 lg:pt-0 lg:pl-6 gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Patrimônio Bruto Total</span>
                <p className="text-xl font-bold text-foreground">{formatMoney(totals.netWorthAssets, baseCurrency)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Líquido (Imediata/Média)</span>
                  <p className="text-sm font-semibold text-emerald-400">{formatMoney(totals.liquid, baseCurrency)}</p>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Ilíquido (Bens/Físico)</span>
                  <p className="text-sm font-semibold text-amber-400">{formatMoney(totals.illiquid, baseCurrency)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── GRID DE ATIVOS ──────────── */}
        {assets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => {
              const isLiquid = asset.liquidity_tier !== "ILLIQUID";
              const progressPct = asset.purchase_value > 0 
                ? Math.min(200, (asset.current_market_value / asset.purchase_value) * 100) 
                : 100;
              const hasAppreciated = asset.current_market_value >= asset.purchase_value;

              return (
                <div
                  key={asset.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Linha 1 */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{asset.name}</h3>
                        <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border mt-1 font-semibold ${
                          asset.liquidity_tier === "IMMEDIATE" 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : asset.liquidity_tier === "MEDIUM" 
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}>
                          {asset.liquidity_tier === "IMMEDIATE" 
                            ? "Liquidez Imediata" 
                            : asset.liquidity_tier === "MEDIUM" 
                            ? "Liquidez Média" 
                            : "Ilíquido"}
                        </span>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Valores Principais */}
                    <div className="py-2.5 border-y border-border/40 my-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground">Valor Aquisição</span>
                        <p className="font-semibold text-muted-foreground">{formatMoney(asset.purchase_value, baseCurrency)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Valor Mercado</span>
                        <p className="font-semibold text-foreground">{formatMoney(asset.current_market_value, baseCurrency)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé e Valor Efetivo */}
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-2 text-xs">
                      <span className="text-muted-foreground">Valor Líquido Efetivo</span>
                      <p className="font-bold text-gradient-primary text-sm">
                        {formatMoney(asset.effective_asset_value, baseCurrency)}
                      </p>
                    </div>

                    {asset.linked_debt && (
                      <div className="mt-2 text-[10px] text-rose-400 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10 flex items-center justify-between">
                        <span>Financiamento associado:</span>
                        <span className="font-semibold">{asset.linked_debt_name}</span>
                      </div>
                    )}

                    {/* Barra de evolucao de valor */}
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[8px] text-muted-foreground mb-1">
                        <span>Variação de Valor</span>
                        <span className={hasAppreciated ? "text-emerald-400" : "text-rose-400"}>
                          {progressPct.toFixed(0)}% ({hasAppreciated ? "+" : ""}{(progressPct - 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${hasAppreciated ? "bg-emerald-500" : "bg-rose-500"}`}
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/20 p-10 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Sem ativos registrados</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comece registrando seus bens para visualizar a evolução do seu Net Worth e Runway.
              </p>
            </div>
            <Button
              onClick={() => {
                setAssetToEdit(null);
                setIsModalOpen(true);
              }}
              size="sm"
              className="gradient-primary text-primary-foreground rounded-xl shadow-glow"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Cadastrar Primeiro Ativo
            </Button>
          </div>
        )}

        {/* Modal de Criacao/Edicao */}
        <AddAssetModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          assetToEdit={assetToEdit}
        />
      </div>
    </PullToRefresh>
  );
};
