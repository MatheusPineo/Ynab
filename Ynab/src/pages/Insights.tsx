import { useMemo } from "react";
import { useAccountStore, type CategoryNode } from "@/store/useAccountStore";
import { useGoals } from "@/hooks/useGoals";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  RadialBarChart, RadialBar
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, parseISO, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
];

const Insights = () => {
  const { getHistory, categoryGroups, transactions } = useAccountStore();
  const { goals } = useGoals();
  
  const historyData = useMemo(() => getHistory(), [getHistory]);

  // 1. Despesas por Categoria (Pie Chart)
  const expensesByCategory = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    const extractExpenses = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        if (!node.children || node.children.length === 0) {
          if (node.spent_amount > 0) {
            data.push({ name: node.name, value: node.spent_amount });
          }
        } else {
          extractExpenses(node.children);
        }
      });
    };
    extractExpenses(categoryGroups);
    return data.sort((a, b) => b.value - a.value).slice(0, 8); // Top 8
  }, [categoryGroups]);

  // 2. Fluxo de Caixa Mensal (Bar Chart)
  const monthlyCashFlow = useMemo(() => {
    const monthlyData: Record<string, { month: string; Receitas: number; Despesas: number }> = {};
    
    transactions.forEach(t => {
      const date = parseISO(t.date);
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM/yy", { locale: ptBR });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, Receitas: 0, Despesas: 0 };
      }

      if (t.is_income) {
        monthlyData[monthKey].Receitas += Number(t.amount);
      } else {
        monthlyData[monthKey].Despesas += Math.abs(Number(t.amount));
      }
    });

    return Object.keys(monthlyData).sort().map(k => monthlyData[k]);
  }, [transactions]);

  // 3. Hábitos de Consumo por Dia da Semana (Radar Chart)
  const spendingHabits = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const data = days.map(day => ({ subject: day, A: 0, fullMark: 100 }));
    
    let maxExpense = 0;
    transactions.forEach(t => {
      if (!t.is_income) {
        const date = parseISO(t.date);
        const dayIdx = getDay(date);
        const amount = Math.abs(Number(t.amount));
        data[dayIdx].A += amount;
        if (data[dayIdx].A > maxExpense) maxExpense = data[dayIdx].A;
      }
    });

    return data.map(d => ({ ...d, fullMark: maxExpense || 100 }));
  }, [transactions]);

  // 4. Progresso de Metas (Radial Bar Chart)
  const goalsProgress = useMemo(() => {
    return goals.slice(0, 5).map((g, index) => {
      const percent = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100);
      return {
        name: g.name,
        uv: percent,
        pv: 100,
        fill: COLORS[index % COLORS.length]
      };
    }).sort((a, b) => b.uv - a.uv); // Ordena por progresso
  }, [goals]);

  // Totais rápidos
  const totalIncome = monthlyCashFlow.reduce((acc, curr) => acc + curr.Receitas, 0);
  const totalExpense = monthlyCashFlow.reduce((acc, curr) => acc + curr.Despesas, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Inteligência Financeira
        </h1>
        <p className="text-muted-foreground">
          Análise profunda dos seus dados financeiros para melhores decisões.
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-border/60 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription>Total Receitas Histórico</CardDescription>
            <CardTitle className="text-2xl text-emerald-400 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              R$ {totalIncome.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass border-border/60 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription>Total Despesas Histórico</CardDescription>
            <CardTitle className="text-2xl text-rose-400 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              R$ {totalExpense.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass border-border/60 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription>Metas Ativas</CardDescription>
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
              <Target className="h-5 w-5" />
              {goals.length} Objetivos
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Fluxo de Caixa Mensal */}
        <Card className="glass border-border/60 shadow-xl shadow-black/5 xl:col-span-2">
          <CardHeader>
            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
            <CardDescription>Comparativo entre o que entra e o que sai</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {monthlyCashFlow.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyCashFlow} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} vertical={false} />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#888" fontSize={12} tickMargin={10} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                    <Legend />
                    <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhum dado disponível</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Evolução do Patrimônio */}
        <Card className="glass border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Evolução do Patrimônio</CardTitle>
            <CardDescription>Crescimento do seu saldo global ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', {month: 'short', day: 'numeric'})} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `R$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Saldo"]}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 3: Hábitos de Consumo (Radar) */}
        <Card className="glass border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Intensidade de Gastos na Semana</CardTitle>
            <CardDescription>Descubra em quais dias você costuma gastar mais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={spendingHabits}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                  <Radar name="Despesas" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 4: Despesas por Categoria */}
        <Card className="glass border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Top Despesas por Categoria</CardTitle>
            <CardDescription>Onde seu dinheiro está indo este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhuma despesa no mês</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 5: Progresso das Metas */}
        <Card className="glass border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Aceleração de Metas</CardTitle>
            <CardDescription>Como está o progresso dos seus top 5 objetivos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full relative">
              {goalsProgress.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                 <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={15} data={goalsProgress}>
                   <RadialBar
                     label={{ position: 'insideStart', fill: '#fff', fontSize: 10, formatter: (v: number) => `${v}%` }}
                     background={{ fill: '#333' }}
                     dataKey="uv"
                     cornerRadius={10}
                   />
                   <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, fontSize: '12px', color: '#888' }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                     formatter={(value: number) => `${value}% Concluído`}
                   />
                 </RadialBarChart>
               </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Crie metas para ver o progresso</div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Insights;

