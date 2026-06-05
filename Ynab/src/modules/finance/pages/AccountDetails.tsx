import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useTransactions } from "@/shared/hooks/useTransactions";
import { authenticatedFetch } from "@/shared/lib/api";
import { formatMoney, CURRENCY_SYMBOL } from "@/shared/lib/currency-utils";
import { TableSkeleton } from "@/shared/components/dashboard/TableSkeleton";
import { EmptyState } from "@/shared/components/dashboard/EmptyState";
import { Receipt, ArrowLeft, TrendingUp, TrendingDown, Wallet, CheckCircle2, Clock, MoreHorizontal, Edit2, Trash2, Target } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { AddTransactionModal } from "@/modules/finance/components/AddTransactionModal";
import { ImportModal } from "@/modules/finance/components/ImportModal";
import { RecurringScopeModal } from "@/modules/finance/components/RecurringScopeModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Badge precisa ser importado para referência em BadgeVariant de AccountDetails
import { Badge } from "@/shared/components/ui/badge";

const AccountDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tree, fetchAccounts, getCategoryName, currentMonth, currentYear, setCurrentPeriod } = useAccountStore();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth - 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [search, setSearch] = useState("");
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { transactions, isLoading, deleteTransaction, updateTransaction } = useTransactions(selectedMonth + 1, selectedYear);

  useEffect(() => {
    setSelectedMonth(currentMonth - 1);
    setSelectedYear(currentYear);
  }, [currentMonth, currentYear]);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Busca direta no tree subscrito (reativo) em vez de getAccount (referência estável)
  const account = useMemo(() => {
    if (!id || !Array.isArray(tree)) return null;
    const idStr = String(id);
    const find = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node && String(node.id) === idStr) return node;
        if (node?.children && Array.isArray(node.children)) {
          const found = find(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return find(tree);
  }, [id, tree]);

  useEffect(() => {
    setLogoError(false);
    setImageError(false);
  }, [id]);

  useEffect(() => {
    fetchAccounts().finally(() => setAccountsLoaded(true));
  }, [fetchAccounts]);

  const currency = account?.currency || "EUR";

  const accountIds = useMemo(() => {
    if (!account) return [];
    const ids: string[] = [String(account.id)];
    const collectIds = (node: any) => {
      if (Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          ids.push(String(child.id));
          collectIds(child);
        });
      }
    };
    collectIds(account);
    return ids;
  }, [account]);

  const accountTransactions = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];
    return txs.filter(t => accountIds.includes(String(t.account)));
  }, [transactions, accountIds]);

  const filteredTransactions = useMemo(() => {
    return accountTransactions.filter((t) => {
      if (!t.date) return false;
      const [year, month] = t.date.split('-').map(Number);
      const matchesMonth = (month - 1) === selectedMonth && year === selectedYear;
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [accountTransactions, selectedMonth, selectedYear, search]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let pendingAmount = 0;

    accountTransactions.forEach(t => {
      if (!t.date) return;
      const [year, month] = t.date.split('-').map(Number);
      
      if ((month - 1) === selectedMonth && year === selectedYear) {
        if (t.is_income) {
          income += Number(t.amount);
        } else {
          expense += Math.abs(Number(t.amount));
        }
      }

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

  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);

  const chartData = useMemo(() => {
    const total = Number(account?.balance) || 0;
    const reserved = Number(account?.reserved_credit_balance) || 0;
    const available = Number(account?.available_balance) ?? (total - reserved);
    
    if (reserved <= 0) {
      return [
        { name: "Disponível para Gastos", value: Math.max(0, total) || 1, color: "#10b981" },
        { name: "Reservado para Cartão", value: 0, color: "#f59e0b" }
      ];
    }

    return [
      { name: "Disponível para Gastos", value: Math.max(0, available), color: "#10b981" },
      { name: "Reservado para Cartão", value: Math.max(0, reserved), color: "#f59e0b" }
    ];
  }, [account]);

  // Mostra loading enquanto as contas ainda não foram carregadas da API
  if (!account && !accountsLoaded) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 rounded bg-muted/20 animate-pulse mb-4" />
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card/40 backdrop-blur-sm">
          <table className="w-full">
            <tbody>
              <TableSkeleton rows={5} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground mt-20">
        <p>Conta não encontrada.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
        </Button>
      </div>
    );
  }


  const handleDeleteClick = (t: any) => {
    if (t.recurring_parent || t.is_recurring) {
      setTransactionToDelete(t);
      setScopeModalOpen(true);
    } else {
      if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
        deleteTransaction.mutateAsync({ id: t.id });
      }
    }
  };

  const handleConfirmDeleteScope = async (scope: "single" | "future" | "all") => {
    if (transactionToDelete) {
      await deleteTransaction.mutateAsync({ id: transactionToDelete.id, scope });
      setScopeModalOpen(false);
      setTransactionToDelete(null);
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
    <div className="flex flex-col gap-4 sm:gap-6 pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {account.bank_logo_url && !logoError ? (
                <div className="h-6 w-6 rounded-full overflow-hidden border border-border/40 bg-background/50 flex items-center justify-center p-0.5 shadow-sm shrink-0">
                  <img 
                    src={account.bank_logo_url} 
                    alt="" 
                    className="h-full w-full object-contain" 
                    onError={() => setLogoError(true)} 
                  />
                </div>
              ) : account.icon_url && !imageError ? (
                <img 
                  src={account.icon_url} 
                  alt="" 
                  className="h-6 w-6 rounded-full object-cover shadow-sm shrink-0" 
                  onError={() => setImageError(true)} 
                />
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary font-bold shrink-0">
                  {CURRENCY_SYMBOL[currency]}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {account.name}
              </h1>

              {/* Indicator for ceiling/limit (Expanded Version) */}
              {account.ceiling && Number(account.ceiling) > 0 && (() => {
                const totalBalance = Number(account.balance) || 0;
                const ceilVal = Math.round(Number(account.ceiling));
                const pct = Math.round((totalBalance / Number(account.ceiling)) * 100);
                
                let colorClasses = "";
                if (pct >= 100) {
                  colorClasses = "gradient-mixed text-zinc-950 font-black border-transparent shadow-md";
                } else if (pct >= 80) {
                  colorClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                } else if (pct >= 40) {
                  colorClasses = "bg-amber-500/15 text-amber-400 border-amber-500/25";
                } else {
                  colorClasses = "bg-rose-500/15 text-rose-400 border-rose-500/25";
                }
                
                return (
                  <div className={cn(
                    "flex items-center gap-1.5 ml-2.5 px-3 py-1 rounded-xl text-[10px] sm:text-xs font-black select-none shrink-0 transition-all border shadow-sm",
                    colorClasses
                  )}>
                    <Target className={cn("h-3.5 w-3.5 shrink-0", pct >= 100 ? "text-zinc-950" : "")} />
                    <span>
                      Teto: {CURRENCY_SYMBOL[currency] || ""}{ceilVal.toLocaleString('pt-BR')}
                      {" / "}
                      {pct}% do limite
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pl-14 sm:pl-0">
          <p className={cn(
            "text-2xl sm:text-3xl font-bold tracking-tight",
            Number(account.balance) < 0 ? "text-rose-500" : "text-foreground"
          )}>
            {formatMoney(account.balance, currency)}
          </p>
          {stats.pendingAmount !== 0 && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0">
                Prev: {formatMoney(stats.projectedBalance, currency)}
              </Badge>
            </div>
          )}
        </div>
      </div>


      {/* Period Filters */}
      <div className="flex flex-wrap items-center gap-2 pl-0">
        <Select 
          value={String(selectedMonth)} 
          onValueChange={(v) => {
            const m = Number(v);
            setSelectedMonth(m);
            setCurrentPeriod(m + 1, selectedYear);
          }}
        >
          <SelectTrigger className="w-[130px] sm:w-[135px] glass border-border/40 rounded-xl h-10 shadow-soft focus:ring-0">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent className="glass border-border/60">
            {months.map((m, i) => (
              <SelectItem key={m} value={String(i)}>{m}</SelectItem>
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
          <SelectTrigger className="w-[90px] sm:w-[95px] glass border-border/40 rounded-xl h-10 shadow-soft focus:ring-0">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent className="glass border-border/60">
            {years.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Macro Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="rounded-2xl sm:rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft">
          <CardContent className="p-3 sm:p-6 flex flex-col gap-1">
            <p className="text-[11px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">Entradas no Mês</span>
              <span className="sm:hidden">Entradas</span>
            </p>
            <p className="text-base sm:text-2xl font-bold text-emerald-500 tabular-nums">
              +{formatMoney(stats.income, currency)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl sm:rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft">
          <CardContent className="p-3 sm:p-6 flex flex-col gap-1">
            <p className="text-[11px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500 shrink-0" />
              <span className="hidden sm:inline">Saídas no Mês</span>
              <span className="sm:hidden">Saídas</span>
            </p>
            <p className="text-base sm:text-2xl font-bold text-rose-500 tabular-nums">
              -{formatMoney(stats.expense, currency)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl sm:rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft">
          <CardContent className="p-3 sm:p-6 flex flex-col gap-1">
            <p className="text-[11px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="hidden sm:inline">Balanço do Mês</span>
              <span className="sm:hidden">Balanço</span>
            </p>
            <p className={cn("text-base sm:text-2xl font-bold tabular-nums", stats.net >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {stats.net > 0 ? "+" : ""}{formatMoney(Math.abs(stats.net), currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {account.debtors_summary && account.debtors_summary.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-border/40 flex flex-col gap-3 shadow-soft animate-in slide-in-from-top-2 duration-300">
          <p className="text-xs sm:text-sm text-muted-foreground font-bold leading-relaxed uppercase tracking-wider font-mono">
            Devedores deste Envelope
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {account.debtors_summary.map((d: any) => (
              <div key={d.debtor_name} className="flex items-center justify-between p-2.5 rounded-xl bg-card/30 border border-border/20 text-xs">
                <span className="font-semibold text-muted-foreground truncate">{d.debtor_name}</span>
                <span className="font-bold text-foreground tabular-nums ml-2">{formatMoney(d.amount, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responsive Grid containing Transactions and Balance Lock Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Main Column: Transactions list */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight">Transações da Conta</h2>
            
            <div className="flex items-center gap-2">
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
            </div>
          </div>

          {/* Mobile: Card List */}
          <div className="sm:hidden flex flex-col gap-2">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-muted/20 animate-pulse" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                <Receipt className="h-8 w-8 opacity-20" />
                <p className="text-sm">Nenhuma movimentação encontrada.</p>
              </div>
            ) : (
              filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                      t.is_income ? "bg-emerald-500/10" : "bg-rose-500/10"
                    )}>
                      {t.is_income
                        ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                        : <TrendingDown className="h-4 w-4 text-rose-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(t.date).toLocaleDateString('pt-PT')}
                        </p>
                        <span className={cn(
                          "text-[10px] px-1 py-0.5 rounded-full",
                          t.status === "realized" ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"
                        )}>
                          {t.status === "realized" ? "Efetivada" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <p className={cn(
                      "text-sm font-bold tabular-nums",
                      t.is_income ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {t.is_income ? "+" : "-"}{formatMoney(Math.abs(t.amount), currency)}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass border-border/60">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusToggle(t)}>
                          {t.status === "realized"
                            ? <><Clock className="mr-2 h-4 w-4" />Marcar Pendente</>
                            : <><CheckCircle2 className="mr-2 h-4 w-4" />Efetivar</>
                          }
                        </DropdownMenuItem>
                        <AddTransactionModal transaction={t}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        </AddTransactionModal>
                        <DropdownMenuItem className="cursor-pointer text-rose-400 focus:text-rose-400" onClick={() => handleDeleteClick(t)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-soft">
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

                            <DropdownMenuItem className="cursor-pointer text-rose-400 focus:text-rose-400" onClick={() => handleDeleteClick(t)}>
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

        {/* Right Column: Balance Lock Distribution (Pie Chart Card) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="rounded-2xl sm:rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft">
            <CardContent className="p-4 sm:p-6 flex flex-col gap-4">
              <h3 className="text-base font-semibold tracking-tight">Distribuição do Saldo</h3>
              <div className="h-[200px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatMoney(Number(value), currency)}
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text (Physical Balance) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Saldo Físico</span>
                  <span className="text-sm font-extrabold text-foreground">{formatMoney(account.balance, currency)}</span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between text-xs sm:text-sm border-b border-border/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-muted-foreground font-medium">Disponível para Gastos</span>
                  </div>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatMoney(account.available_balance ?? (Number(account.balance) - (account.reserved_credit_balance ?? 0)), currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-muted-foreground font-medium">Reservado para Cartão</span>
                  </div>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatMoney(account.reserved_credit_balance ?? 0, currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <RecurringScopeModal
        open={scopeModalOpen}
        onOpenChange={setScopeModalOpen}
        actionType="delete"
        onConfirm={handleConfirmDeleteScope}
      />
    </div>
  );
};

export default AccountDetails;
