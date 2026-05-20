import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  Target,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { NetWorthHeader } from "@/modules/finance/components/NetWorthHeader";
import { AddTransactionModal } from "@/modules/finance/components/AddTransactionModal";
import { cn } from "@/shared/lib/utils";
import { PullToRefresh } from "@/shared/components/dashboard/PullToRefresh";
import { DashboardWidgets } from "@/modules/finance/components/DashboardWidgets";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

const formatMoney = (value: number, currency = "EUR") => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label, baseCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">
          {label && isValid(new Date(label))
            ? format(new Date(label), "dd 'de' MMMM", { locale: ptBR })
            : label}
        </p>
        <p className="text-sm font-semibold text-foreground">
          {formatMoney(payload[0].value, baseCurrency)}
        </p>
      </div>
    );
  }
  return null;
};
const Dashboard = () => {
  const { 
    fetchAccounts, 
    fetchGoals, 
    fetchTransactions, 
    tree, 
    getHistory, 
    transactions, 
    globalPendingTransactions,
    goals, 
    updateTransaction,
    currentMonth,
    currentYear,
    setCurrentPeriod
  } = useAccountStore();
  const { fetchRates, convert, baseCurrency, setBaseCurrency } = useCurrencyStore();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth - 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    setSelectedMonth(currentMonth - 1);
    setSelectedYear(currentYear);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchAccounts();
    fetchRates();
    fetchGoals();
    fetchTransactions();
  }, [fetchAccounts, fetchRates, fetchGoals, fetchTransactions, currentMonth, currentYear]);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const handleRefresh = async () => {
    await Promise.all([
      fetchAccounts(),
      fetchRates(),
      fetchGoals(),
      fetchTransactions(),
    ]);
  };

  const historyData = useMemo(() => getHistory(), [getHistory, transactions]);

  const netWorth = useMemo(() => {
    const totalsByCur = useAccountStore.getState().totalsByCurrency(tree);
    return Object.entries(totalsByCur).reduce(
      (acc, [cur, amount]) => acc + convert(amount, cur as any, baseCurrency),
      0
    );
  }, [tree, convert, baseCurrency]);

  const monthlyStats = useMemo(() => {
    const targetPeriod = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    let income = 0;
    let expense = 0;
    let pendingCount = 0;

    const txs = Array.isArray(transactions) ? transactions : [];
    txs.forEach((t) => {
      if (!t.date) return;
      const period = t.date.substring(0, 7);
      if (period === targetPeriod) {
        if (t.status === "pending") pendingCount++;
        if (t.is_income) income += Number(t.amount);
        else expense += Math.abs(Number(t.amount));
      }
    });

    const savings = income - expense;
    const savingsRate = income > 0 ? Math.min(100, (savings / income) * 100) : 0;

    return { income, expense, savings, savingsRate, pendingCount };
  }, [transactions, currentMonth, currentYear]);

  const pendingTransactionsData = useMemo(() => {
    const txs = Array.isArray(globalPendingTransactions) ? globalPendingTransactions : [];
    
    // Filtramos apenas as pendentes caso venham com status errado do backend, mas em teoria a store já garante
    const filtered = txs.filter((t) => t.status === "pending" && t.date);

    let totalIncome = 0;
    let totalExpense = 0;
    filtered.forEach(t => {
      if (t.is_income) totalIncome += Number(t.amount);
      else totalExpense += Math.abs(Number(t.amount));
    });

    return {
      // Ordena por data (mais antigas / vencidas primeiro)
      list: filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [globalPendingTransactions]);

  const getPendingStatusLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const txDate = new Date(dateStr);
    txDate.setHours(0, 0, 0, 0);
    
    const diffTime = txDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: "Vencido", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
    if (diffDays === 0) return { label: "Vence hoje", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    if (diffDays === 1) return { label: "Vence amanhã", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
    return { label: `Vence em ${diffDays} dias`, color: "text-muted-foreground bg-muted/20 border-border/40" };
  };

  const recentTransactions = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];
    return [...txs]
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 6);
  }, [transactions]);

  const topCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    const targetPeriod = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    const txs = Array.isArray(transactions) ? transactions : [];
    txs.forEach((t) => {
      if (!t.date) return;
      const period = t.date.substring(0, 7);
      if (!t.is_income && period === targetPeriod) {
        const catName = (t as any).category_name || "Sem Categoria";
        categories[catName] = (categories[catName] || 0) + Math.abs(Number(t.amount));
      }
    });
    const sorted = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const max = sorted[0]?.value || 1;
    return sorted.map((c) => ({ ...c, pct: (c.value / max) * 100 }));
  }, [transactions, currentMonth, currentYear]);

  const topGoals = useMemo(() => {
    const gs = Array.isArray(goals) ? goals : [];
    return gs
      .filter((g) => g.target_amount > 0)
      .map((g) => ({
        ...g,
        pct: Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100),
      }))
      .slice(0, 3);
  }, [goals]);

  const handleStatusToggle = async (t: any) => {
    const newStatus = t.status === "realized" ? "pending" : "realized";
    await updateTransaction(t.id, { status: newStatus });
  };

  const monthName = useMemo(() => {
    const dateObj = new Date(currentYear, currentMonth - 1, 1);
    return format(dateObj, "MMMM 'de' yyyy", { locale: ptBR });
  }, [currentMonth, currentYear]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-4 sm:gap-6 pb-10 animate-in fade-in duration-500">

      {/* ── PAINEL CENTRAL DE PATRIMÔNIO & CÂMBIO ──────────── */}
      <div className="relative">
        <NetWorthHeader base={baseCurrency} onBaseChange={setBaseCurrency} customTotal={netWorth} />
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 hidden sm:block">
          <AddTransactionModal>
            <Button className="gradient-primary text-primary-foreground rounded-xl shadow-glow hover:scale-[1.03] transition-transform h-10 px-5">
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={2.5} />
              Nova Transação
            </Button>
          </AddTransactionModal>
        </div>
      </div>

      {/* ── HEADER DE VISÃO GERAL ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">
              Desempenho Mensal
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground capitalize">
            {monthName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe o fluxo de caixa, receitas e despesas efetivadas no período.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <Select 
            value={String(selectedMonth)} 
            onValueChange={(v) => {
              const m = Number(v);
              setSelectedMonth(m);
              setCurrentPeriod(m + 1, selectedYear);
            }}
          >
            <SelectTrigger className="w-[115px] sm:w-[130px] glass border-border/40 rounded-xl h-9 text-xs sm:text-sm shadow-soft focus:ring-0">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              {months.map((m, i) => (
                <SelectItem key={m} value={String(i)} className="text-xs sm:text-sm">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={String(selectedYear)} 
            onValueChange={(v) => {
              const y = Number(v);
              setSelectedYear(y);
              setCurrentPeriod(selectedMonth + 1, y);
            }}
          >
            <SelectTrigger className="w-[80px] sm:w-[90px] glass border-border/40 rounded-xl h-9 text-xs sm:text-sm shadow-soft focus:ring-0">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              {years.map(y => (
                <SelectItem key={y} value={String(y)} className="text-xs sm:text-sm">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AddTransactionModal>
            <Button className="gradient-primary text-primary-foreground rounded-xl shadow-glow hover:scale-[1.03] transition-transform h-9 sm:hidden">
              <Plus className="h-4 w-4 mr-1" strokeWidth={2.5} />
              Nova Transação
            </Button>
          </AddTransactionModal>
          <Button asChild variant="outline" className="glass border-border/60 rounded-xl text-sm h-9">
            <Link to="/transactions" className="flex items-center gap-2">
              <span className="hidden sm:inline">Ver Transações</span>
              <span className="sm:hidden">Transações</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── HERO STATS ROW (3 CARDS) ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">

        {/* Receitas */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/60 to-card/30 backdrop-blur-sm p-5 shadow-soft group hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-emerald-500/5 -translate-y-6 translate-x-6 group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span>Receitas (Mês)</span>
            <HelpTooltip content="Todo o dinheiro que entrou nas suas contas durante o mês atual." side="right" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 leading-none">
            {formatMoney(monthlyStats.income, baseCurrency)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            <p className="text-xs text-emerald-500/80">Efetivadas</p>
          </div>
        </div>

        {/* Despesas */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card/60 to-card/30 backdrop-blur-sm p-5 shadow-soft group hover:border-rose-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-rose-500/5 -translate-y-6 translate-x-6 group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <div className="h-6 w-6 rounded-full bg-rose-500/20 flex items-center justify-center">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <span>Despesas (Mês)</span>
            <HelpTooltip content="Todo o dinheiro que saiu das suas contas durante o mês atual." side="right" />
          </div>
          <p className="text-2xl font-bold text-rose-400 leading-none">
            {formatMoney(monthlyStats.expense, baseCurrency)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowDownRight className="h-3 w-3 text-rose-500" />
            <p className="text-xs text-rose-500/80">Efetivadas</p>
          </div>
        </div>

        {/* Balanço + Taxa de Poupança */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft group hover:border-primary/30 transition-all duration-300">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
            </div>
            <span>Balanço do Mês</span>
            <HelpTooltip content="O quanto de dinheiro sobrou após subtrair suas despesas das suas receitas." side="right" />
          </div>
          <p className={cn("text-2xl font-bold leading-none", monthlyStats.savings >= 0 ? "text-primary" : "text-rose-400")}>
            {monthlyStats.savings >= 0 ? "+" : ""}{formatMoney(monthlyStats.savings, baseCurrency)}
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground">Taxa de poupança</p>
              <p className="text-[10px] font-semibold text-primary">{monthlyStats.savingsRate.toFixed(0)}%</p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                style={{ width: `${monthlyStats.savingsRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Gráfico de Evolução */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Evolução do Fluxo</h2>
                <p className="text-xs text-muted-foreground">Movimentações acumuladas no período</p>
              </div>
              <HelpTooltip content="Gráfico comparativo de como as receitas e despesas se comportaram dia após dia neste mês." side="right" />
            </div>
            {monthlyStats.pendingCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Clock className="h-3 w-3" />
                {monthlyStats.pendingCount} pendente{monthlyStats.pendingCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
          <div className="h-[200px] sm:h-[240px]">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      try {
                        return format(new Date(val), "dd MMM", { locale: ptBR });
                      } catch {
                        return val;
                      }
                    }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
                    }
                  />
                  <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#gradPrimary)"
                    dot={false}
                    activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp className="h-8 w-8 opacity-20" />
                <p className="text-sm">Sem dados para o período</p>
              </div>
            )}
          </div>
        </div>

        {/* Gastos por Categoria */}
        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Top Categorias</h2>
                <p className="text-xs text-muted-foreground">Maiores gastos do mês</p>
              </div>
              <HelpTooltip content="As categorias onde você gastou a maior parte do seu dinheiro neste mês." side="right" />
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2 text-primary hover:text-primary">
              <Link to="/budget">Ver tudo</Link>
            </Button>
          </div>

          {topCategories.length > 0 ? (
            <div className="flex flex-col gap-3 flex-1">
              {topCategories.map((cat, i) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-xs text-foreground font-medium truncate max-w-[110px]">{cat.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatMoney(cat.value, baseCurrency)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.pct}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <TrendingDown className="h-8 w-8 opacity-20" />
              <p className="text-sm text-center">Nenhuma despesa categorizada este mês</p>
            </div>
          )}
        </div>
      </div>

      {/* ── PENDING TRANSACTIONS CARD ─────────────────────── */}
      {pendingTransactionsData.list.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card/60 to-card/30 backdrop-blur-sm p-5 shadow-soft animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-semibold text-foreground">Pendências Globais</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Todas as suas transações agendadas não efetivadas
                </p>
              </div>
              <HelpTooltip content="Lançamentos futuros que ainda não foram marcados como efetivados na conta." side="right" />
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap mt-2 sm:mt-0">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A Receber</p>
                <p className="text-sm font-bold text-emerald-500">
                  {formatMoney(pendingTransactionsData.totalIncome, baseCurrency)}
                </p>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A Pagar</p>
                <p className="text-sm font-bold text-rose-500">
                  {formatMoney(pendingTransactionsData.totalExpense, baseCurrency)}
                </p>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Previsto</p>
                <p className={cn(
                  "text-sm font-bold",
                  pendingTransactionsData.balance >= 0 ? "text-amber-500" : "text-rose-500"
                )}>
                  {pendingTransactionsData.balance >= 0 ? "+" : ""}
                  {formatMoney(pendingTransactionsData.balance, baseCurrency)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {pendingTransactionsData.list.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/40 hover:border-amber-500/30 transition-all group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    t.is_income ? "bg-emerald-500/10" : "bg-rose-500/10"
                  )}>
                    {t.is_income 
                      ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> 
                      : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] text-muted-foreground">
                        {format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR })}
                      </p>
                      {(() => {
                        const statusBadge = getPendingStatusLabel(t.date);
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusBadge.color)}>
                            {statusBadge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={cn(
                    "text-xs font-bold tabular-nums",
                    t.is_income ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {t.is_income ? "+" : "-"}{formatMoney(Math.abs(Number(t.amount)), baseCurrency)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStatusToggle(t)}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                    title="Marcar como efetivada"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {pendingTransactionsData.list.length > 6 && (
            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" asChild className="text-[10px] h-6 text-muted-foreground hover:text-amber-500">
                <Link to="/transactions">Ver mais {pendingTransactionsData.list.length - 6} pendências</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Transações Recentes */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Transações Recentes</h2>
              <p className="text-xs text-muted-foreground">Últimas movimentações</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2 text-primary hover:text-primary">
              <Link to="/transactions" className="flex items-center gap-1">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            {recentTransactions.map((t) => {
              let formattedDate = t.date;
              try {
                formattedDate = format(parseISO(t.date), "dd MMM", { locale: ptBR });
              } catch {}

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      t.is_income ? "bg-emerald-500/10" : "bg-rose-500/10"
                    )}>
                      {t.is_income
                        ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                        : <TrendingDown className="h-4 w-4 text-rose-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
                        {t.status === "pending" && (
                          <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />Pendente
                          </span>
                        )}
                        {t.status === "realized" && (
                          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5" />Efetivada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className={cn(
                      "text-sm font-bold tabular-nums",
                      t.is_income ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {t.is_income ? "+" : "-"}
                      {formatMoney(Math.abs(Number(t.amount)), baseCurrency)}
                    </p>
                    {t.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStatusToggle(t)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        title="Marcar como efetivada"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {recentTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <TrendingUp className="h-8 w-8 opacity-20" />
                <p className="text-sm">Nenhuma transação encontrada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Metas */}
        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Metas Financeiras</h2>
              <p className="text-xs text-muted-foreground">Seu progresso atual</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2 text-primary hover:text-primary">
              <Link to="/goals">Ver tudo</Link>
            </Button>
          </div>

          {topGoals.length > 0 ? (
            <div className="flex flex-col gap-4 flex-1">
              {topGoals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{g.emoji}</span>
                      <span className="text-xs font-medium text-foreground truncate max-w-[110px]">{g.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary">{g.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-700"
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-muted-foreground">
                      {formatMoney(Number(g.current_amount), baseCurrency)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatMoney(Number(g.target_amount), baseCurrency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Target className="h-8 w-8 opacity-20" />
              <p className="text-sm text-center">Nenhuma meta criada ainda</p>
              <Button size="sm" variant="outline" asChild className="h-7 text-xs rounded-xl glass mt-1">
                <Link to="/goals">
                  <Plus className="h-3 w-3 mr-1" />Criar Meta
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── CUSTOMIZABLE WIDGETS ──────────────────────────── */}
      <DashboardWidgets />
      </div>
    </PullToRefresh>
  );
};

export default Dashboard;
