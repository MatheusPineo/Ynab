import { useState, useMemo, useEffect } from "react";
import { useAccountStore } from "@/store/useAccountStore";
import { useTransactions } from "@/hooks/useTransactions";
import { formatMoney } from "@/lib/currency-utils";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Receipt } from "lucide-react";
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
import { Search, Filter, MoreHorizontal, Edit2, Trash2, CheckCircle2, Clock } from "lucide-react";
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

const Transactions = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("all");

  const { tree, fetchAccounts, getAccountName, getCategoryName } = useAccountStore();
  const { transactions, isLoading, deleteTransaction, updateTransaction } = useTransactions(selectedMonth + 1, selectedYear);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Flatten tree to get all accounts for filter
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Transações
        </h1>
        <p className="text-muted-foreground">
          Histórico detalhado de todas as suas movimentações financeiras.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/20 border-border/60 rounded-xl"
          />
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

        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-[180px] rounded-xl border-border/60 bg-muted/10">
            <SelectValue placeholder="Filtrar Conta" />
          </SelectTrigger>
          <SelectContent className="glass border-border/60">
            <SelectItem value="all">Todas as Contas</SelectItem>
            {allAccounts.map(acc => (
              <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <ImportModal />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-soft">
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
