import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Calculator,
  Flame,
  ArrowRight,
  TrendingUp,
  Percent,
  HelpCircle,
  PiggyBank,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { PullToRefresh } from "@/shared/components/dashboard/PullToRefresh";
import { useAccountStore } from "../store/useAccountStore";
import { useAssetStore } from "../store/useAssetStore";
import { useDebtStore } from "../store/useDebtStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { formatMoney } from "@/shared/lib/currency-utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Simulators = () => {
  const { fetchAccounts, tree, transactions, fetchTransactions } = useAccountStore();
  const { fetchAssets, assets, runway, fetchRunway } = useAssetStore();
  const { fetchDebts, debts } = useDebtStore();
  const { baseCurrency, convert, fetchRates } = useCurrencyStore();

  // Inputs dos simuladores
  const [expectedReturn, setExpectedReturn] = useState<number>(8); // 8% a.a.
  const [customPrincipal, setCustomPrincipal] = useState<string>("");
  const [customContribution, setCustomContribution] = useState<string>("");
  const [customExpenses, setCustomExpenses] = useState<string>("");
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState<number>(4); // 4% a.a.

  // Carrega dados em paralelo
  useEffect(() => {
    Promise.all([
      fetchAccounts(),
      fetchRates(),
      fetchTransactions(),
      fetchAssets(),
      fetchDebts(),
      fetchRunway(),
    ]).catch((err) => console.error("Erro no carregamento paralelo dos simuladores:", err));
  }, [fetchAccounts, fetchRates, fetchTransactions, fetchAssets, fetchDebts, fetchRunway]);

  const handleRefresh = async () => {
    await Promise.all([
      fetchAccounts(),
      fetchRates(),
      fetchTransactions(),
      fetchAssets(),
      fetchDebts(),
      fetchRunway(),
    ]);
  };

  // 1. Calcula Net Worth real
  const currentNetWorth = useMemo(() => {
    const totalsByCur = useAccountStore.getState().totalsByCurrency(tree);
    const cash = Object.entries(totalsByCur).reduce(
      (acc, [cur, amount]) => acc + convert(amount, cur as any, baseCurrency),
      0
    );

    const sumEffectiveAssets = assets.reduce(
      (acc, asset) => acc + (Number(asset.effective_asset_value) || 0),
      0
    );

    const linkedDebtIds = new Set(assets.map((a) => a.linked_debt).filter(Boolean));
    const unlinkedDebtsAmount = debts
      .filter((d) => d.is_mine && !linkedDebtIds.has(d.id))
      .reduce(
        (acc, d) => acc + convert(Number(d.amount_remaining) || 0, (d.currency || baseCurrency) as any, baseCurrency),
        0
      );

    return cash + sumEffectiveAssets - unlinkedDebtsAmount;
  }, [tree, convert, baseCurrency, assets, debts]);

  // 2. Calcula Média Histórica de Poupança (Income - Expense por mês)
  const averageMonthlySavings = useMemo(() => {
    if (!transactions || transactions.length === 0) return 1000;
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((tx: any) => {
      if (!tx.date || tx.status !== "realized") return;
      const monthKey = tx.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      const amount = Number(tx.amount) || 0;
      if (tx.is_income) {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expense += Math.abs(amount);
      }
    });

    const months = Object.keys(monthlyData);
    if (months.length === 0) return 1000;

    const totalSavings = months.reduce((sum, key) => {
      const month = monthlyData[key];
      return sum + (month.income - month.expense);
    }, 0);

    const avg = totalSavings / months.length;
    return avg > 0 ? Math.round(avg) : 500;
  }, [transactions]);

  // 3. Valores dinâmicos (iniciais ou customizados pelo usuário)
  const startingPrincipal = customPrincipal !== "" ? Number(customPrincipal) : Math.max(0, currentNetWorth);
  const monthlyContribution = customContribution !== "" ? Number(customContribution) : Math.max(0, averageMonthlySavings);
  const monthlyExpenses = customExpenses !== "" ? Number(customExpenses) : (runway?.average_monthly_expenses || 2500);

  // 4. Lógica do Millionaire Calculator
  const millionaireProj = useMemo(() => {
    const target = 1000000;
    const monthlyRate = Math.pow(1 + expectedReturn / 100, 1 / 12) - 1;

    let balance = startingPrincipal;
    let monthsElapsed = 0;
    const chartData: { month: number; year: string; balance: number; contribution: number }[] = [];

    // Adiciona ponto inicial
    chartData.push({
      month: 0,
      year: "0",
      balance: Math.round(balance),
      contribution: Math.round(startingPrincipal),
    });

    let totalContributed = startingPrincipal;

    while (balance < target && monthsElapsed < 600) { // Limite de 50 anos
      monthsElapsed++;
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;

      if (monthsElapsed % 12 === 0 || balance >= target) {
        chartData.push({
          month: monthsElapsed,
          year: `${Math.floor(monthsElapsed / 12)}a`,
          balance: Math.round(balance),
          contribution: Math.round(totalContributed),
        });
      }
    }

    const years = Math.floor(monthsElapsed / 12);
    const remainingMonths = monthsElapsed % 12;

    return {
      monthsElapsed,
      years,
      remainingMonths,
      chartData,
      reached: balance >= target,
    };
  }, [startingPrincipal, monthlyContribution, expectedReturn]);

  // 5. Lógica do FIRE Calculator
  const fireNumber = useMemo(() => {
    const annualExpenses = monthlyExpenses * 12;
    return Math.round(annualExpenses / (safeWithdrawalRate / 100));
  }, [monthlyExpenses, safeWithdrawalRate]);

  const fireProgress = useMemo(() => {
    if (fireNumber <= 0) return 0;
    return Math.min(100, (startingPrincipal / fireNumber) * 100);
  }, [startingPrincipal, fireNumber]);

  const fireProj = useMemo(() => {
    const target = fireNumber;
    const monthlyRate = Math.pow(1 + expectedReturn / 100, 1 / 12) - 1;

    let balance = startingPrincipal;
    let monthsElapsed = 0;

    while (balance < target && monthsElapsed < 600) {
      monthsElapsed++;
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }

    const years = Math.floor(monthsElapsed / 12);
    const remainingMonths = monthsElapsed % 12;

    const targetDateObj = new Date();
    targetDateObj.setMonth(targetDateObj.getMonth() + monthsElapsed);
    
    return {
      monthsElapsed,
      years,
      remainingMonths,
      reached: balance >= target,
      targetDate: targetDateObj.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  }, [startingPrincipal, monthlyContribution, expectedReturn, fireNumber]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-4 sm:gap-6 pb-10 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-widest">
                Planejamento & Simulação
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Simuladores Financeiros Dinâmicos
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simule objetivos como Rumo ao Milhão e FIRE com o seu saldo patrimonial real e economias históricas.
            </p>
          </div>
        </div>

        {/* ── PAINEL DE CONTROLES GLOBAIS ──────────── */}
        <div className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm p-4 sm:p-5 shadow-soft grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Patrimônio Líquido Inicial</label>
            <div className="relative">
              <Input
                type="number"
                value={customPrincipal}
                onChange={(e) => setCustomPrincipal(e.target.value)}
                placeholder={String(Math.round(currentNetWorth))}
                className="glass border-border/40 focus:ring-1 focus:ring-primary h-9 text-xs"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-mono">{baseCurrency}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Aporte Mensal Previsto</label>
            <div className="relative">
              <Input
                type="number"
                value={customContribution}
                onChange={(e) => setCustomContribution(e.target.value)}
                placeholder={String(Math.round(averageMonthlySavings))}
                className="glass border-border/40 focus:ring-1 focus:ring-primary h-9 text-xs"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-mono">{baseCurrency}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Retorno Anual Esperado (%)</label>
            <div className="relative">
              <Input
                type="number"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="glass border-border/40 focus:ring-1 focus:ring-primary h-9 text-xs"
              />
              <Percent className="absolute right-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Despesa Mensal Base</label>
            <div className="relative">
              <Input
                type="number"
                value={customExpenses}
                onChange={(e) => setCustomExpenses(e.target.value)}
                placeholder={String(Math.round(runway?.average_monthly_expenses || 2500))}
                className="glass border-border/40 focus:ring-1 focus:ring-primary h-9 text-xs"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-mono">{baseCurrency}</span>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO DOS SIMULADORES ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. MILLIONAIRE CALCULATOR */}
          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <PiggyBank className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Rumo ao Milhão</h3>
                    <p className="text-[10px] text-muted-foreground">Tempo projetado para atingir 1 Milhão</p>
                  </div>
                </div>
                <HelpTooltip content="Calcula a evolução do patrimônio com juros compostos mensais." side="left" />
              </div>

              <div className="bg-primary/5 rounded-xl border border-primary/10 p-4">
                <span className="text-[10px] text-primary uppercase tracking-wider">Tempo Estimado</span>
                <h4 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                  {millionaireProj.reached ? (
                    <span>
                      {millionaireProj.years} {millionaireProj.years === 1 ? "ano" : "anos"}{" "}
                      e {millionaireProj.remainingMonths}{" "}
                      {millionaireProj.remainingMonths === 1 ? "mês" : "meses"}
                    </span>
                  ) : (
                    <span>Mais de 50 anos 😅</span>
                  )}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Patrimônio Inicial: <strong>{formatMoney(startingPrincipal, baseCurrency)}</strong> • Aporte: <strong>{formatMoney(monthlyContribution, baseCurrency)}/mês</strong>
                </p>
              </div>

              {/* Gráfico da curva de evolução */}
              <div className="h-[180px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={millionaireProj.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.2} />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={9}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`)}
                    />
                    <Tooltip
                      formatter={(value: any) => formatMoney(value, baseCurrency)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 10 }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#projGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-3 mt-4">
              *A projeção considera capitalização de juros mensal de forma composta.
            </div>
          </div>

          {/* 2. FIRE CALCULATOR */}
          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Independência Financeira (FIRE)</h3>
                    <p className="text-[10px] text-muted-foreground">Regra empírica dos 4%</p>
                  </div>
                </div>
                <HelpTooltip content="Calcula a meta de aposentadoria baseada nas despesas mensais." side="left" />
              </div>

              {/* Número FIRE Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-500/5 rounded-xl border border-amber-500/10 p-3">
                  <span className="text-[9px] text-amber-500 uppercase tracking-wider block">Meta Número FIRE</span>
                  <span className="text-base sm:text-lg font-bold text-foreground">{formatMoney(fireNumber, baseCurrency)}</span>
                </div>
                <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/10 p-3">
                  <span className="text-[9px] text-emerald-400 uppercase tracking-wider block">Progresso Realizado</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400">{fireProgress.toFixed(1)}%</span>
                </div>
              </div>

              {/* Barra de Progresso do FIRE */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Atual: {formatMoney(startingPrincipal, baseCurrency)}</span>
                  <span>Meta</span>
                </div>
                <Progress value={fireProgress} className="h-2 bg-muted/40 rounded-full" />
              </div>

              {/* Data Prevista de Aposentadoria */}
              <div className="bg-muted/20 rounded-xl border border-border/40 p-4 mt-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Atingimento Estimado</span>
                <h4 className="text-lg font-bold text-foreground mt-0.5">
                  {fireProj.reached ? (
                    <span className="capitalize">{fireProj.targetDate}</span>
                  ) : (
                    <span>Fora do horizonte de projeção</span>
                  )}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {fireProj.reached ? (
                    <span>
                      Faltam <strong>{fireProj.years} anos</strong> e <strong>{fireProj.remainingMonths} meses</strong> de acúmulo contínuo.
                    </span>
                  ) : (
                    <span>Aumente o seu aporte mensal ou reduza suas despesas para obter uma previsão.</span>
                  )}
                </p>
              </div>

              {/* Seletor de Taxa de Retirada Segura */}
              <div className="pt-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                  Taxa de Retirada Segura: <strong>{safeWithdrawalRate}% a.a.</strong>
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  step="0.25"
                  value={safeWithdrawalRate}
                  onChange={(e) => setSafeWithdrawalRate(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-3 mt-4">
              *A regra FIRE assume que você pode retirar um percentual anual seguro sem exaustão do capital acumulado.
            </div>
          </div>
        </div>

      </div>
    </PullToRefresh>
  );
};

export default Simulators;
