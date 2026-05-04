import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccountStore } from "@/store/useAccountStore";
import { useTransactions } from "@/hooks/useTransactions";
import { formatMoney, CURRENCY_SYMBOL } from "@/lib/currency-utils";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Receipt, ArrowLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Search, Filter, MoreHorizontal, Edit2, Trash2, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";
import { ImportModal } from "@/components/dashboard/ImportModal";

const AccountDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccount, fetchAccounts, getCategoryName } = useAccountStore();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");

  const { transactions, isLoading, deleteTransaction, updateTransaction } = useTransactions(selectedMonth + 1, selectedYear);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const account = id ? getAccount(id) : null;

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // If account not found (or still loading from store)
  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground mt-20">
        <p>Procurando conta ou conta não encontrada...</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const currency = account.currency || "EUR";

  const accountTransactions = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];
    return txs.filter(t => String(t.account) === id);
  }, [transactions, id]);

  const filteredTransactions = useMemo(() => {
    return accountTransactions.filter((t) => {
      if (!t.date) return false;
      // Usar split em vez de new Date para evitar problemas de fuso horário (timezone shift)
      const [year, month] = t.date.split('-').map(Number);
      const matchesMonth = (month - 1) === selectedMonth && year === selectedYear;
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [accountTransactions, selectedMonth, selectedYear, search]);

  // Calculate Macro Stats for selected month
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let pendingAmount = 0;

    accountTransactions.forEach(t => {
      if (!t.date) return;
      const [year, month] = t.date.split('-').map(Number);
      
      // Estatísticas do mês selecionado
      if ((month - 1) === selectedMonth && year === selectedYear) {
        if (t.is_income) {
          income += Number(t.amount);
        } else {
          expense += Math.abs(Number(t.amount));
        }
      }

      // Cálculo de pendentes (total da conta, não apenas do mês)
      if (t.status === "pending") {
        if (t.is_income) {
          pendingAmount += Number(t.amount);
        } else {
          pendingAmount -= Math.abs(Number(t.amount));
        }
      }
    });

    return { 
      income, 
      expense, 
      net: income - expense,
      pendingAmount,
      projectedBalance: (account?.balance || 0) + pendingAmount
    };
  }, [accountTransactions, selectedMonth, selectedYear, account?.balance]);

  const handleDelete = async (tId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      await deleteTransaction.mutateAsync(tId);
    }
  };

  const handleStatusToggle = async (t: any) => {
    const newStatus = t.status === "realized" ? "pending" : "realized";
    await updateTransaction.mutateAsync({ 
      id: t.id, 
      updates: { status: newStatus } 
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header and Filter Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {account.icon_url ? (
                <img src={account.icon_url} alt="" className="h-6 w-6 rounded-full object-cover shadow-sm" />
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary font-bold">
                  {CURRENCY_SYMBOL[currency]}
                </span>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {account.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end">
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {formatMoney(account.balance, currency)}
          </p>
          {stats.pendingAmount !== 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0">
                Previsto: {formatMoney(stats.projectedBalance, currency)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                ({stats.pendingAmount > 0 ? "+" : ""}{formatMoney(stats.pendingAmount, currency)} pendente)
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[135px] glass border-border/40 rounded-xl h-10 shadow-soft focus:ring-0">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              {months.map((m, i) => (
                <SelectItem key={m} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[95px] glass border-border/40 rounded-xl h-10 shadow-soft focus:ring-0">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Macro Vision (Stats) */}
      <div className="flex flex-row gap-4 w-full">
        <Card className="flex-1 rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft min-w-0">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Entradas no Mês
            </p>
            <p className="text-2xl font-bold text-emerald-500">
              +{formatMoney(stats.income, currency)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="flex-1 rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft min-w-0">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              Saídas no Mês
            </p>
            <p className="text-2xl font-bold text-rose-500">
              -{formatMoney(stats.expense, currency)}
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft min-w-0">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Balanço do Mês
            </p>
            <p className={cn("text-2xl font-bold", stats.net >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {stats.net > 0 ? "+" : ""}{formatMoney(Math.abs(stats.net), currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Micro Vision (Transactions Table) */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight w-full sm:w-auto">Transações da Conta</h2>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nesta conta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-muted/20 border-border/60 rounded-xl"
              />
            </div>
            
            <ImportModal />
            <AddTransactionModal initialAccountId={id} />
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-soft">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/60">
                 <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableSkeleton rows={5} />
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState 
                      icon={Receipt} 
                      title="Nenhuma transação" 
                      description="Nenhuma movimentação encontrada para esta conta."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id} className="border-border/40 hover:bg-muted/10 transition-colors group">
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('pt-PT')}
                    </TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusToggle(t)}
                        className={cn(
                          "h-8 px-2 rounded-lg transition-all",
                          t.status === "realized" 
                            ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" 
                            : "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                        )}
                      >
                        {t.status === "realized" ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Efetivada</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-medium">Pendente</span>
                          </div>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold tabular",
                      !t.is_income ? "text-rose-400" : "text-emerald-400"
                    )}>
                      {t.is_income ? "+" : "-"}
                      {formatMoney(Math.abs(t.amount), currency)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-border/60">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <AddTransactionModal transaction={t}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          </AddTransactionModal>

                          <DropdownMenuItem className="cursor-pointer text-rose-400 focus:text-rose-400" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
