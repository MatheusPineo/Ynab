import { useState, useMemo, useEffect } from "react";
import { useAccountStore } from "@/store/useAccountStore";
import { useTransactions } from "@/hooks/useTransactions";
import { formatMoney } from "@/lib/currency-utils";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Receipt, TrendingUp, TrendingDown, CheckCircle2, Clock, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";
import { ImportModal } from "@/components/dashboard/ImportModal";
import { useQueryClient } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/dashboard/PullToRefresh";
import { SwipeableTransactionCard } from "@/components/dashboard/SwipeableTransactionCard";
import { HelpTooltip } from "@/components/ui/help-tooltip";

const Transactions = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  const queryClient = useQueryClient();
  const { tree, fetchAccounts, getAccountName, getCategoryName } = useAccountStore();
  const { transactions, isLoading, deleteTransaction, updateTransaction } = useTransactions(selectedMonth + 1, selectedYear);

  const handleRefresh = async () => {
    const store = useAccountStore.getState();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      store.fetchAccounts(),
      store.fetchCategoryGroups(),
      store.fetchTransactions(),
    ]);
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const allAccounts = useMemo(() => {
    const flatten = (nodes: any[]): any[] => {
      let result: any[] = [];
      nodes.forEach(n => {
        result.push({ id: n.id, name: n.name });
        if (n.children) result = [...result, ...flatten(n.children)];
      });
      return result;
    };
    return flatten(tree);
  }, [tree]);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchesAccount = selectedAccountId === "all" || t.account === selectedAccountId;
    return matchesSearch && matchesAccount;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      await deleteTransaction.mutateAsync(id);
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
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Transações
          <HelpTooltip content="Visualize, busque e filtre todas as entradas e saídas de dinheiro do seu sistema." side="right" />
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Histórico detalhado de todas as suas movimentações financeiras.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Search row */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 sm:pl-10 bg-muted/20 border-border/60 rounded-xl h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <ImportModal />
        </div>

        {/* Period + Account filters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[115px] sm:w-[135px] glass border-border/40 rounded-xl h-9 sm:h-10 text-xs sm:text-sm shadow-soft focus:ring-0">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              {months.map((m, i) => (
                <SelectItem key={m} value={String(i)} className="text-xs sm:text-sm">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[80px] sm:w-[95px] glass border-border/40 rounded-xl h-9 sm:h-10 text-xs sm:text-sm shadow-soft focus:ring-0">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              {years.map(y => (
                <SelectItem key={y} value={String(y)} className="text-xs sm:text-sm">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="flex-1 min-w-[120px] sm:w-[180px] rounded-xl border-border/60 bg-muted/10 h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Filtrar Conta" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              <SelectItem value="all" className="text-xs sm:text-sm">Todas as Contas</SelectItem>
              {allAccounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id} className="text-xs sm:text-sm">{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile: Card List */}
      <div className="sm:hidden flex flex-col gap-1.5">
        <PullToRefresh onRefresh={handleRefresh}>
          {isLoading ? (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground border border-dashed border-border/60 rounded-xl">
              <Receipt className="h-6 w-6 opacity-20" />
              <p className="text-xs">Nenhuma transação encontrada.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="relative">
                  {/* Hidden trigger for swipe edit */}
                  <AddTransactionModal transaction={t}>
                    <button id={`edit-trigger-${t.id}`} className="hidden" />
                  </AddTransactionModal>

                  <SwipeableTransactionCard
                    onEdit={() => document.getElementById(`edit-trigger-${t.id}`)?.click()}
                    onDelete={() => handleDelete(t.id)}
                  >
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm hover:border-border/80 transition-all group">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          t.is_income ? "bg-emerald-500/10" : "bg-rose-500/10"
                        )}>
                          {t.is_income
                            ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs xs:text-sm font-semibold text-foreground truncate">{t.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(t.date).toLocaleDateString('pt-PT')}
                            </p>
                            <span className={cn(
                              "text-[9px] px-1 py-0.5 rounded-full flex items-center gap-0.5",
                              t.status === "realized"
                                ? "text-emerald-500 bg-emerald-500/10"
                                : "text-amber-500 bg-amber-500/10"
                            )}>
                              {t.status === "realized"
                                ? <><CheckCircle2 className="h-2 w-2" />Efetivada</>
                                : <><Clock className="h-2 w-2" />Pendente</>
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                        <p className={cn(
                          "text-xs xs:text-sm font-bold tabular-nums",
                          t.is_income ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {t.is_income ? "+" : "-"}
                          {formatMoney(Math.abs(Number(t.amount)), (() => {
                            const acc = useAccountStore.getState().getAccount(t.account);
                            return acc?.currency || "EUR";
                          })())}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-border/60">
                            <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-xs"
                              onClick={() => handleStatusToggle(t)}
                            >
                              {t.status === "realized"
                                ? <><Clock className="mr-2 h-3.5 w-3.5" />Marcar Pendente</>
                                : <><CheckCircle2 className="mr-2 h-3.5 w-3.5" />Efetivar</>
                              }
                            </DropdownMenuItem>
                            <AddTransactionModal transaction={t}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-xs">
                                <Edit2 className="mr-2 h-3.5 w-3.5" />
                                Editar
                              </DropdownMenuItem>
                            </AddTransactionModal>
                            <DropdownMenuItem className="cursor-pointer text-rose-400 focus:text-rose-400 text-xs" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </SwipeableTransactionCard>
                </div>
              ))}
            </div>
          )}
        </PullToRefresh>
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-soft">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableSkeleton rows={8} />
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState 
                    icon={Receipt} 
                    title="Nenhuma transação" 
                    description="Ainda não existem movimentações registradas para este filtro."
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
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary border-transparent font-normal">
                      {getAccountName(t.account)}
                    </Badge>
                  </TableCell>
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
                    {(() => {
                      const acc = useAccountStore.getState().getAccount(t.account);
                      const currency = acc?.currency || "EUR";
                      return (
                        <>
                          {t.is_income ? "+" : "-"}
                          {formatMoney(Math.abs(t.amount), currency)}
                        </>
                      );
                    })()}
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
  );
};

export default Transactions;
