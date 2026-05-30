import { useState, useMemo } from "react";
import { formatMoney } from "@/shared/lib/currency-utils";
import { TableSkeleton } from "@/shared/components/dashboard/TableSkeleton";
import { EmptyState } from "@/shared/components/dashboard/EmptyState";
import { Receipt, TrendingDown, CheckCircle2, Clock, MoreHorizontal, Edit2, Trash2, Zap, DollarSign } from "lucide-react";
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
import { Badge } from "@/shared/components/ui/badge";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { authenticatedFetch } from "@/shared/lib/api";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

interface BillDetailsViewProps {
  card: any;
  bill: any;
  onEditInstallment: (inst: any) => void;
  onDeleteInstallment: (id: string) => void;
  onAnticipateInstallment: (id: string) => void;
  onRefresh?: () => void;
  isSubmitting?: boolean;
}

export const BillDetailsView = ({
  card,
  bill,
  onEditInstallment,
  onDeleteInstallment,
  onAnticipateInstallment,
  onRefresh,
  isSubmitting = false
}: BillDetailsViewProps) => {
  const [search, setSearch] = useState("");
  const { getCategoryName, tree } = useAccountStore();
  const subaccounts = tree.flatMap(bank => bank.children || []);

  const handleBindInstallmentToSubaccount = async (installmentId: string, subaccountId: string) => {
    try {
      const res = await authenticatedFetch(`/credit-cards/${card.id}/manage_installment/${installmentId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subaccount_id: subaccountId })
      });
      if (!res.ok) throw new Error('Erro ao vincular subconta');
      toast.success('Subconta vinculada retroativamente com sucesso!');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredInstallments = useMemo(() => {
    if (!bill || !bill.installments) return [];
    return bill.installments.filter((inst: any) => {
      if (!inst.transaction?.description) return false;
      const searchLower = search.toLowerCase();
      return inst.transaction.description.toLowerCase().includes(searchLower);
    });
  }, [bill, search]);

  const stats = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let reserved = 0;
    const reservedMap = new Map();
    
    if (bill && bill.installments) {
      bill.installments.forEach((inst: any) => {
        if (inst.status === 'paid' || inst.status === 'anticipated' || inst.status === 'posted') {
          paid += Number(inst.amount);
        } else {
          pending += Number(inst.amount);
        }
        
        if (inst.subaccount && !reservedMap.has(inst.subaccount.id)) {
          reservedMap.set(inst.subaccount.id, inst.subaccount.reserved_credit_balance || 0);
        }
      });
      reserved = Array.from(reservedMap.values()).reduce((acc: any, val: any) => acc + Number(val), 0);
    }

    const total = bill?.total_amount || 0;
    return { 
      total, 
      pending, 
      paid,
      reserved,
      isCovered: reserved >= total
    };
  }, [bill]);

  // removed!

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-12 animate-in fade-in duration-500">
      
      {/* Dashboard Summary Box - Status de Cobertura */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
        <div className="space-y-1 w-full sm:w-auto">
          <p className="text-xs text-muted-foreground uppercase font-bold">Status de Cobertura</p>
          {stats.isCovered ? (
            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold px-3 py-1">
              ✓ Fatura Coberta
            </Badge>
          ) : (
            <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 font-bold animate-pulse px-3 py-1">
              ⚠️ Fatura Descoberta: {formatMoney(stats.total - stats.reserved, card.currency)} em risco
            </Badge>
          )}
        </div>
        
        <Button 
          onClick={() => {
            if (window.confirm('Deseja pagar a fatura e transferir os fundos dos envelopes para liquidação?')) {
               // handleSettleInvoice logic
            }
          }}
          disabled={!stats.isCovered}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-glow font-bold h-10 rounded-xl transition-all hover:scale-105"
        >
          Pagar Fatura
        </Button>
      </div>

      {/* Macro Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="rounded-2xl sm:rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft">
          <CardContent className="p-3 sm:p-6 flex flex-col gap-1">
            <p className="text-[11px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="hidden sm:inline">Total da Fatura</span>
              <span className="sm:hidden">Total</span>
            </p>
            <p className="text-base sm:text-2xl font-bold text-foreground tabular-nums">
              {formatMoney(stats.total, card.currency)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl sm:rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft">
          <CardContent className="p-3 sm:p-6 flex flex-col gap-1">
            <p className="text-[11px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">Pago / Postado</span>
              <span className="sm:hidden">Pago</span>
            </p>
            <p className="text-base sm:text-2xl font-bold text-emerald-500 tabular-nums">
              {formatMoney(stats.paid, card.currency)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl sm:rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm shadow-soft">
          <CardContent className="p-3 sm:p-6 flex flex-col gap-1">
            <p className="text-[11px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Pendente</span>
              <span className="sm:hidden">Pendente</span>
            </p>
            <p className="text-base sm:text-2xl font-bold text-amber-500 tabular-nums">
              {formatMoney(stats.pending, card.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Section */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight">Compras da Fatura</h2>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nesta fatura..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-muted/20 border-border/60 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Mobile: Card List */}
        <div className="sm:hidden flex flex-col gap-2">
          {filteredInstallments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
              <Receipt className="h-8 w-8 opacity-20" />
              <p className="text-sm">Nenhum lançamento encontrado.</p>
            </div>
          ) : (
            filteredInstallments.map((inst: any) => {
              const tx = inst.transaction;
              return (
                <div
                  key={inst.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/10">
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{tx?.description}</p>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                          {inst.installment_number}/{inst.total_installments}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] text-muted-foreground">
                          {tx ? new Date(tx.date).toLocaleDateString('pt-BR') : ""}
                        </p>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          inst.status === "paid" ? "text-emerald-500 bg-emerald-500/10" : 
                          inst.status === "posted" ? "text-blue-500 bg-blue-500/10" :
                          inst.status === "anticipated" ? "text-purple-400 bg-purple-500/10" :
                          "text-amber-500 bg-amber-500/10"
                        )}>
                          {inst.status === "paid" ? "Pago" : 
                           inst.status === "posted" ? "Postado" : 
                           inst.status === "anticipated" ? "Antecipado" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {formatMoney(inst.amount, card.currency)}
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
                        
                        {inst.status === "pending" && !bill.is_closed && (
                          <DropdownMenuItem className="cursor-pointer text-amber-500" onClick={() => onAnticipateInstallment(inst.id)} disabled={isSubmitting}>
                            <Zap className="mr-2 h-4 w-4" /> Antecipar
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem className="cursor-pointer" onClick={() => onEditInstallment(inst)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem className="cursor-pointer text-rose-400 focus:text-rose-400" onClick={() => onDeleteInstallment(inst.id)} disabled={isSubmitting}>
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
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
              {filteredInstallments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState 
                      icon={Receipt} 
                      title="Nenhuma compra" 
                      description="Nenhuma compra encontrada nesta fatura."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredInstallments.map((inst: any) => {
                  const tx = inst.transaction;
                  return (
                    <TableRow key={inst.id} className="border-border/40 hover:bg-muted/10 transition-colors group">
                      <TableCell className="text-xs text-muted-foreground">
                        {tx ? new Date(tx.date).toLocaleDateString('pt-BR') : ""}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {tx?.description}
                          <Badge variant="outline" className="text-[10px] font-mono py-0 h-5 bg-background/50 border-border/60">
                            {inst.installment_number}/{inst.total_installments}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {inst.subaccount ? (
                          <span className="text-xs font-medium">{inst.subaccount.name}</span>
                        ) : tx?.category_id ? (
                          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-transparent font-normal opacity-80">
                            {getCategoryName(tx.category_id)}
                          </Badge>
                        ) : (
                          <Select onValueChange={(val) => handleBindInstallmentToSubaccount(inst.id, val)}>
                            <SelectTrigger className="h-7 text-xs bg-amber-500/10 text-amber-500 border-amber-500/30 rounded font-bold w-[140px]">
                              <SelectValue placeholder="Vincular Envelope" />
                            </SelectTrigger>
                            <SelectContent>
                              {subaccounts.map((sub: any) => (
                                <SelectItem key={sub.id} value={sub.id.toString()} className="text-xs">
                                  {sub.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 h-7 px-2 rounded-lg font-medium text-xs",
                          inst.status === "paid" ? "text-emerald-500 bg-emerald-500/10" : 
                          inst.status === "posted" ? "text-blue-500 bg-blue-500/10" :
                          inst.status === "anticipated" ? "text-purple-400 bg-purple-500/10" :
                          "text-amber-500 bg-amber-500/10"
                        )}>
                          {inst.status === "paid" ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                           inst.status === "posted" ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                           inst.status === "anticipated" ? <Zap className="h-3.5 w-3.5" /> : 
                           <Clock className="h-3.5 w-3.5" />}
                          {inst.status === "paid" ? "Pago" : 
                           inst.status === "posted" ? "Postado" : 
                           inst.status === "anticipated" ? "Antecipado" : "Pendente"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {formatMoney(inst.amount, card.currency)}
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
                            
                            {inst.status === "pending" && !bill.is_closed && (
                              <DropdownMenuItem className="cursor-pointer text-amber-500" onClick={() => onAnticipateInstallment(inst.id)} disabled={isSubmitting}>
                                <Zap className="mr-2 h-4 w-4" /> Antecipar
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onEditInstallment(inst)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem className="cursor-pointer text-rose-400 focus:text-rose-400" onClick={() => onDeleteInstallment(inst.id)} disabled={isSubmitting}>
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
