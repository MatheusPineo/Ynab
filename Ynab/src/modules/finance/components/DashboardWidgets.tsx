import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  X,
  PieChart as PieIcon,
  BarChart3,
  Wallet,
  Zap,
  HandCoins,
  Activity,
  LayoutGrid,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Upload,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";
import { useDebtStore } from "@/modules/finance/store/useDebtStore";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import { AddTransactionModal } from "./AddTransactionModal";

type WidgetId =
  | "categoryDonut"
  | "weeklyFlow"
  | "topAccounts"
  | "quickActions"
  | "debtSummary"
  | "activity"
  | "runwayThermometer";

interface WidgetMeta {
  id: WidgetId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  size: "sm" | "md" | "lg";
}

const WIDGETS: WidgetMeta[] = [
  { id: "quickActions", title: "Ações Rápidas", description: "Acessos diretos para criar.", icon: Zap, size: "sm" },
  { id: "categoryDonut", title: "Distribuição de Gastos", description: "Pizza por categoria.", icon: PieIcon, size: "md" },
  { id: "weeklyFlow", title: "Fluxo Semanal", description: "Receitas vs despesas (7d).", icon: BarChart3, size: "md" },
  { id: "topAccounts", title: "Top Contas", description: "Maiores saldos.", icon: Wallet, size: "sm" },
  { id: "debtSummary", title: "Resumo de Dívidas", description: "Visão geral das dívidas.", icon: HandCoins, size: "sm" },
  { id: "activity", title: "Atividade (14d)", description: "Heatmap de movimentações.", icon: Activity, size: "md" },
  { id: "runwayThermometer", title: "Termômetro de Liquidez", description: "Autonomia financeira (runway).", icon: Sparkles, size: "sm" },
];


const DEFAULT_WIDGETS: WidgetId[] = ["quickActions", "categoryDonut", "weeklyFlow"];
const STORAGE_KEY = "dashboard_widgets_v1";

const DONUT_COLORS = ["#10b981", "#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

const fmt = (v: number, c = "EUR") =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: c, maximumFractionDigits: 2 }).format(v);

// ── Reusable shell ─────────────────────────────────────────
const WidgetCard = ({
  meta,
  onRemove,
  className,
  children,
}: {
  meta: WidgetMeta;
  onRemove: () => void;
  className?: string;
  children: React.ReactNode;
}) => {
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 shadow-soft hover:border-primary/30 hover:shadow-glow/30 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">{meta.title}</h3>
            <p className="text-[10px] text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
          title="Remover widget"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
};

// ── Individual widgets ────────────────────────────────────
const QuickActions = () => (
  <div className="grid grid-cols-2 gap-2">
    <AddTransactionModal>
      <button className="group/btn flex flex-col items-start gap-2 p-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 hover:border-primary/50 hover:scale-[1.02] transition-all w-full text-left">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Plus className="h-4 w-4 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground">Nova Transação</span>
      </button>
    </AddTransactionModal>
    <Link
      to="/goals"
      className="group/btn flex flex-col items-start gap-2 p-3 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 border border-violet-500/20 hover:border-violet-500/50 hover:scale-[1.02] transition-all"
    >
      <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
        <Target className="h-4 w-4 text-violet-400" />
      </div>
      <span className="text-xs font-semibold text-foreground">Nova Meta</span>
    </Link>
    <Link
      to="/accounts"
      className="group/btn flex flex-col items-start gap-2 p-3 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/50 hover:scale-[1.02] transition-all"
    >
      <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <Wallet className="h-4 w-4 text-blue-400" />
      </div>
      <span className="text-xs font-semibold text-foreground">Nova Conta</span>
    </Link>
    <Link
      to="/transactions"
      className="group/btn flex flex-col items-start gap-2 p-3 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/20 hover:border-amber-500/50 hover:scale-[1.02] transition-all"
    >
      <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
        <Upload className="h-4 w-4 text-amber-400" />
      </div>
      <span className="text-xs font-semibold text-foreground">Importar</span>
    </Link>
  </div>
);

const CategoryDonut = () => {
  const { transactions } = useAccountStore();
  const { baseCurrency } = useCurrencyStore();

  const data = useMemo(() => {
    const month = format(new Date(), "yyyy-MM");
    const map: Record<string, number> = {};
    (transactions || []).forEach((t: any) => {
      if (!t.date || t.is_income) return;
      if (t.date.substring(0, 7) !== month) return;
      const name = t.category_name || "Sem Categoria";
      map[name] = (map[name] || 0) + Math.abs(Number(t.amount));
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  const total = data.reduce((a, b) => a + b.value, 0);

  if (!data.length) {
    return (
      <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground gap-2">
        <PieIcon className="h-8 w-8 opacity-20" />
        <p className="text-xs">Sem despesas no mês</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="h-[160px] w-[160px] flex-shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: any) => fmt(v, baseCurrency)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Total</p>
          <p className="text-sm font-bold text-foreground">{fmt(total, baseCurrency)}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="truncate text-foreground">{d.name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WeeklyFlow = () => {
  const { transactions } = useAccountStore();
  const { baseCurrency } = useCurrencyStore();

  const data = useMemo(() => {
    const days: { day: string; receita: number; despesa: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      days.push({ day: format(d, "EEE", { locale: ptBR }).slice(0, 3), receita: 0, despesa: 0 });
    }
    (transactions || []).forEach((t: any) => {
      if (!t.date) return;
      try {
        const d = startOfDay(parseISO(t.date));
        for (let i = 6; i >= 0; i--) {
          const ref = startOfDay(subDays(new Date(), i));
          if (d.getTime() === ref.getTime()) {
            const idx = 6 - i;
            const v = Math.abs(Number(t.amount));
            if (t.is_income) days[idx].receita += v;
            else days[idx].despesa += v;
          }
        }
      } catch {}
    });
    return days;
  }, [transactions]);

  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v: any) => fmt(v, baseCurrency)}
          />
          <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const TopAccounts = () => {
  const { tree } = useAccountStore();
  const { baseCurrency, convert } = useCurrencyStore();

  const accounts = useMemo(() => {
    const flat: { name: string; balance: number; emoji?: string }[] = [];
    const walk = (nodes: any[]) => {
      nodes?.forEach((n) => {
        if (typeof n.balance === "number" || n.balance) {
          flat.push({
            name: n.name,
            balance: convert(Number(n.balance) || 0, (n.currency || baseCurrency) as any, baseCurrency),
            emoji: n.emoji || n.icon,
          });
        }
        if (n.children?.length) walk(n.children);
      });
    };
    walk(tree || []);
    return flat.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5);
  }, [tree, convert, baseCurrency]);

  if (!accounts.length) {
    return (
      <div className="h-[140px] flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Wallet className="h-8 w-8 opacity-20" />
        <p className="text-xs">Sem contas cadastradas</p>
      </div>
    );
  }

  const max = Math.max(...accounts.map((a) => Math.abs(a.balance)), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {accounts.map((a, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-foreground truncate max-w-[140px]">
              {a.emoji ? `${a.emoji} ` : ""}{a.name}
            </span>
            <span className={cn("text-xs font-semibold tabular-nums", a.balance < 0 ? "text-rose-400" : "text-foreground")}>
              {fmt(a.balance, baseCurrency)}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-700"
              style={{ width: `${(Math.abs(a.balance) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const DebtSummary = () => {
  const { debts, fetchDebts } = useDebtStore();
  const { baseCurrency, convert } = useCurrencyStore();

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const stats = useMemo(() => {
    let owe = 0;
    let owed = 0;
    (debts || []).forEach((d) => {
      const remaining = convert(Number(d.amount_remaining) || 0, (d.currency || baseCurrency) as any, baseCurrency);
      if (d.is_mine) owe += remaining;
      else owed += remaining;
    });
    return { owe, owed, net: owed - owe, count: debts?.length || 0 };
  }, [debts, convert, baseCurrency]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 uppercase tracking-wider mb-1">
            <ArrowDownRight className="h-3 w-3" />Devo
          </div>
          <p className="text-sm font-bold text-rose-400 tabular-nums">{fmt(stats.owe, baseCurrency)}</p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase tracking-wider mb-1">
            <ArrowUpRight className="h-3 w-3" />Me devem
          </div>
          <p className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(stats.owed, baseCurrency)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/20 border border-border/40">
        <span className="text-[11px] text-muted-foreground">Saldo líquido</span>
        <span className={cn("text-sm font-bold tabular-nums", stats.net < 0 ? "text-rose-400" : "text-emerald-400")}>
          {stats.net >= 0 ? "+" : ""}{fmt(stats.net, baseCurrency)}
        </span>
      </div>
      <Link to="/debts" className="text-[11px] text-primary hover:underline text-center">
        Gerenciar {stats.count} dívida{stats.count !== 1 ? "s" : ""}
      </Link>
    </div>
  );
};

const ActivityHeatmap = () => {
  const { transactions } = useAccountStore();

  const cells = useMemo(() => {
    const arr: { date: Date; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      arr.push({ date: startOfDay(subDays(new Date(), i)), count: 0 });
    }
    (transactions || []).forEach((t: any) => {
      if (!t.date) return;
      try {
        const d = startOfDay(parseISO(t.date)).getTime();
        const c = arr.find((x) => x.date.getTime() === d);
        if (c) c.count++;
      } catch {}
    });
    return arr;
  }, [transactions]);

  const max = Math.max(...cells.map((c) => c.count), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, i) => {
          const intensity = c.count / max;
          return (
            <div
              key={i}
              className="aspect-square rounded-md border border-border/40 transition-all hover:scale-110"
              style={{
                background:
                  c.count === 0
                    ? "hsl(var(--muted) / 0.25)"
                    : `hsl(var(--primary) / ${0.25 + intensity * 0.7})`,
              }}
              title={`${format(c.date, "dd/MM", { locale: ptBR })}: ${c.count} transação(ões)`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>14 dias</span>
        <div className="flex items-center gap-1">
          <span>menos</span>
          {[0.2, 0.4, 0.6, 0.9].map((o, i) => (
            <span key={i} className="h-2 w-2 rounded-sm" style={{ background: `hsl(var(--primary) / ${o})` }} />
          ))}
          <span>mais</span>
        </div>
      </div>
    </div>
  );
};

import { useAssetStore } from "@/modules/finance/store/useAssetStore";
import { Progress } from "@/shared/components/ui/progress";

const RunwayThermometer = () => {
  const { runway, fetchRunway } = useAssetStore();
  const { baseCurrency } = useCurrencyStore();

  useEffect(() => {
    fetchRunway();
  }, [fetchRunway]);

  const runwayProgress = useMemo(() => {
    if (!runway || runway.runway_months === null) return 0;
    return Math.min(100, (runway.runway_months / 12) * 100);
  }, [runway]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-muted-foreground">Autonomia</span>
        <span className="text-lg font-bold text-foreground">
          {runway && runway.runway_months !== null ? `${runway.runway_months.toFixed(1)} meses` : "Sem dados"}
        </span>
      </div>

      <div className="space-y-1">
        <Progress value={runwayProgress} className="h-2 rounded-full" />
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>0 meses</span>
          <span>Meta: 12 meses</span>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground leading-relaxed bg-muted/10 p-2 rounded-lg border border-border/20">
        Disponível Líquido: <strong className="text-foreground">{runway ? fmt(runway.total_liquid_assets, baseCurrency) : "€0,00"}</strong>
      </div>
      <Link to="/assets" className="text-[11px] text-primary hover:underline text-center">
        Ver Detalhes do Patrimônio
      </Link>
    </div>
  );
};


// ── Main exported component ───────────────────────────────
export const DashboardWidgets = () => {
  const [active, setActive] = useState<WidgetId[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    } catch {}
  }, [active]);

  const toggle = (id: WidgetId) =>
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const remove = (id: WidgetId) => setActive((prev) => prev.filter((x) => x !== id));

  const renderWidget = (id: WidgetId) => {
    const meta = WIDGETS.find((w) => w.id === id)!;
    const sizeClass =
      meta.size === "lg"
        ? "lg:col-span-3"
        : meta.size === "md"
          ? "lg:col-span-2"
          : "lg:col-span-1";

    let body: React.ReactNode = null;
    switch (id) {
      case "quickActions": body = <QuickActions />; break;
      case "categoryDonut": body = <CategoryDonut />; break;
      case "weeklyFlow": body = <WeeklyFlow />; break;
      case "topAccounts": body = <TopAccounts />; break;
      case "debtSummary": body = <DebtSummary />; break;
      case "activity": body = <ActivityHeatmap />; break;
      case "runwayThermometer": body = <RunwayThermometer />; break;
    }

    return (
      <WidgetCard key={id} meta={meta} onRemove={() => remove(id)} className={sizeClass}>
        {body}
      </WidgetCard>
    );
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">
              Painel Personalizável
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Seus Widgets
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adicione, remova e arrume cartões para deixar o painel do seu jeito.
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button className="gradient-primary text-primary-foreground rounded-xl shadow-glow hover:scale-[1.02] transition-transform h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar Widget
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-2 glass border-border/60 rounded-2xl"
          >
            <div className="px-2 py-1.5 mb-1 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Biblioteca de Widgets</span>
            </div>
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
              {WIDGETS.map((w) => {
                const enabled = active.includes(w.id);
                const Icon = w.icon;
                return (
                  <button
                    key={w.id}
                    onClick={() => toggle(w.id)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-xl text-left transition-all",
                      enabled
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/30 border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      enabled ? "bg-primary/20" : "bg-muted/40"
                    )}>
                      <Icon className={cn("h-4 w-4", enabled ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{w.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{w.description}</p>
                    </div>
                    {enabled && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Widget grid */}
      {active.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {active.map(renderWidget)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/20 p-10 flex flex-col items-center justify-center gap-3 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Painel vazio</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique em <span className="text-primary font-medium">Adicionar Widget</span> para começar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
