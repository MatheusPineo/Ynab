import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useTransactions } from "@/shared/hooks/useTransactions";
import { formatMoney } from "@/shared/lib/currency-utils";
import { TableSkeleton } from "@/shared/components/dashboard/TableSkeleton";
import { EmptyState } from "@/shared/components/dashboard/EmptyState";
import { Receipt, TrendingUp, TrendingDown, CheckCircle2, Clock, MoreHorizontal, Edit2, Trash2, ChevronDown, ChevronUp, CornerDownRight, ArrowUpDown } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
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
import { Button } from "@/shared/components/ui/button";
import { AddTransactionModal } from "@/modules/finance/components/AddTransactionModal";
import { ImportModal } from "@/modules/finance/components/ImportModal";
import { RecurringScopeModal } from "@/modules/finance/components/RecurringScopeModal";
import { PayBillModal } from "@/modules/finance/components/PayBillModal";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { useQueryClient } from "@tanstack/react-query";
import { PullToRefresh } from "@/shared/components/dashboard/PullToRefresh";
import { SwipeableTransactionCard } from "@/modules/finance/components/SwipeableTransactionCard";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";

const Transactions = () => {
  const { tree, fetchAccounts, getAccountName, getCategoryName, currentMonth, currentYear, setCurrentPeriod } = useAccountStore();
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonth ? currentMonth - 1 : new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => currentYear || new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<'date' | 'description' | 'status' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [payBillModalOpen, setPayBillModalOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<any>(null);
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);

  const queryClient = useQueryClient();
  const { transactions, isLoading, deleteTransaction, updateTransaction, payBill } = useTransactions(selectedMonth + 1, selectedYear);

  useEffect(() => { queryClient.invalidateQueries({ queryKey: ["transactions"] }); }, [queryClient, selectedMonth, selectedYear]);
  useEffect(() => { setSelectedMonth(currentMonth - 1); setSelectedYear(currentYear); }, [currentMonth, currentYear]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSort = (field: 'date' | 'description' | 'status') => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else setSortField(null);
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'date' | 'description' | 'status') => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40 hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3.5 w-3.5 text-primary" /> : <ChevronDown className="ml-1 h-3.5 w-3.5 text-primary" />;
  };

  const handleRefresh = async () => {
    const store = useAccountStore.getState();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      store.fetchAccounts(),
      store.fetchTransactions(),
    ]);
  };

  const handlePayBillClick = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setBillToPay(group);
    setPayBillModalOpen(true);
  };

  const handlePayBillConfirm = async (accountId: string, paymentMode: string, payloadData: any) => {
    if (billToPay && billToPay.items?.length > 0) {
      await payBill.mutateAsync({
        credit_card_id: String(billToPay.items[0].credit_card_id),
        bill_id: String(billToPay.statement_id),
        account_id: accountId,
        payment_mode: paymentMode as any,
        payload_data: payloadData
      });
      setPayBillModalOpen(false);
      setBillToPay(null);
    }
  };

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
    await updateTransaction.mutateAsync({ id: t.id, updates: { status: newStatus } });
  };

  const getCurrency = (accountId: string | number) => {
    try {
      const acc = useAccountStore.getState().getAccount?.(String(accountId));
      return acc?.currency || "EUR";
    } catch {
      return "EUR";
    }
  };

  const targetAccountIds = useMemo(() => {
    if (selectedAccountId === "all") return [];
    const ids: string[] = [selectedAccountId];
    const findAndCollect = (nodes: any[]): boolean => {
      for (const node of nodes) {
        if (String(node.id) === selectedAccountId) {
          const collect = (n: any) => {
            if (n.children && Array.isArray(n.children)) {
              n.children.forEach((child: any) => { ids.push(String(child.id)); collect(child); });
            }
          };
          collect(node);
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findAndCollect(node.children)) return true;
        }
      }
      return false;
    };
    findAndCollect(tree || []);
    return ids;
  }, [selectedAccountId, tree]);

  const filteredTransactions = useMemo(() => {
    return (Array.isArray(transactions) ? transactions : [])
      .filter((t) => {
        if (!t || typeof t !== 'object') return false;
        if (!t.description || !t.date) return false;
        if (selectedAccountId === "all" && t.account_type === 'credit_card') return false;

        const searchLower = search.toLowerCase();
        const descMatch = String(t.description || '').toLowerCase().includes(searchLower);
        const amountMatch = String(t.amount || 0).includes(searchLower.replace(',', '.'));
        const matchesSearch = descMatch || amountMatch;

        const accountIdStr = String(t.account || "");
        const matchesAccount = selectedAccountId === "all" || targetAccountIds.includes(accountIdStr);
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesType = typeFilter === "all" || (typeFilter === "recurring" && t.is_recurring);
        return matchesSearch && matchesAccount && matchesStatus && matchesType;
      })
      .map(t => ({
        ...t,
        amount: Number(t.amount) || 0,
        account: String(t.account || ""),
        items: Array.isArray(t.items) ? t.items : [],
      }));
  }, [transactions, search, selectedAccountId, targetAccountIds, statusFilter, typeFilter]);

  const processedTransactions = useMemo(() => {
    const groups = new Map<string, any>();
    const result: any[] = [];
    for (const t of filteredTransactions) {
      if (t.statement_id) {
        if (!groups.has(String(t.statement_id))) {
          groups.set(String(t.statement_id), {
            id: `stmt-${t.statement_id}`,
            isGroup: true,
            statement_id: t.statement_id,
            description: t.statement_name || "Fatura de Cartão",
            date: t.date,
            amount: 0,
            is_income: false,
            items: [],
            account: null,
            status: t.status,
          });
          result.push(groups.get(String(t.statement_id)));
        }
        const group = groups.get(String(t.statement_id));
        group.items.push(t);
        if (!t.is_income) group.amount += Number(t.amount);
      } else {
        result.push(t);
      }
    }
    return result;
  }, [filteredTransactions]);

  const sortedTransactions = useMemo(() => {
    if (!sortField) return processedTransactions;
    return [...processedTransactions].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'description') {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (sortField === 'date') {
        const timeA = new Date(valA || 0).getTime();
        const timeB = new Date(valB || 0).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortField === 'status') {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });
  }, [processedTransactions, sortField, sortOrder]);

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-20">
      {/* HEADER E FILTROS */}
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Transações
          <HelpTooltip content="Visualize, busque e filtre todas as entradas e saídas de dinheiro do seu sistema." side="right" />
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Histórico detalhado de todas as suas movimentações financeiras.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 sm:pl-10 bg-muted/20 border-border/60 rounded-xl h-9 sm:h-10 text-xs sm:text-sm" />
          </div>
          <ImportModal />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => { const m = Number(v); setSelectedMonth(m); setCurrentPeriod(m + 1, selectedYear); }}>
            <SelectTrigger className="w-[115px] sm:w-[135px] glass border-border/40 rounded-xl h-9 sm:h-10 text-xs sm:text-sm shadow-soft focus:ring-0">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">{months.map((m, i) => <SelectItem key={m} value={String(i)} className="text-xs sm:text-sm">{m}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={(v) => { const y = Number(v); setSelectedYear(y); setCurrentPeriod(selectedMonth + 1, y); }}>
            <SelectTrigger className="w-[80px] sm:w-[95px] glass border-border/40 rounded-xl h-9 sm:h-10 text-xs sm:text-sm shadow-soft focus:ring-0">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">{years.map(y => <SelectItem key={y} value={String(y)} className="text-xs sm:text-sm">{y}</SelectItem>)}</SelectContent>
          </Select>

          <GlobalAccountSelector value={selectedAccountId} onValueChange={setSelectedAccountId} placeholder="Filtrar Conta" showAllOption className="flex-1 min-w-[120px] sm:w-[180px] h-9 sm:h-10" />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] sm:w-[130px] glass border-border/40 rounded-xl h-9 sm:h-10 text-xs sm:text-sm shadow-soft focus:ring-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              <SelectItem value="all" className="text-xs sm:text-sm">Todos</SelectItem>
              <SelectItem value="realized" className="text-xs sm:text-sm">Efetivadas</SelectItem>
              <SelectItem value="pending" className="text-xs sm:text-sm">Pendentes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[110px] sm:w-[130px] glass border-border/40 rounded-xl h-9 sm:h-10 text-xs sm:text-sm shadow-soft focus:ring-0">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="glass border-border/60">
              <SelectItem value="all" className="text-xs sm:text-sm">Todos</SelectItem>
              <SelectItem value="recurring" className="text-xs sm:text-sm">Recorrentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : sortedTransactions.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhuma transação" description="Ainda não existem movimentações registradas para este filtro." />
      ) : (
        <>
          {/* LISTA MOBILE (NATIVA) */}
          <div className="sm:hidden flex flex-col gap-1.5">
            <PullToRefresh onRefresh={handleRefresh}>
              <div className="w-full flex flex-col gap-1.5">
                {sortedTransactions.map((t: any) => {
                  if (t.isGroup) {
                    return (
                      <div key={t.id} className="flex flex-col border border-border/40 bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => { if (t.items?.[0]?.credit_card_id) navigate(`/bill/${t.items[0].credit_card_id}/${t.statement_id}`); }}>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0"><Receipt className="h-3.5 w-3.5 text-indigo-500" /></div>
                            <div className="text-left min-w-0 flex-1">
                              <p className="text-xs xs:text-sm font-semibold text-foreground truncate">{t.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{t.items?.length || 0} Lançamentos • {new Date(t.date).toLocaleDateString('pt-PT')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {t.status !== 'paid' && t.status !== 'realized' && (
                              <Button variant="default" size="sm" className="h-7 text-[10px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={(e) => handlePayBillClick(t, e)}>Pagar Fatura</Button>
                            )}
                            <p className="text-xs xs:text-sm font-bold tabular-nums text-rose-400 hidden xs:block">-{formatMoney(Math.abs(Number(t.amount || 0)), "BRL")}</p>
                            <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={t.id} className="relative">
                      <SwipeableTransactionCard onEdit={() => setEditingTransaction(t)} onDelete={() => handleDeleteClick(t)}>
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm hover:border-border/80 transition-all group">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", t.is_income ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                              {t.is_income ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs xs:text-sm font-semibold text-foreground truncate">{t.description}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-[10px] text-muted-foreground">{new Date(t.date).toLocaleDateString('pt-PT')}</p>
                                {t.category && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary/90 border border-primary/20 truncate max-w-[100px]">
                                    {getCategoryName(t.category)}
                                  </span>
                                )}
                                <span className={cn("text-[9px] px-1 py-0.5 rounded-full flex items-center gap-0.5", t.status === "realized" ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10")}>
                                  {t.status === "realized" ? <><CheckCircle2 className="h-2 w-2" />Efetivada</> : <><Clock className="h-2 w-2" />Pendente</>}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                            <p className={cn("text-xs xs:text-sm font-bold tabular-nums", t.is_income ? "text-emerald-400" : "text-rose-400")}>
                              {t.is_income ? "+" : "-"}{formatMoney(Math.abs(Number(t.amount || 0)), getCurrency(t.account))}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass border-border/60">
                                <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => handleStatusToggle(t)}>
                                    {t.status === "realized" ? <><Clock className="mr-2 h-3.5 w-3.5" />Marcar Pendente</> : <><CheckCircle2 className="mr-2 h-3.5 w-3.5" />Efetivar</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setEditingTransaction(t)} className="cursor-pointer text-xs"><Edit2 className="mr-2 h-3.5 w-3.5" />Editar</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-rose-400 focus:text-rose-400 text-xs" onClick={() => handleDeleteClick(t)}><Trash2 className="mr-2 h-3.5 w-3.5" />Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </SwipeableTransactionCard>
                    </div>
                  );
                })}
              </div>
            </PullToRefresh>
          </div>

          {/* TABELA DESKTOP (NATIVA E LIMPA) */}
          <div className="hidden sm:flex flex-col rounded-xl border bg-card/40 overflow-hidden shadow-soft">
            <div className="flex items-center px-4 py-3 bg-muted/30 border-b font-medium text-muted-foreground text-sm shrink-0">
              <div className="w-[120px] cursor-pointer select-none" onClick={() => handleSort('date')}>Data {getSortIcon('date')}</div>
              <div className="flex-1 cursor-pointer select-none" onClick={() => handleSort('description')}>Descrição {getSortIcon('description')}</div>
              <div className="w-[150px]">Conta</div>
              <div className="w-[150px]">Categoria</div>
              <div className="w-[100px] cursor-pointer select-none" onClick={() => handleSort('status')}>Status {getSortIcon('status')}</div>
              <div className="w-[120px] text-right">Valor</div>
              <div className="w-[70px] text-right"></div>
            </div>
            
            <div className="flex flex-col w-full max-h-[600px] overflow-y-auto custom-scrollbar">
              {sortedTransactions.map((t: any) => {
                if (t.isGroup) {
                  return (
                    <div key={t.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors group cursor-pointer bg-muted/5 flex items-center w-full min-h-[52px] px-4 shrink-0" onClick={() => { if (t.items?.[0]?.credit_card_id) navigate(`/bill/${t.items[0].credit_card_id}/${t.statement_id}`); }}>
                      <div className="w-[120px] text-sm font-semibold">{new Date(t.date).toLocaleDateString('pt-PT')}</div>
                      <div className="flex-1 min-w-0 font-bold flex items-center gap-2 text-indigo-400 truncate pr-4">
                        <Receipt className="h-4 w-4 shrink-0" />
                        <span className="truncate">{t.description}</span>
                        <Badge variant="outline" className="text-[10px] ml-2 font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shrink-0">{t.items?.length || 0} Lançamentos</Badge>
                      </div>
                      <div className="w-[150px] shrink-0 pr-4"><Badge variant="secondary" className="bg-secondary/10 text-secondary border-transparent font-normal opacity-50">-</Badge></div>
                      <div className="w-[100px] shrink-0 pr-4"></div>
                      <div className="w-[120px] text-right font-bold tabular-nums text-rose-400 shrink-0 pr-4">-{formatMoney(Math.abs(Number(t.amount || 0)), "BRL")}</div>
                      <div className="w-[70px] text-right shrink-0"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full pointer-events-none text-muted-foreground"><CornerDownRight className="h-4 w-4" /></Button></div>
                    </div>
                  );
                }

                return (
                  <div key={t.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors group flex items-center w-full min-h-[52px] px-4 shrink-0">
                      <div className="w-[120px] text-sm">{t.date ? new Date(t.date).toLocaleDateString('pt-PT') : "-"}</div>
                      <div className="flex-1 truncate text-sm font-medium pr-4">{t.description}</div>
                      <div className="w-[150px] truncate text-sm text-muted-foreground pr-4">{getAccountName(t.account) || "-"}</div>
                      <div className="w-[150px] truncate text-sm text-muted-foreground pr-4">{t.category ? getCategoryName(t.category) : "-"}</div>
                      <div className="w-[100px] shrink-0 pr-4">
                        <Button variant="ghost" size="sm" onClick={() => handleStatusToggle(t)} className={cn("h-8 px-2 rounded-lg transition-all", t.status === "realized" ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" : "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10")}>
                          {t.status === "realized" ? (<div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /><span className="text-xs font-medium">Efetivada</span></div>) : (<div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span className="text-xs font-medium">Pendente</span></div>)}
                        </Button>
                      </div>
                      <div className={cn("w-[120px] text-right font-semibold tabular shrink-0 pr-4", !t.is_income ? "text-rose-400" : "text-emerald-400")}>
                        {t.is_income ? "+" : "-"}{formatMoney(Math.abs(Number(t.amount || 0)), getCurrency(t.account))}
                      </div>
                      <div className="w-[70px] flex justify-end shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-border/60">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setEditingTransaction(t)} className="cursor-pointer"><Edit2 className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-rose-400 focus:text-rose-400" onClick={() => handleDeleteClick(t)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* MODAIS */}
      {editingTransaction && (
        <AddTransactionModal 
            transaction={editingTransaction} 
            isOpen={!!editingTransaction} 
            onClose={() => setEditingTransaction(null)} 
        />
      )}

      <PayBillModal 
        isOpen={payBillModalOpen} 
        onClose={() => setPayBillModalOpen(false)} 
        onConfirm={handlePayBillConfirm} 
        billName={billToPay?.description || "Fatura"} 
        totalAmount={billToPay ? formatMoney(Math.abs(Number(billToPay.amount || 0)), "BRL") : "0,00"} 
        creditCardId={billToPay?.items?.[0]?.credit_card_id || ""} 
        billId={billToPay?.statement_id || ""} 
      />

      <RecurringScopeModal 
        open={scopeModalOpen} 
        onOpenChange={setScopeModalOpen} 
        actionType="delete" 
        onConfirm={handleConfirmDeleteScope} 
      />
    </div>
  );
};

export default Transactions;  