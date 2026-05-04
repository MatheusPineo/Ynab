import { useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  Plus,
  History,
  LayoutDashboard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Cell
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const Dashboard = () => {
  const { fetchAccounts, tree, getHistory, transactions } = useAccountStore();
  const { fetchRates, convert, baseCurrency } = useCurrencyStore();

  useEffect(() => {
    fetchAccounts();
    fetchRates();
  }, [fetchAccounts, fetchRates]);

  const historyData = useMemo(() => getHistory(), [getHistory]);

  // Totais Rápidos
  const netWorth = useMemo(() => {
    const totalsByCur = useAccountStore.getState().totalsByCurrency(tree);
    return Object.entries(totalsByCur).reduce(
      (acc, [cur, amount]) => acc + convert(amount, cur as any, baseCurrency),
      0
    );
  }, [tree, convert, baseCurrency]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = format(now, "yyyy-MM");
    
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (format(parseISO(t.date), "yyyy-MM") === currentMonth) {
        if (t.is_income) income += Number(t.amount);
        else expense += Math.abs(Number(t.amount));
      }
    });

    return { income, expense, savings: income - expense };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const topCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    const now = new Date();
    const currentMonth = format(now, "yyyy-MM");

    transactions.forEach(t => {
      if (!t.is_income && format(parseISO(t.date), "yyyy-MM") === currentMonth) {
        const catName = t.category_name || "Sem Categoria";
        categories[catName] = (categories[catName] || 0) + Math.abs(Number(t.amount));
      }
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header com Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Visão Geral
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o que está acontecendo com suas finanças este mês.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="glass">
            <Link to="/transactions">Ver Tudo</Link>
          </Button>
          <Button className="gradient-primary shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> Nova Transação
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass border-border/60 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" /> Patrimônio Total
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {baseCurrency} {netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="glass border-border/60 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Receitas (Mês)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">
              + {baseCurrency} {monthlyStats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="glass border-border/60 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" /> Despesas (Mês)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-400">
              - {baseCurrency} {monthlyStats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="glass border-border/60 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" /> Balanço
            </CardDescription>
            <CardTitle className={`text-2xl font-bold ${monthlyStats.savings >= 0 ? 'text-primary' : 'text-rose-400'}`}>
              {monthlyStats.savings >= 0 ? '+' : ''} {baseCurrency} {monthlyStats.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolução */}
        <Card className="glass border-border/60 shadow-xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução do Patrimônio</CardTitle>
            <CardDescription>Variação dos seus ativos nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888" 
                  fontSize={10} 
                  tickFormatter={(val) => format(new Date(val), "dd MMM", { locale: ptBR })}
                />
                <YAxis 
                  stroke="#888" 
                  fontSize={10} 
                  tickFormatter={(val) => `${val > 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                  labelFormatter={(val) => format(new Date(val), "dd 'de' MMMM", { locale: ptBR })}
                  formatter={(val: number) => [`${baseCurrency} ${val.toLocaleString()}`, "Patrimônio"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorNetWorth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Gastos (Pie) */}
        <Card className="glass border-border/60 shadow-xl">
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
            <CardDescription>Top 5 deste mês</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {topCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                    formatter={(val: number) => `${baseCurrency} ${val.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sem despesas este mês
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card className="glass border-border/60 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Transações Recentes
            </CardTitle>
            <CardDescription>Suas últimas movimentações financeiras</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions" className="text-primary hover:text-primary/80">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-sidebar-accent/30 transition-colors border border-transparent hover:border-border/40">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t.is_income ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {t.is_income ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR })} • {t.category_name}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${t.is_income ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.is_income ? '+' : '-'} {baseCurrency} {Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                Nenhuma transação encontrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
