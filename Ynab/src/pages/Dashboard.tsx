import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Sparkles,
  Target,
  PiggyBank,
  CreditCard,
  MoreHorizontal,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAccountStore } from "@/store/useAccountStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { format, parseISO, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const PIE_COLORS = [
  "hsl(158 70% 60%)",
  "hsl(258 60% 70%)",
  "hsl(38 92% 60%)",
  "hsl(210 90% 65%)",
  "hsl(338 75% 65%)",
  "hsl(178 65% 55%)",
];

const Dashboard = () => {
  const { fetchAccounts, tree, getHistory, transactions, goals, fetchGoals } = useAccountStore();
  const { fetchRates, convert, baseCurrency } = useCurrencyStore();
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchRates();
    fetchGoals();
  }, [fetchAccounts, fetchRates, fetchGoals]);

  const historyData = useMemo(() => getHistory(), [getHistory]);

  const netWorth = useMemo(() => {
    const totalsByCur = useAccountStore.getState().totalsByCurrency(tree);
    return Object.entries(totalsByCur).reduce(
      (acc, [cur, amount]) => acc + convert(amount, cur as any, baseCurrency),
      0,
    );
  }, [tree, convert, baseCurrency]);

  const { monthlyStats, prevMonthStats } = useMemo(() => {
    const now = new Date();
    const currentMonth = format(now, "yyyy-MM");
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = format(prev, "yyyy-MM");

    const stats = { income: 0, expense: 0 };
    const prevStats = { income: 0, expense: 0 };

    transactions.forEach((t) => {
      const m = format(parseISO(t.date), "yyyy-MM");
      const amt = Math.abs(Number(t.amount));
      if (m === currentMonth) {
        if (t.is_income) stats.income += amt;
        else stats.expense += amt;
      } else if (m === prevMonth) {
        if (t.is_income) prevStats.income += amt;
        else prevStats.expense += amt;
      }
    });

    return {
      monthlyStats: { ...stats, savings: stats.income - stats.expense },
      prevMonthStats: { ...prevStats, savings: prevStats.income - prevStats.expense },
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [transactions]);

  const topCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    const currentMonth = format(new Date(), "yyyy-MM");
    transactions.forEach((t) => {
      if (!t.is_income && format(parseISO(t.date), "yyyy-MM") === currentMonth) {
        const catName = (t as any).category_name || "Sem Categoria";
        categories[catName] = (categories[catName] || 0) + Math.abs(Number(t.amount));
      }
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  // Weekly cashflow for the bar chart
  const weeklyFlow = useMemo(() => {
    const buckets: Record<string, { day: string; income: number; expense: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, "yyyy-MM-dd");
      buckets[key] = {
        day: format(d, "EEE", { locale: ptBR }).slice(0, 3),
        income: 0,
        expense: 0,
      };
    }
    const cutoff = subDays(today, 6);
    transactions.forEach((t) => {
      const d = parseISO(t.date);
      if (!isAfter(d, cutoff) && format(d, "yyyy-MM-dd") !== format(cutoff, "yyyy-MM-dd")) return;
      const key = format(d, "yyyy-MM-dd");
      if (!buckets[key]) return;
      const amt = Math.abs(Number(t.amount));
      if (t.is_income) buckets[key].income += amt;
      else buckets[key].expense += amt;
    });
    return Object.values(buckets);
  }, [transactions]);

  const fmt = (n: number) =>
    hideBalance
      ? "••••••"
      : `${baseCurrency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pct = (curr: number, prev: number) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const incomeDelta = pct(monthlyStats.income, prevMonthStats.income);
  const expenseDelta = pct(monthlyStats.expense, prevMonthStats.expense);
  const savingsDelta = pct(monthlyStats.savings, prevMonthStats.savings);
  const savingsRate = monthlyStats.income > 0 ? (monthlyStats.savings / monthlyStats.income) * 100 : 0;

  const topGoals = goals.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* HERO — Patrimônio em destaque */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-transparent backdrop-blur-xl shadow-elevated">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{ background: "var(--gradient-glow)" }}
        />
        <div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--gradient-mixed)" }}
        />

        <div className="relative p-6 md:p-8 grid gap-8 md:grid-cols-[1fr_auto] items-center">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary gap-1.5">
                <Sparkles className="h-3 w-3" /> Visão Geral
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">
                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                <Wallet className="h-4 w-4" /> Patrimônio Total
                <button
                  onClick={() => setHideBalance((v) => !v)}
                  className="ml-1 p-1 rounded-md hover:bg-muted/50 transition-colors"
                  aria-label="toggle balance"
                >
                  {hideBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight tabular text-gradient-mixed">
                {fmt(netWorth)}
              </h1>
              <div className="flex items-center gap-3 text-sm">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${savingsDelta >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {savingsDelta >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(savingsDelta).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs. mês anterior</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild className="gradient-primary text-primary-foreground shadow-glow border-0">
                <Link to="/transactions">
                  <Plus className="mr-2 h-4 w-4" /> Nova Transação
                </Link>
              </Button>
              <Button asChild variant="outline" className="glass">
                <Link to="/accounts">Ver Contas</Link>
              </Button>
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link to="/insights">Insights →</Link>
              </Button>
            </div>
          </div>

          {/* Mini savings rate ring */}
          <div className="hidden md:flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-background/40 border border-border/40">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#gradRing)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(0, Math.min(100, savingsRate)) * 2.64} 264`}
                />
                <defs>
                  <linearGradient id="gradRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular">{savingsRate.toFixed(0)}%</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">poupança</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-[140px]">
              Taxa de poupança neste mês
            </p>
          </div>
        </div>
      </section>

      {/* KPI ROW */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Receitas"
          value={fmt(monthlyStats.income)}
          delta={incomeDelta}
          deltaPositive
          accent="primary"
        />
        <KpiCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Despesas"
          value={fmt(monthlyStats.expense)}
          delta={expenseDelta}
          deltaPositive={false}
          accent="destructive"
        />
        <KpiCard
          icon={<PiggyBank className="h-4 w-4" />}
          label="Balanço"
          value={fmt(monthlyStats.savings)}
          delta={savingsDelta}
          deltaPositive
          accent={monthlyStats.savings >= 0 ? "primary" : "destructive"}
        />
        <KpiCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Transações"
          value={String(transactions.length)}
          subtitle="este mês"
          accent="secondary"
        />
      </section>

      {/* CHARTS ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass border-border/60 shadow-soft lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Evolução do Patrimônio</CardTitle>
              <CardDescription>Últimos 30 dias</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
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
                  tickFormatter={(v) => format(new Date(v), "dd MMM", { locale: ptBR })}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v > 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-elevated)",
                  }}
                  labelFormatter={(v) => format(new Date(v), "dd 'de' MMMM", { locale: ptBR })}
                  formatter={(v: number) => [`${baseCurrency} ${v.toLocaleString()}`, "Patrimônio"]}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#netWorthFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-border/60 shadow-soft overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Top Categorias</CardTitle>
            <CardDescription>Despesas deste mês</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {topCategories.length > 0 ? (
              <div className="grid grid-cols-[140px_1fr] h-full items-center gap-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {topCategories.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                      formatter={(v: number) => `${baseCurrency} ${v.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="space-y-2 text-sm">
                  {topCategories.map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="truncate text-foreground/80">{c.name}</span>
                      <span className="ml-auto tabular text-xs text-muted-foreground">
                        {((c.value / topCategories.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyMini text="Sem despesas este mês" />
            )}
          </CardContent>
        </Card>
      </section>

      {/* CASHFLOW + GOALS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass border-border/60 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fluxo Semanal</CardTitle>
            <CardDescription>Receitas e despesas dos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFlow} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                  formatter={(v: number) => `${baseCurrency} ${v.toLocaleString()}`}
                />
                <Bar dataKey="income" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-border/60 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Metas
              </CardTitle>
              <CardDescription>Progresso atual</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link to="/goals">Ver tudo</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {topGoals.length > 0 ? (
              topGoals.map((g) => {
                const p = Math.min(100, (Number(g.current_amount) / Number(g.target_amount || 1)) * 100);
                return (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-base">{g.emoji || "🎯"}</span>
                        <span className="font-medium truncate">{g.name}</span>
                      </span>
                      <span className="tabular text-xs text-muted-foreground shrink-0">{p.toFixed(0)}%</span>
                    </div>
                    <Progress value={p} className="h-1.5" />
                    <div className="flex justify-between text-[11px] text-muted-foreground tabular">
                      <span>
                        {g.currency} {Number(g.current_amount).toLocaleString()}
                      </span>
                      <span>
                        {g.currency} {Number(g.target_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 space-y-2">
                <Target className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhuma meta definida</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/goals">
                    <Plus className="h-3 w-3 mr-1" /> Criar Meta
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* RECENT TRANSACTIONS */}
      <Card className="glass border-border/60 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Transações Recentes</CardTitle>
            <CardDescription>Últimas movimentações</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions" className="text-primary hover:text-primary/80">
              Ver todas →
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-border/40">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                        t.is_income
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {t.is_income ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {t.description || "Sem descrição"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR })}
                        {(t as any).category_name ? ` • ${(t as any).category_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold tabular shrink-0 ${
                      t.is_income ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {t.is_income ? "+" : "−"} {baseCurrency}{" "}
                    {Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMini text="Nenhuma transação encontrada" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* -------- helpers -------- */

function KpiCard({
  icon,
  label,
  value,
  delta,
  deltaPositive,
  subtitle,
  accent = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number;
  deltaPositive?: boolean;
  subtitle?: string;
  accent?: "primary" | "secondary" | "destructive";
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    destructive: "bg-destructive/10 text-destructive",
  };
  const showDelta = typeof delta === "number" && isFinite(delta);
  const isUp = deltaPositive ? (delta ?? 0) >= 0 : (delta ?? 0) <= 0;
  return (
    <Card className="glass border-border/60 shadow-soft hover:shadow-elevated transition-all duration-300 group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
            {icon}
          </div>
          {showDelta && (
            <span
              className={`text-[11px] font-medium tabular inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                isUp ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10"
              }`}
            >
              {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta!).toFixed(1)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl md:text-2xl font-bold tabular tracking-tight mt-0.5">{value}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="h-full min-h-[160px] flex items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export default Dashboard;
