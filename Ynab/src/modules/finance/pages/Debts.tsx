import { useEffect, useState } from "react";
import { Plus, CreditCard, ChevronDown, ChevronUp, CheckCircle2, History, Trash, Handshake, User, Trash2 } from "lucide-react";
import { formatMoney } from "@/shared/lib/currency-utils";
import { authenticatedFetch } from "@/shared/lib/api";
import { useNavigate } from "react-router-dom";
import { useDebtStore, Debt, DebtPayment } from "@/modules/finance/store/useDebtStore";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Progress } from "@/shared/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { AccountNode } from "@/types";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";

const DebtCard = ({ 
  debt, 
  onAddPayment, 
  onTargetedPayment,
  onAddDebtAmount,
  debtors
}: { 
  debt: Debt; 
  onAddPayment: (d: Debt) => void; 
  onTargetedPayment: (d: Debt, subaccountId: number, amount: number) => void;
  onAddDebtAmount: (d: Debt) => void; 
  debtors: { id: number; name: string }[];
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const { deleteDebt, deletePayment, deleteCharge, updateCharge } = useDebtStore();
  
  // Use total_amount instead of original_amount if available, fallback to original_amount
  const totalDebt = debt.total_amount || debt.original_amount;
  const progress = Math.min(100, Math.round((debt.amount_paid / totalDebt) * 100)) || 0;
  const isPaid = progress >= 100;

  const [groupedDebts, setGroupedDebts] = useState<{ subaccount_id: number; subaccount_name: string; total_outstanding_balance: number; currency: string; items?: any[] }[]>([]);
  const [editingSubaccountIdx, setEditingSubaccountIdx] = useState<number | null>(null);
  const [editingAmountIdx, setEditingAmountIdx] = useState<number | null>(null);
  const [editAmountValue, setEditAmountValue] = useState("");
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, string>>({});

  const { tree } = useAccountStore();
  const subaccounts: AccountNode[] = [];
  tree.forEach(bank => {
    if (bank.children) {
      bank.children.forEach(sub => subaccounts.push(sub));
    }
  });


  const fetchGrouped = async () => {
    let debtor = debtors.find(d => d.name.trim().toLowerCase() === debt.counterparty_name.trim().toLowerCase());
    if (!debtor) {
      debtor = debtors.find(d => 
        debt.counterparty_name.trim().toLowerCase().includes(d.name.trim().toLowerCase()) ||
        d.name.trim().toLowerCase().includes(debt.counterparty_name.trim().toLowerCase())
      );
    }
    if (debtor) {
      try {
        const res = await authenticatedFetch(`/debtors/${debtor.id}/grouped_debts/`);
        if (res.ok) {
          const data = await res.json();
          setGroupedDebts(data);
        }
      } catch (err) {
        console.error("Error fetching grouped debts", err);
      }
    }
  };

  const handlePayPartial = async (subaccountId: number) => {
    const amountStr = paymentAmounts[subaccountId];
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      toast.error("Por favor, insira um valor válido maior que zero.");
      return;
    }

    const amount = Number(amountStr);
    let debtor = debtors.find(d => d.name.trim().toLowerCase() === debt.counterparty_name.trim().toLowerCase());
    if (!debtor) {
      debtor = debtors.find(d => 
        debt.counterparty_name.trim().toLowerCase().includes(d.name.trim().toLowerCase()) ||
        d.name.trim().toLowerCase().includes(debt.counterparty_name.trim().toLowerCase())
      );
    }
    if (!debtor) {
      toast.error("Devedor não encontrado. Buscando por: " + debt.counterparty_name + ", disponíveis: " + debtors.map(d => `${d.name} (id: ${d.id})`).join(", "));
      return;
    }

    try {
      const res = await authenticatedFetch("/debtors/pay-subaccount/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debtor_id: debtor.id,
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
      await fetchGrouped();
      await useAccountStore.getState().fetchAccounts();
      await useDebtStore.getState().fetchDebts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  useEffect(() => {
    fetchGrouped();
  }, [debt, debtors]);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir a dívida de ${debt.counterparty_name}?`)) {
      await deleteDebt(debt.id);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm("Tem certeza que deseja remover este pagamento? A transação associada também será revertida.")) {
      await deletePayment(paymentId);
    }
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (window.confirm("Tem certeza que deseja remover este débito? O valor será descontado da dívida e a transação revertida.")) {
      await deleteCharge(chargeId);
    }
  };

  const handleEditChargeName = async (charge: any) => {
    const newName = window.prompt("Novo nome do débito:", charge.description);
    if (newName && newName.trim() !== charge.description) {
      await updateCharge(charge.id, { description: newName.trim() });
    }
  };

  const timeline = [
    ...(debt.payments || []).map(p => ({ ...p, type: 'payment' as const })),
    ...(debt.charges || []).map(c => ({ ...c, type: 'charge' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Grouping logic based on groupedDebts from API or fallback
  let activeGroups: { id?: number; name: string; amount: number; currency?: string; items?: any[] }[] = [];
  if (groupedDebts.length > 0) {
    activeGroups = groupedDebts
      .filter(g => Number(g.total_outstanding_balance) > 0)
      .map(g => ({
        id: g.subaccount_id,
        name: g.subaccount_name,
        amount: Number(g.total_outstanding_balance),
        currency: g.currency,
        items: g.items || []
      }));
  } else {
    const fallbackGroups: Record<string, number> = {};
    (debt.charges || []).forEach(c => {
      const name = c.account_name || "Geral";
      fallbackGroups[name] = (fallbackGroups[name] || 0) + Number(c.amount);
    });
    (debt.payments || []).forEach(p => {
      const name = p.account_name || "Geral";
      fallbackGroups[name] = (fallbackGroups[name] || 0) - Number(p.amount);
    });
    if (debt.original_amount > 0) {
      const name = debt.origin_subaccount_name || "Geral";
      fallbackGroups[name] = (fallbackGroups[name] || 0) + Number(debt.original_amount);
    }
    activeGroups = Object.entries(fallbackGroups)
      .filter(([_, amt]) => amt > 0)
      .map(([name, amt]) => {
        let gid = undefined;
        if (name === debt.origin_subaccount_name || (name === "Geral" && !debt.origin_subaccount_name)) {
          gid = debt.origin_subaccount;
        }
        return {
          id: gid,
          name: name,
          amount: amt
        };
      });
  }

  // Multi-currency header aggregation
  const currencyTotals: Record<string, number> = {};
  if (groupedDebts.length > 0) {
    activeGroups.forEach(g => {
      const cur = g.currency || debt.currency;
      currencyTotals[cur] = (currencyTotals[cur] || 0) + g.amount;
    });
  } else {
    currencyTotals[debt.currency] = debt.amount_remaining;
  }

  return (
    <Card className="overflow-hidden border-sidebar-border bg-sidebar/50 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            {debt.counterparty_name}
            {isPaid ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none font-semibold">
                Quitado
              </Badge>
            ) : progress > 0 ? (
              <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5">
                Em andamento
              </Badge>
            ) : (
              <Badge variant="outline" className="text-zinc-500 border-zinc-200 dark:border-zinc-800">
                Aberto
              </Badge>
            )}
          </CardTitle>
          <div className="text-xs text-muted-foreground mt-1 font-semibold flex flex-col gap-0.5">
            {Object.entries(currencyTotals).map(([cur, amount]) => (
              <div key={cur}>
                {debt.is_mine ? "Total a Pagar: " : "Total a Receber: "}
                <span className="text-foreground font-bold">
                  {formatMoney(amount, cur)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={handleDelete}>
          <Trash className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        {activeGroups.length > 0 ? (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Contas em Aberto por Subconta</span>
            <div className="space-y-1">
              {activeGroups.map((g, idx) => {
                const targetItem = g.items && g.items[0];
                const targetItemId = targetItem ? targetItem.id : null;

                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 px-3 rounded-xl bg-muted/30 border border-border/40 gap-2">
                    <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
                      {editingSubaccountIdx === idx ? (
                        <GlobalAccountSelector
                          value={g.id ? String(g.id) : ""}
                          onValueChange={async (newVal) => {
                            if (targetItemId) {
                              try {
                                const res = await authenticatedFetch(`/debt-items/${targetItemId}/`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ origin_subaccount_id: Number(newVal) })
                                });
                                if (res.ok) {
                                  toast.success("Subconta atualizada com sucesso!");
                                  await fetchGrouped();
                                  await useAccountStore.getState().fetchAccounts();
                                  await useDebtStore.getState().fetchDebts();
                                } else {
                                  const err = await res.json();
                                  toast.error(err.detail || "Erro ao atualizar subconta");
                                }
                              } catch (e: any) {
                                toast.error("Erro na requisição: " + e.message);
                              }
                            } else {
                              try {
                                const res = await authenticatedFetch(`/debts/${debt.id}/`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ origin_subaccount: Number(newVal) })
                                });
                                if (res.ok) {
                                  toast.success("Subconta da dívida atualizada com sucesso!");
                                  await fetchGrouped();
                                  await useAccountStore.getState().fetchAccounts();
                                  await useDebtStore.getState().fetchDebts();
                                } else {
                                  const err = await res.json();
                                  toast.error(err.detail || "Erro ao atualizar subconta");
                                }
                              } catch (e: any) {
                                toast.error("Erro na requisição: " + e.message);
                              }
                            }
                            setEditingSubaccountIdx(null);
                          }}
                          placeholder="Selecione..."
                          filterLeafOnly={true}
                          className="h-7 w-[130px] text-xs font-semibold"
                        />
                      ) : (
                        <span 
                          className="text-muted-foreground flex items-center gap-1.5 font-medium cursor-pointer hover:underline"
                          onClick={() => setEditingSubaccountIdx(idx)}
                        >
                          <span>📁</span> {g.name}
                        </span>
                      )}

                      {editingAmountIdx === idx ? (
                        <Input
                          type="number"
                          className="h-7 w-20 text-xs px-2"
                          value={editAmountValue}
                          onChange={(e) => setEditAmountValue(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              if (targetItemId) {
                                if (editAmountValue) {
                                  try {
                                    const res = await authenticatedFetch(`/debt-items/${targetItemId}/`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ total_amount: Number(editAmountValue) })
                                    });
                                    if (res.ok) {
                                      toast.success("Valor total atualizado com sucesso!");
                                      await fetchGrouped();
                                      await useAccountStore.getState().fetchAccounts();
                                      await useDebtStore.getState().fetchDebts();
                                    } else {
                                      const err = await res.json();
                                      toast.error(err.detail || "Erro ao atualizar valor");
                                    }
                                  } catch (err: any) {
                                    toast.error("Erro na requisição: " + err.message);
                                  }
                                }
                              } else {
                                toast.warning("Lançamento herdado: não é possível atualizar o valor total via API.");
                              }
                              setEditingAmountIdx(null);
                            }
                          }}
                          onBlur={() => setEditingAmountIdx(null)}
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="font-bold text-foreground cursor-pointer hover:underline"
                          onDoubleClick={() => {
                            setEditingAmountIdx(idx);
                            setEditAmountValue(String(g.amount));
                          }}
                        >
                          {formatMoney(g.amount, g.currency || debt.currency)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {g.id && !isPaid && (
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <Input
                            type="number"
                            placeholder="Valor"
                            className="h-7 w-16 text-xs px-1.5 bg-background border-border/40 rounded-lg text-foreground focus:border-primary/50"
                            value={paymentAmounts[g.id] || ""}
                            onChange={e => setPaymentAmounts(prev => ({ ...prev, [g.id as number]: e.target.value }))}
                          />
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="h-7 text-[10px] uppercase font-bold tracking-wider shrink-0 cursor-pointer text-primary border-primary/20 hover:bg-primary/10 rounded-lg px-2" 
                            onClick={() => handlePayPartial(g.id as number)}
                          >
                            Pagar Parcial
                          </Button>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                        onClick={async () => {
                          if (window.confirm("Tem certeza que deseja excluir este registro de dívida? Isso irá reverter seu peso financeiro.")) {
                            if (targetItemId) {
                              try {
                                const res = await authenticatedFetch(`/debt-items/${targetItemId}/`, {
                                  method: "DELETE"
                                });
                                if (res.ok) {
                                  toast.success("Item de dívida excluído com sucesso!");
                                  await fetchGrouped();
                                  await useAccountStore.getState().fetchAccounts();
                                  await useDebtStore.getState().fetchDebts();
                                } else {
                                  const err = await res.json();
                                  toast.error(err.detail || "Erro ao excluir item");
                                }
                              } catch (err: any) {
                                toast.error("Erro na requisição: " + err.message);
                              }
                            } else {
                              // Legacy delete fallback
                              await deleteDebt(debt.id);
                              toast.success("Dívida excluída com sucesso!");
                              await useAccountStore.getState().fetchAccounts();
                              await useDebtStore.getState().fetchDebts();
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-xs py-2 bg-muted/20 rounded-lg">
            Nenhuma subconta com saldo em aberto.
          </div>
        )}
      </CardContent>
      
      <div className="bg-muted/30 border-t border-sidebar-border px-4 py-3 flex flex-wrap gap-2 items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 px-2 text-muted-foreground shrink-0"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="mr-1.5 h-3.5 w-3.5" />
          {timeline.length} Lançamento{timeline.length !== 1 && 's'}
          {showHistory ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
        </Button>
        
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {!isPaid && (
            <>
              <Button 
                variant="outline"
                size="sm" 
                className="h-8 text-xs border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-primary cursor-pointer shrink-0" 
                onClick={() => onAddDebtAmount(debt)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Mais Débito
              </Button>
              <Button size="sm" className="h-8 text-xs shadow-soft cursor-pointer shrink-0" onClick={() => onAddPayment(debt)}>
                Ajuste Genérico
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Timeline History Expandable */}
      {showHistory && (
        <div className="bg-background/50 border-t border-sidebar-border p-4 text-sm animate-in slide-in-from-top-2 duration-200">
          {timeline.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-2">Nenhum lançamento registrado.</div>
          ) : (
            <div className="space-y-3">
              {timeline.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("font-medium", item.type === 'payment' ? "text-emerald-500" : "text-rose-500")}>
                        {item.type === 'payment' ? '-' : '+'}{formatMoney(item.amount, debt.currency)}
                      </span>
                      {item.type === 'charge' && (
                        <span className="text-xs text-foreground font-medium">({(item as any).description})</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString('pt-BR')} {item.account_name ? `• ${item.account_name}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.type === 'charge' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                        onClick={() => handleEditChargeName(item)}
                      >
                        <span className="text-[10px]">✏️</span>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-red-500"
                      onClick={() => item.type === 'payment' ? handleDeletePayment(item.id) : handleDeleteCharge(item.id)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export const Debts = () => {
  const navigate = useNavigate();
  const { debts, fetchDebts, addDebt, addPayment, addDebtAmount } = useDebtStore();
  const { tree, fetchAccounts } = useAccountStore();
  const { baseCurrency } = useCurrencyStore();
  
  const [debtors, setDebtors] = useState<{ id: number; name: string }[]>([]);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Debt Form State
  const [debtType, setDebtType] = useState<"me_devem" | "minhas_dividas">("me_devem");
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState<string>(baseCurrency);

  // Payment Form State
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAccount, setPayAccount] = useState("");

  // Targeted Payment Form State
  const [isTargetedPaymentOpen, setIsTargetedPaymentOpen] = useState(false);
  const [targetedSubaccountId, setTargetedSubaccountId] = useState<number | null>(null);
  const [targetedPayAmount, setTargetedPayAmount] = useState("");

  const refreshStores = async () => {
    fetchDebts();
    if (tree.length === 0) {
      await fetchAccounts();
    } else {
      fetchAccounts();
    }
  };

  // Add Debt Amount Form State
  const [isAddAmountOpen, setIsAddAmountOpen] = useState(false);
  const [addAmountValue, setAddAmountValue] = useState("");
  const [addAmountDescription, setAddAmountDescription] = useState("");
  const [addAmountDate, setAddAmountDate] = useState(new Date().toISOString().split('T')[0]);
  const [addAmountAccount, setAddAmountAccount] = useState("");
  const [addAmountSubaccount, setAddAmountSubaccount] = useState("");
  const [conciliationMode, setConciliationMode] = useState<"cash_loan" | "roomie_split">("cash_loan");

  useEffect(() => {
    fetchDebts();
    if (tree.length === 0) fetchAccounts();
    const fetchDebtors = async () => {
      try {
        const res = await authenticatedFetch("/debtors/");
        if (res.ok) {
          const data = await res.json();
          setDebtors(data);
        }
      } catch (err) {
        console.error("Erro ao buscar devedores", err);
      }
    };
    fetchDebtors();
  }, [fetchDebts, fetchAccounts, tree.length]);

  useEffect(() => {
    if (isAddDebtOpen) {
      setCurrency(baseCurrency);
    }
  }, [isAddDebtOpen, baseCurrency]);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterparty || !amount) {
      toast.error("Preencha o nome e o valor.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDebt({
        counterparty_name: counterparty,
        original_amount: Number(amount),
        currency: currency,
        is_mine: debtType === "minhas_dividas",
        notes
      });
      setIsAddDebtOpen(false);
      setCounterparty("");
      setAmount("");
      setNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !payAmount || !payDate || !payAccount) {
      toast.error("Preencha todos os campos do pagamento.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addPayment({
        debt: selectedDebt.id,
        amount: Number(payAmount),
        date: payDate,
        account: payAccount
      });
      setIsPaymentOpen(false);
      setPayAmount("");
      setPayAccount("");
      refreshStores();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTargetedPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !targetedPayAmount || !targetedSubaccountId) {
      toast.error("Preencha todos os campos do pagamento direcionado.");
      return;
    }

    setIsSubmitting(true);
    try {
      const debtor = debtors.find(d => d.name.toLowerCase() === selectedDebt.counterparty_name.toLowerCase());
      if (!debtor) throw new Error("Perfil do devedor não encontrado.");

      const res = await authenticatedFetch(`/debtors/${debtor.id}/pay_group/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subaccount_id: targetedSubaccountId,
          amount: Number(targetedPayAmount)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Erro ao processar pagamento");
      }

      toast.success("Pagamento direcionado registrado com sucesso!");
      setIsTargetedPaymentOpen(false);
      setTargetedPayAmount("");
      setTargetedSubaccountId(null);
      refreshStores();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDebtAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !addAmountValue || !addAmountDate || !addAmountDescription || !addAmountSubaccount) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (conciliationMode === "cash_loan") {
        await addDebtAmount(selectedDebt.id, {
          amount: Number(addAmountValue),
          description: addAmountDescription,
          date: addAmountDate,
          account: addAmountSubaccount
        });
      } else {
        const debtor = debtors.find(d => d.name.toLowerCase() === selectedDebt.counterparty_name.toLowerCase());
        if (!debtor) {
          throw new Error(`Perfil do roommate para "${selectedDebt.counterparty_name}" não encontrado. Por favor, registre o roommate no menu de roommates antes.`);
        }

        const res = await authenticatedFetch(`/debtors/${debtor.id}/add_items/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subaccount_id: Number(addAmountSubaccount),
            product_name: addAmountDescription,
            total_amount: Number(addAmountValue)
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Erro ao criar item de débito");
        }

        await addDebtAmount(selectedDebt.id, {
          amount: Number(addAmountValue),
          description: addAmountDescription,
          date: addAmountDate,
          account: null
        });

        toast.success("Split de roommate adicionado com sucesso!");
      }
      setIsAddAmountOpen(false);
      setAddAmountValue("");
      setAddAmountDescription("");
      setAddAmountSubaccount("");
      setConciliationMode("cash_loan");
      refreshStores();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayAmount(debt.amount_remaining.toString());
    setIsPaymentOpen(true);
  };

  const openTargetedPaymentModal = (debt: Debt, subaccountId: number, amountRemaining: number) => {
    setSelectedDebt(debt);
    setTargetedSubaccountId(subaccountId);
    setTargetedPayAmount(amountRemaining.toString());
    setIsTargetedPaymentOpen(true);
  };

  const openAddAmountModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setAddAmountValue("");
    setAddAmountDescription("");
    setAddAmountSubaccount("");
    setConciliationMode("cash_loan");
    setIsAddAmountOpen(true);
  };

  // Flatten accounts for the select dropdown (only subaccounts usually receive/pay)
  const subaccounts: AccountNode[] = [];
  tree.forEach(bank => {
    if (bank.children) {
      bank.children.forEach(sub => subaccounts.push(sub));
    }
  });

  const meDevem = debts.filter(d => !d.is_mine);
  const minhasDividas = debts.filter(d => d.is_mine);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-6 py-5 border-b border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Dívidas
              <HelpTooltip content="Um controle simples de contas a receber (pessoas que te devem) e contas a pagar (dívidas suas)." side="right" />
            </h1>
            <p className="text-sm text-muted-foreground">Gerencie quem te deve e o que você deve.</p>
          </div>
        </div>
        <Button onClick={() => setIsAddDebtOpen(true)} className="shadow-glow transition-all hover:scale-105">
          <Plus className="mr-2 h-4 w-4" /> Nova Dívida
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl">
          <Tabs defaultValue="me_devem" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-sidebar/50 p-1 rounded-xl shadow-inner">
              <TabsTrigger value="me_devem" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <span className="flex items-center gap-2">
                  Me Devem ({meDevem.length})
                  <HelpTooltip content="Dinheiro que você emprestou ou contas que têm a receber. Quando pagas, viram Receita." side="top" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="minhas_dividas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <span className="flex items-center gap-2">
                  Minhas Dívidas ({minhasDividas.length})
                  <HelpTooltip content="Dinheiro que você pegou emprestado. Quando pagas, viram Despesa." side="top" />
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="me_devem" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
              {debtors.length > 0 && (
                <div className="space-y-3 mb-6 p-4 bg-sidebar/20 rounded-2xl border border-sidebar-border/30">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Perfis de Roommates (Visão Agrupada FIFO)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {debtors.map((d) => (
                      <Button
                        key={d.id}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border/40 bg-sidebar/30 hover:bg-muted/10 flex items-center gap-1.5"
                        onClick={() => navigate(`/debtor/${d.id}`)}
                      >
                        <span>Ver Perfil de {d.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {meDevem.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                    <Handshake className="h-10 w-10 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Ninguém te deve</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Mantenha o controle do dinheiro que você emprestou adicionando uma nova dívida.
                  </p>
                  <Button variant="outline" onClick={() => { setDebtType("me_devem"); setIsAddDebtOpen(true); }}>
                    Registrar Dívida
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {meDevem.map(debt => (
                    <DebtCard key={debt.id} debt={debt} onAddPayment={openPaymentModal} onTargetedPayment={openTargetedPaymentModal} onAddDebtAmount={openAddAmountModal} debtors={debtors} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="minhas_dividas" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
              {minhasDividas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-amber-500/5 flex items-center justify-center mb-6">
                    <CreditCard className="h-10 w-10 text-amber-500/40" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Sem dívidas ativas</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Parabéns! Você não tem dívidas registradas no momento.
                  </p>
                  <Button variant="outline" onClick={() => { setDebtType("minhas_dividas"); setIsAddDebtOpen(true); }}>
                    Registrar Dívida
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {minhasDividas.map(debt => (
                    <DebtCard key={debt.id} debt={debt} onAddPayment={openPaymentModal} onTargetedPayment={openTargetedPaymentModal} onAddDebtAmount={openAddAmountModal} debtors={debtors} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Nova Dívida Modal */}
      <Dialog open={isAddDebtOpen} onOpenChange={setIsAddDebtOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 backdrop-blur-md overflow-hidden p-6 shadow-glow">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <form onSubmit={handleAddDebt} className="space-y-5 relative">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-extrabold text-foreground">Nova Dívida</DialogTitle>
              <p className="text-xs text-muted-foreground">Registre um novo compromisso de conta a pagar ou receber.</p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Tipo de Transação</Label>
                <Select value={debtType} onValueChange={(val: any) => setDebtType(val)}>
                  <SelectTrigger className="rounded-xl border-border/40 bg-muted/15 text-xs sm:text-sm focus:ring-primary/30 h-11">
                    <SelectValue placeholder="Selecione o tipo de dívida" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60">
                    <SelectItem value="me_devem">Me Devem (Ativo / Contas a Receber)</SelectItem>
                    <SelectItem value="minhas_dividas">Eu Devo (Passivo / Contas a Pagar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="counterparty" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                  {debtType === "me_devem" ? "Devedor (Quem te deve?)" : "Credor (A quem você deve?)"}
                </Label>
                <Input
                  id="counterparty"
                  className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11"
                  placeholder="Nome da pessoa ou empresa"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Valor</Label>
                  <CurrencyInput
                    id="amount"
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11 text-left"
                    placeholder="0.00"
                    value={amount || 0}
                    onChange={(val) => setAmount(String(val))}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="currency" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Moeda</Label>
                  <Select value={currency} onValueChange={(val: any) => setCurrency(val)}>
                    <SelectTrigger className="rounded-xl border-border/40 bg-muted/15 text-xs sm:text-sm focus:ring-primary/30 h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/60">
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Observações (Opcional)</Label>
                <Input
                  id="notes"
                  className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11"
                  placeholder="Detalhes adicionais ou prazos..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-border/20">
              <Button type="button" variant="outline" className="rounded-xl border-border/60 text-xs font-bold active:scale-95 transition-all cursor-pointer" onClick={() => setIsAddDebtOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs shadow-glow active:scale-95 transition-all cursor-pointer">
                {isSubmitting ? "Registrando..." : "Registrar Dívida"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registrar Pagamento Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 backdrop-blur-md overflow-hidden p-6 shadow-glow">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <form onSubmit={handleAddPayment} className="space-y-5 relative">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-extrabold text-foreground">Registrar Pagamento</DialogTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Amortizando a dívida de: <strong className="text-foreground">{selectedDebt?.counterparty_name}</strong>
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payAmount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Valor Amortizado</Label>
                  <CurrencyInput
                    id="payAmount"
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11 font-mono font-bold text-left"
                    value={payAmount || 0}
                    onChange={(val) => setPayAmount(String(val))}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payDate" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Data da Transação</Label>
                  <Input
                    id="payDate"
                    type="date"
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payAccount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Conta Bancária de Destino / Origem</Label>
                <GlobalAccountSelector
                  value={payAccount}
                  onValueChange={setPayAccount}
                  placeholder="Selecione a conta bancária"
                  filterLeafOnly={true}
                  className="rounded-xl border-border/40 bg-muted/15 text-xs sm:text-sm focus:ring-primary/30 h-11"
                />
              </div>

              <div className="p-3 bg-muted/10 border border-border/30 rounded-2xl">
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed font-sans">
                  💡 Isto criará automaticamente uma transação do tipo <strong className="text-foreground">{selectedDebt?.is_mine ? "Despesa" : "Receita"}</strong> na conta selecionada para fins de conciliação.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-border/20">
              <Button type="button" variant="outline" className="rounded-xl border-border/60 text-xs font-bold active:scale-95 transition-all cursor-pointer" onClick={() => setIsPaymentOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs shadow-glow active:scale-95 transition-all cursor-pointer">
                {isSubmitting ? "Amortizando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adicionar Débito Modal */}
      <Dialog open={isAddAmountOpen} onOpenChange={setIsAddAmountOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 backdrop-blur-md overflow-hidden p-6 shadow-glow">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <form onSubmit={handleAddDebtAmountSubmit} className="space-y-5 relative">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-extrabold text-foreground">Adicionar Débito</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Incrementando o saldo devedor de: <strong className="text-foreground">{selectedDebt?.counterparty_name}</strong>
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="addAmountValue" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Valor Acrescido</Label>
                  <CurrencyInput
                    id="addAmountValue"
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11 font-mono font-bold text-left"
                    value={addAmountValue || 0}
                    onChange={(val) => setAddAmountValue(String(val))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="addAmountDescription" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Descrição do Débito</Label>
                  <Input
                    id="addAmountDescription"
                    type="text"
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11"
                    value={addAmountDescription}
                    onChange={(e) => setAddAmountDescription(e.target.value)}
                    placeholder="Ex: Lanche, Ingresso..."
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="addAmountDate" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Data do Acréscimo</Label>
                  <Input
                    id="addAmountDate"
                    type="date"
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11"
                    value={addAmountDate}
                    onChange={(e) => setAddAmountDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addAmountSubaccount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Subconta de Destino/Origem</Label>
                <GlobalAccountSelector
                  value={addAmountSubaccount}
                  onValueChange={setAddAmountSubaccount}
                  placeholder="Selecione a subconta (Mercado, Poupança...)"
                  filterLeafOnly={true}
                  className="rounded-xl border-border/40 bg-muted/15 text-xs sm:text-sm focus:ring-primary/30 h-11"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Regra de Conciliação</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={conciliationMode === "cash_loan" ? "default" : "outline"}
                    className="rounded-xl h-10 text-xs font-bold"
                    onClick={() => setConciliationMode("cash_loan")}
                  >
                    Empréstimo Direto
                  </Button>
                  <Button
                    type="button"
                    variant={conciliationMode === "roomie_split" ? "default" : "outline"}
                    className="rounded-xl h-10 text-xs font-bold"
                    onClick={() => setConciliationMode("roomie_split")}
                  >
                    Despesa Compartilhada
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-muted/10 border border-border/30 rounded-2xl">
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed font-sans">
                  {conciliationMode === "cash_loan" ? (
                    <span>💡 <strong>Empréstimo Direto:</strong> Deduzirá diretamente o valor do saldo físico da subconta selecionada.</span>
                  ) : (
                    <span>💡 <strong>Despesa Compartilhada:</strong> Vincula o produto ao perfil do devedor e ao envelope de origem, sem gerar uma nova saída duplicada na sua conta bancária.</span>
                  )}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-border/20">
              <Button type="button" variant="outline" className="rounded-xl border-border/60 text-xs font-bold active:scale-95 transition-all cursor-pointer" onClick={() => setIsAddAmountOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs shadow-glow active:scale-95 transition-all cursor-pointer">
                {isSubmitting ? "Acrescentando..." : "Confirmar Acréscimo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;
