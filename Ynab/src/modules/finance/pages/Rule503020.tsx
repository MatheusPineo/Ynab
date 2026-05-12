import { useState, useMemo, useEffect } from "react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";
import { formatMoney } from "@/shared/lib/currency-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  Home, Sparkles, TrendingUp, ChevronLeft, ChevronRight,
  Info, CheckCircle2, AlertTriangle, XCircle, Wallet, Link2, Unlink2,
} from "lucide-react";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { useFeatureStore } from "@/shared/store/useFeatureStore";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---- Store local de config do 50-30-20 ----
interface Rule503020Config {
  monthlyIncome: number;
  setMonthlyIncome: (v: number) => void;
  connectedToBudget: boolean;
  toggleConnectedToBudget: () => void;
  // Mapeamentos: qual categoria de orçamento mapeia para qual balde
  categoryMapping: Record<string, "needs" | "wants" | "future">;
  setCategoryMapping: (catId: string, bucket: "needs" | "wants" | "future") => void;
}

const useRule503020Store = create<Rule503020Config>()(
  persist(
    (set) => ({
      monthlyIncome: 0,
      setMonthlyIncome: (v) => set({ monthlyIncome: v }),
      connectedToBudget: false,
      toggleConnectedToBudget: () => set((s) => ({ connectedToBudget: !s.connectedToBudget })),
      categoryMapping: {},
      setCategoryMapping: (catId, bucket) =>
        set((s) => ({ categoryMapping: { ...s.categoryMapping, [catId]: bucket } })),
    }),
    { name: "vault_rule_503020" }
  )
);

// ---- Helpers ----
const BUCKET_CONFIG = {
  needs: {
    label: "Necessidades",
    percent: 50,
    color: "#3b82f6",
    icon: Home,
    desc: "Gastos essenciais: aluguel, alimentação, saúde, transporte.",
    gradient: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  wants: {
    label: "Desejos",
    percent: 30,
    color: "#f59e0b",
    icon: Sparkles,
    desc: "Gastos de estilo de vida: lazer, restaurantes, streaming.",
    gradient: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  future: {
    label: "Futuro",
    percent: 20,
    color: "#10b981",
    icon: TrendingUp,
    desc: "Reserva de emergência, investimentos e quitação de dívidas.",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
} as const;

type BucketKey = keyof typeof BUCKET_CONFIG;

const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function StatusIcon({ pct, target }: { pct: number; target: number }) {
  if (pct <= target) return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
  if (pct <= target * 1.1) return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
  return <XCircle className="h-4 w-4 text-rose-400 shrink-0" />;
}

// ---- Componente principal ----
const Rule503020 = () => {
  const { transactions, categoryGroups, currentMonth, currentYear, setCurrentPeriod, fetchTransactions, fetchCategoryGroups } = useAccountStore();
  const { features } = useFeatureStore();
  const {
    monthlyIncome, setMonthlyIncome,
    connectedToBudget, toggleConnectedToBudget,
    categoryMapping, setCategoryMapping,
  } = useRule503020Store();

  const [incomeInput, setIncomeInput] = useState(monthlyIncome > 0 ? String(monthlyIncome) : "");

  useEffect(() => {
    fetchTransactions();
    fetchCategoryGroups();
  }, [fetchTransactions, fetchCategoryGroups]);

  // Renda efetiva: se conectado ao orçamento, usa receitas do período; senão usa input manual
  const periodIncomes = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];
    return txs.filter(t => {
      if (!t.date) return false;
      const [y, m] = t.date.split("-").map(Number);
      return t.is_income && !t.transfer_group && m === currentMonth && y === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const effectiveIncome = useMemo(() => {
    if (connectedToBudget && features.budget) {
      return periodIncomes.reduce((sum, t) => sum + Number(t.amount), 0);
    }
    return monthlyIncome;
  }, [connectedToBudget, features.budget, periodIncomes, monthlyIncome]);

  // Despesas reais do período por balde (via mapeamento de categoria)
  const spentByBucket = useMemo(() => {
    const result: Record<BucketKey, number> = { needs: 0, wants: 0, future: 0 };
    const txs = Array.isArray(transactions) ? transactions : [];

    txs.forEach(t => {
      if (t.is_income || t.transfer_group || !t.date) return;
      const [y, m] = t.date.split("-").map(Number);
      if (m !== currentMonth || y !== currentYear) return;

      const bucket = t.category ? categoryMapping[String(t.category)] : undefined;
      if (bucket) {
        result[bucket] += Math.abs(Number(t.amount));
      }
    });

    // Se conectado ao orçamento, usa também o spent_amount das categorias mapeadas
    if (connectedToBudget && features.budget) {
      const processNodes = (nodes: any[]) => {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            processNodes(node.children);
          }
        });
      };
      processNodes(categoryGroups);
    }

    return result;
  }, [transactions, categoryMapping, currentMonth, currentYear, connectedToBudget, features.budget, categoryGroups]);

  // Alvos
  const targets = useMemo(() => ({
    needs: effectiveIncome * 0.5,
    wants: effectiveIncome * 0.3,
    future: effectiveIncome * 0.2,
  }), [effectiveIncome]);

  // Dados para gráfico de pizza
  const pieData = useMemo(() => [
    { name: "Necessidades (50%)", value: targets.needs, color: BUCKET_CONFIG.needs.color },
    { name: "Desejos (30%)", value: targets.wants, color: BUCKET_CONFIG.wants.color },
    { name: "Futuro (20%)", value: targets.future, color: BUCKET_CONFIG.future.color },
  ], [targets]);

  const realPieData = useMemo(() => {
    const total = spentByBucket.needs + spentByBucket.wants + spentByBucket.future;
    if (total === 0) return [];
    return [
      { name: "Necessidades", value: spentByBucket.needs, color: BUCKET_CONFIG.needs.color },
      { name: "Desejos", value: spentByBucket.wants, color: BUCKET_CONFIG.wants.color },
      { name: "Futuro", value: spentByBucket.future, color: BUCKET_CONFIG.future.color },
    ].filter(d => d.value > 0);
  }, [spentByBucket]);

  // Todas as categorias folha para mapeamento
  const leafCategories = useMemo(() => {
    const leaves: { id: string; name: string; group: string }[] = [];
    categoryGroups.forEach((group: any) => {
      (group.children || []).forEach((cat: any) => {
        leaves.push({ id: String(cat.id), name: cat.name, group: group.name });
      });
    });
    return leaves;
  }, [categoryGroups]);

  const handleIncomeBlur = () => {
    const v = parseFloat(incomeInput.replace(",", "."));
    if (!isNaN(v) && v >= 0) setMonthlyIncome(v);
  };

  const handlePrev = () => {
    if (currentMonth === 1) setCurrentPeriod(12, currentYear - 1);
    else setCurrentPeriod(currentMonth - 1, currentYear);
  };
  const handleNext = () => {
    if (currentMonth === 12) setCurrentPeriod(1, currentYear + 1);
    else setCurrentPeriod(currentMonth + 1, currentYear);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow shrink-0">
              <span className="text-sm font-black text-white">50</span>
            </div>
            Regra 50-30-20
          </h1>
          <p className="text-sm text-muted-foreground">
            Divida sua renda líquida em Necessidades, Desejos e Futuro de forma simples e visual.
          </p>
        </div>

        {/* Seletor de mês */}
        <div className="flex items-center gap-2 bg-muted/20 px-3 py-2 rounded-2xl border border-border/40 shadow-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handlePrev}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="flex flex-col items-center min-w-[110px]">
            <span className="text-xs sm:text-sm font-bold">{monthNames[currentMonth - 1]}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">{currentYear}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleNext}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Config Panel */}
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Configuração da Renda
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {/* Toggle orçamento */}
          {features.budget && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fonte da Renda</Label>
              <Button
                variant="outline"
                onClick={toggleConnectedToBudget}
                className={cn(
                  "rounded-xl h-10 gap-2 font-semibold border text-sm",
                  connectedToBudget
                    ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                    : "text-muted-foreground border-border/50 hover:border-border"
                )}
              >
                {connectedToBudget ? <Link2 className="h-4 w-4" /> : <Unlink2 className="h-4 w-4" />}
                {connectedToBudget ? "Conectado ao Orçamento" : "Renda Manual"}
              </Button>
            </div>
          )}

          {/* Input manual */}
          {(!connectedToBudget || !features.budget) && (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Label htmlFor="income-input" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Renda Mensal Líquida
              </Label>
              <Input
                id="income-input"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                onBlur={handleIncomeBlur}
                placeholder="Ex: 5000"
                className="bg-background/50 rounded-xl h-10"
              />
            </div>
          )}

          {/* Renda efetiva */}
          <div className="flex flex-col gap-1 ml-auto text-right">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Renda Efetiva do Mês</span>
            <span className="text-2xl font-black text-primary">
              {formatMoney(effectiveIncome, "BRL")}
            </span>
            {connectedToBudget && features.budget && (
              <span className="text-[10px] text-muted-foreground">Soma das receitas de {monthNames[currentMonth - 1]}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(BUCKET_CONFIG) as [BucketKey, typeof BUCKET_CONFIG[BucketKey]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const target = targets[key];
          const spent = spentByBucket[key];
          const pct = target > 0 ? (spent / target) * 100 : 0;
          const remaining = target - spent;

          return (
            <Card
              key={key}
              className={cn(
                "rounded-3xl border backdrop-blur-sm bg-gradient-to-b overflow-hidden",
                cfg.gradient, cfg.border
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: `${cfg.color}22` }}>
                      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">{cfg.label}</CardTitle>
                      <span className="text-xs text-muted-foreground">{cfg.percent}% da renda</span>
                    </div>
                  </div>
                  <HelpTooltip content={cfg.desc} side="top">
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </HelpTooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Alvo */}
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Meta</span>
                  <span className="text-lg font-black" style={{ color: cfg.color }}>
                    {formatMoney(target, "BRL")}
                  </span>
                </div>

                {/* Gasto real */}
                {(spent > 0 || connectedToBudget) && (
                  <>
                    <Progress
                      value={Math.min(pct, 100)}
                      className="h-2 bg-muted/30"
                    />
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <StatusIcon pct={pct} target={100} />
                        <span className="text-muted-foreground">Gasto: <strong className="text-foreground">{formatMoney(spent, "BRL")}</strong></span>
                      </div>
                      <span className={cn("font-bold", remaining >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {remaining >= 0 ? `+${formatMoney(remaining, "BRL")}` : `-${formatMoney(Math.abs(remaining), "BRL")}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">
                      {pct.toFixed(1)}% utilizado
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Pizza: Distribuição Ideal */}
        <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Distribuição Ideal</CardTitle>
            <CardDescription>Como sua renda deve ser dividida pela regra</CardDescription>
          </CardHeader>
          <CardContent>
            {effectiveIncome > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                      formatter={(value: number) => formatMoney(value, "BRL")}
                    />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                Informe sua renda para ver o gráfico
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pizza: Gastos Reais */}
        <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Gastos Reais do Mês</CardTitle>
            <CardDescription>Como suas despesas estão distribuídas pelos baldes</CardDescription>
          </CardHeader>
          <CardContent>
            {realPieData.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={realPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                      {realPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                      formatter={(value: number) => formatMoney(value, "BRL")}
                    />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center flex-col gap-2 text-sm text-muted-foreground">
                <Info className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-center max-w-[200px]">Mapeie suas categorias abaixo para ver os gastos reais</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mapeamento de categorias */}
      {leafCategories.length > 0 && (
        <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" /> Mapeamento de Categorias
            </CardTitle>
            <CardDescription>
              Associe cada categoria do seu orçamento a um dos três baldes para rastrear gastos reais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-w-2xl">
              {leafCategories.map(cat => {
                const currentBucket = categoryMapping[cat.id];
                return (
                  <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-2xl bg-muted/20 border border-border/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.group}</p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {(Object.entries(BUCKET_CONFIG) as [BucketKey, typeof BUCKET_CONFIG[BucketKey]][]).map(([bKey, bCfg]) => (
                        <button
                          key={bKey}
                          onClick={() => setCategoryMapping(cat.id, bKey)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200",
                            currentBucket === bKey
                              ? bCfg.badge + " scale-105 shadow-sm"
                              : "bg-transparent text-muted-foreground border-border/40 hover:border-border"
                          )}
                        >
                          {bCfg.percent}% {bCfg.label}
                        </button>
                      ))}
                      {currentBucket && (
                        <button
                          onClick={() => {
                            const next = { ...categoryMapping };
                            delete next[cat.id];
                            useRule503020Store.setState({ categoryMapping: next });
                          }}
                          className="px-2 py-1.5 rounded-xl text-xs text-muted-foreground border border-border/40 hover:border-rose-500/30 hover:text-rose-400 transition-all"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo educativo */}
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> Como funciona a Regra 50-30-20?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(Object.entries(BUCKET_CONFIG) as [BucketKey, typeof BUCKET_CONFIG[BucketKey]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className={cn("p-4 rounded-2xl bg-gradient-to-b border space-y-2", cfg.gradient, cfg.border)}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: cfg.color }} />
                    <span className="font-bold text-sm">{cfg.percent}% — {cfg.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cfg.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="h-8" />
    </div>
  );
};

export default Rule503020;
