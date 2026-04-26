import { useMemo } from "react";
import { useAccountStore, type CategoryNode } from "@/store/useAccountStore";
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
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const { getHistory, categoryGroups } = useAccountStore();
  
  const historyData = useMemo(() => getHistory(), [getHistory]);

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
    return data.sort((a, b) => b.value - a.value);
  }, [categoryGroups]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Insights
        </h1>
        <p className="text-muted-foreground">
          Evolução do seu patrimônio e análise detalhada de despesas.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gráfico de Patrimônio */}
        <Card className="glass border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Evolução do Patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#888" fontSize={12} tickMargin={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Despesas */}
        <Card className="glass border-border/60 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle>Despesas por Categoria (Este Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #333', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <p>Nenhuma despesa registrada neste mês.</p>
                  <p className="text-xs opacity-70">Adicione transações para visualizar o gráfico.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
