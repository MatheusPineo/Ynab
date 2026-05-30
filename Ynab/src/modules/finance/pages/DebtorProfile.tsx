import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle2, User, Wallet, Trash2 } from "lucide-react";
import { authenticatedFetch } from "@/shared/lib/api";
import { formatMoney } from "@/shared/lib/currency-utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";

interface DebtItem {
  id: number;
  product_name: string;
  total_amount: number;
  paid_amount: number;
  status: 'PENDING' | 'PARTIAL' | 'SETTLED';
  date_created: string;
}

interface GroupedDebt {
  subaccount_id: number;
  subaccount_name: string;
  total_outstanding_balance: number;
  items: DebtItem[];
}

export const DebtorProfile = () => {
  const { id: debtorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [debtorName, setDebtorName] = useState("");
  const [groups, setGroups] = useState<GroupedDebt[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const { fetchAccounts } = useAccountStore();

  const fetchDebtorData = async () => {
    if (!debtorId || debtorId === "undefined" || debtorId === "null") return;
    try {
      const profileRes = await authenticatedFetch(`/debtors/${debtorId}/`);
      if (profileRes.ok) {
        const debtorData = await profileRes.json();
        setDebtorName(debtorData.name);
      }

      const debtsRes = await authenticatedFetch(`/debtors/${debtorId}/grouped_debts/`);
      if (debtsRes.ok) {
        const data = await debtsRes.json();
        setGroups(data);
      }
    } catch (err) {
      toast.error("Erro ao carregar dados do devedor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debtorId && debtorId !== "undefined" && debtorId !== "null") {
      fetchDebtorData();
    }
  }, [debtorId]);

  const toggleGroup = (subaccountId: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [subaccountId]: !prev[subaccountId]
    }));
  };

  const handlePayPartial = async (subaccountId: number) => {
    const amountStr = paymentAmounts[subaccountId];
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      toast.error("Por favor, insira um valor válido maior que zero.");
      return;
    }

    const amount = Number(amountStr);

    try {
      const res = await authenticatedFetch("/debtors/pay-subaccount/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debtor_id: Number(debtorId),
          subaccount_id: subaccountId,
          amount: amount
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Erro ao processar pagamento");
      }

      toast.success("Pagamento parcial processado com sucesso!");
      setPaymentAmounts(prev => ({ ...prev, [subaccountId]: "" }));
      await fetchDebtorData();
      await fetchAccounts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteDebtItem = async (itemId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este item de débito?")) return;
    try {
      const res = await authenticatedFetch(`/debt-items/${itemId}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Item de débito excluído com sucesso.");
        await fetchDebtorData();
        await fetchAccounts();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Erro ao excluir o item.");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 bg-background">
        <div className="text-sm text-muted-foreground animate-pulse">Carregando perfil do devedor...</div>
      </div>
    );
  }

  const grandTotalOwed = groups.reduce((acc, g) => acc + Number(g.total_outstanding_balance), 0);

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 px-6 py-5 border-b border-sidebar-border bg-background/95 backdrop-blur z-10 sticky top-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full" onClick={() => navigate("/debts")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {debtorName || "Perfil do Devedor"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Total a restituir: <strong className="text-amber-500 font-bold">{formatMoney(grandTotalOwed, "EUR")}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {groups.length === 0 ? (
            <Card className="border-sidebar-border bg-sidebar/50 rounded-2xl">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3 animate-bounce" />
                <h3 className="text-lg font-bold text-foreground mb-1">Nenhuma pendência activa</h3>
                <p className="text-sm text-muted-foreground">Este devedor não possui dívidas pendentes.</p>
              </CardContent>
            </Card>
          ) : (
            groups.map(group => {
              const isExpanded = !!expandedGroups[group.subaccount_id];
              return (
                <Card key={group.subaccount_id} className="overflow-hidden border-sidebar-border bg-sidebar/30 shadow-soft rounded-2xl">
                  <CardHeader 
                    className="pb-4 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/5 transition-colors"
                    onClick={() => toggleGroup(group.subaccount_id)}
                  >
                    <div className="space-y-1">
                      <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        {group.subaccount_name}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Saldo Pendente: <strong className="text-foreground">{formatMoney(group.total_outstanding_balance, "EUR")}</strong>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Input
                          type="number"
                          placeholder="Valor (ex: 30)"
                          className="rounded-xl border-border/40 bg-background/50 h-8 w-28 text-xs text-foreground focus:border-primary/50"
                          value={paymentAmounts[group.subaccount_id] || ""}
                          onChange={e => setPaymentAmounts(prev => ({ ...prev, [group.subaccount_id]: e.target.value }))}
                        />
                        <Button 
                          size="sm" 
                          className="h-8 text-xs font-bold shrink-0 shadow-soft cursor-pointer rounded-xl"
                          onClick={() => handlePayPartial(group.subaccount_id)}
                        >
                          Pagar Parcial
                        </Button>
                      </div>
                      <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 px-2 py-0.5">
                        {group.items.filter(i => i.status !== 'SETTLED').length} itens pendentes
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0 space-y-4">
                    {isExpanded && (
                      <div className="border-t border-sidebar-border pt-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-sidebar-border text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
                                <th className="pb-2 font-semibold">Data do Acréscimo</th>
                                <th className="pb-2 font-semibold">Descrição do Débito / Produto</th>
                                <th className="pb-2 font-semibold text-right">Valor Individual</th>
                                <th className="pb-2 font-semibold text-right">Status / Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map(item => (
                                <tr key={item.id} className="border-b border-sidebar-border/30 hover:bg-muted/5 transition-colors group">
                                  <td className="py-2.5 font-medium text-muted-foreground">
                                    {item.date_created ? new Date(item.date_created).toLocaleDateString('pt-PT') : "-"}
                                  </td>
                                  <td className="py-2.5 font-medium text-foreground">{item.product_name}</td>
                                  <td className="py-2.5 text-right font-semibold">{formatMoney(item.total_amount, "EUR")}</td>
                                  <td className="py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Badge 
                                        className={cn(
                                          "shadow-none font-semibold text-[10px] px-2 py-0.5 rounded-full",
                                          item.status === 'SETTLED' && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
                                          item.status === 'PARTIAL' && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
                                          item.status === 'PENDING' && "bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20"
                                        )}
                                      >
                                        {item.status === 'SETTLED' ? 'Quitado' : item.status === 'PARTIAL' ? 'Parcial' : 'Pendente'}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteDebtItem(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtorProfile;
