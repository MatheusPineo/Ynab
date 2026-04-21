import { useMemo } from "react";
import { useAccountStore } from "@/store/useAccountStore";
import { formatMoney, netWorth } from "@/data/mockData";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Sparkles, PieChart as PieIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(158, 70%, 60%)", // Emerald
  "hsl(38, 92%, 60%)",  // Amber
  "hsl(268, 60%, 70%)", // Purple
  "hsl(210, 90%, 65%)", // Blue
  "hsl(0, 70%, 65%)",   // Rose
];

const Insights = () => {
  const { categoryGroups, transactions, tree } = useAccountStore();

  // 1. Data for Pie Chart (Distribution by Category)
  const pieData = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    categoryGroups.forEach(group => {
      group.categories.forEach(cat => {
        if (cat.spent > 0) {
          data.push({ name: cat.name, value: cat.spent });
        }
      });
    });
    return data.sort((a, b) => b.value - a.value);
  }, [categoryGroups]);

  // 2. Data for Area Chart (Simulated Wealth Trend based on current total)
  const currentNetWorth = useMemo(() => netWorth(tree, "EUR"), [tree]);
  const trendData = useMemo(() => {
    // Let's simulate a trend leading up to current value
    const base = currentNetWorth * 0.9;
    return [
      { name: "Nov", value: base * 0.92 },
      { name: "Dez", value: base * 1.05 },
      { name: "Jan", value: base * 1.02 },
      { name: "Fev", value: base * 1.1 },
      { name: "Mar", value: base * 1.08 },
      { name: "Abr", value: currentNetWorth },
    ];
  }, [currentNetWorth]);

  // 3. Stats for Cards
  const totalSpent = useMemo(() => {
    return transactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.amount > 0)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Insights Financeiros
        </h1>
        <p className="text-muted-foreground">
          Análise visual do seu comportamento financeiro e evolução de patrimônio.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/60 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Gasto Total (Abril)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">
              -{formatMoney(totalSpent, "EUR")}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Soma de todas as despesas lançadas
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Receita Total (Abril)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              +{formatMoney(totalIncome, "EUR")}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Soma de todas as entradas lançadas
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">
              Balanço Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (totalIncome - totalSpent) >= 0 ? "text-primary" : "text-rose-400"
            )}>
              {formatMoney(totalIncome - totalSpent, "EUR")}
            </div>
            <p className="text-[10px] text-primary/70 mt-1">
              Diferença entre o que entrou e o que saiu
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Pie Chart */}
        <Card className="rounded-2xl border-border/60 bg-card/40 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Distribuição de Gastos</h3>
          </div>
          <div className="h-[300px] w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                Lance despesas para ver a distribuição.
              </div>
            )}
          </div>
        </Card>

        {/* Wealth Trend Area Chart */}
        <Card className="rounded-2xl border-border/60 bg-card/40 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Evolução do Patrimônio</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  hide 
                  domain={['dataMin - 1000', 'dataMax + 1000']} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [formatMoney(value, "EUR"), "Patrimônio"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
