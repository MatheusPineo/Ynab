import { useMemo } from "react";
import { useAccountStore } from "@/store/useAccountStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Insights = () => {
  const { getHistory } = useAccountStore();
  
  const historyData = useMemo(() => getHistory(), [getHistory]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Insights
        </h1>
        <p className="text-muted-foreground">
          Evolução do seu patrimônio ao longo do tempo.
        </p>
      </div>

      <Card className="glass border-border/60">
        <CardHeader>
          <CardTitle>Evolução do Patrimônio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Insights;
