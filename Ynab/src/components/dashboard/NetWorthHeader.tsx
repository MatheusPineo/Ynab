import { useMemo } from "react";
import { Wallet, TrendingUp, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatMoney,
  totalsByCurrency,
} from "@/data/mockData";
import { useAccountStore } from "@/store/useAccountStore";
import { useCurrencyStore, type Currency } from "@/store/useCurrencyStore";
import { cn } from "@/lib/utils";

interface Props {
  base: Currency;
  onBaseChange: (c: Currency) => void;
  customTotal?: number;
}

export const NetWorthHeader = ({ base, onBaseChange, customTotal }: Props) => {
  const { tree } = useAccountStore();
  const { isLoading, lastUpdated } = useCurrencyStore();
  
  const byCurrency = useMemo(() => totalsByCurrency(tree), [tree]);

  return (
    <section className="relative overflow-hidden rounded-3xl gradient-card border border-border/60 p-6 sm:p-8 shadow-elevated transition-all">
      {/* Glow accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full"
        style={{ background: "var(--gradient-glow)" }}
      />
      
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            Patrimônio Total Líquido
          </div>

          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <h1 className={cn(
              "text-4xl sm:text-5xl font-bold tabular tracking-tight text-gradient-mixed transition-all duration-500",
              isLoading && "opacity-50 blur-[1px] animate-pulse"
            )}>
              {formatMoney(customTotal || 0, base)}
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5" />
              taxa real: {base}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
             <RefreshCw className={cn("h-2.5 w-2.5", isLoading && "animate-spin")} />
             {lastUpdated 
                ? `Atualizado em: ${new Date(lastUpdated).toLocaleTimeString()}` 
                : "Buscando taxas em tempo real..."}
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Moeda base do App
          </span>
          <Select value={base} onValueChange={(v) => onBaseChange(v as Currency)}>
            <SelectTrigger className="w-[140px] glass border-border/60 h-10 font-medium rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              <SelectItem value="EUR">€ EUR — Euro</SelectItem>
              <SelectItem value="BRL">R$ BRL — Real</SelectItem>
              <SelectItem value="USD">$ USD — Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Per-currency breakdown */}
      <div className="relative mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.entries(byCurrency) as [any, number][])
          .filter(([, v]) => v > 0)
          .map(([cur, value]) => (
            <div
              key={cur}
              className="rounded-2xl border border-border/60 bg-background/40 backdrop-blur-sm px-4 py-3 hover:border-primary/30 transition-colors group"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                Saldo em {cur}
              </div>
              <div className="mt-1 text-lg font-semibold tabular text-foreground">
                {formatMoney(value, cur as any)}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};
