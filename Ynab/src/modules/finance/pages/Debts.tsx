import { useEffect, useState } from "react";
import { Plus, CreditCard, ChevronDown, ChevronUp, CheckCircle2, History, Trash, Handshake } from "lucide-react";
import { formatMoney } from "@/shared/lib/currency-utils";
import { useDebtStore, Debt, DebtPayment } from "@/modules/finance/store/useDebtStore";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Progress } from "@/shared/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { AccountNode } from "@/types";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";

const DebtCard = ({ 
  debt, 
  onAddPayment, 
  onAddDebtAmount 
}: { 
  debt: Debt; 
  onAddPayment: (d: Debt) => void; 
  onAddDebtAmount: (d: Debt) => void; 
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const { deleteDebt, deletePayment, deleteCharge, updateCharge } = useDebtStore();
  
  // Use total_amount instead of original_amount if available, fallback to original_amount
  const totalDebt = debt.total_amount || debt.original_amount;
  const progress = Math.min(100, Math.round((debt.amount_paid / totalDebt) * 100)) || 0;
  const isPaid = progress >= 100;

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
          {debt.notes && <CardDescription className="mt-1 line-clamp-2">{debt.notes}</CardDescription>}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={handleDelete}>
          <Trash className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Valor Total</span>
            <div className="font-semibold text-foreground">
              {formatMoney(totalDebt, debt.currency)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Restante</span>
            <div className={cn("font-bold", isPaid ? "text-emerald-500" : "text-amber-500")}>
              {formatMoney(debt.amount_remaining, debt.currency)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Progresso</span>
            <span className={isPaid ? "text-emerald-500" : "text-foreground"}>{progress}%</span>
          </div>
          <Progress value={progress} className={cn("h-2", isPaid && "[&>div]:bg-emerald-500")} />
        </div>
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
                className="h-8 text-xs border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary cursor-pointer shrink-0" 
                onClick={() => onAddDebtAmount(debt)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Mais Débito
              </Button>
              <Button size="sm" className="h-8 text-xs shadow-soft cursor-pointer shrink-0" onClick={() => onAddPayment(debt)}>
                Adicionar Saldo
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
  const { debts, fetchDebts, addDebt, addPayment, addDebtAmount } = useDebtStore();
  const { tree, fetchAccounts } = useAccountStore();
  const { baseCurrency } = useCurrencyStore();
  
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

  // Add Debt Amount Form State
  const [isAddAmountOpen, setIsAddAmountOpen] = useState(false);
  const [addAmountValue, setAddAmountValue] = useState("");
  const [addAmountDescription, setAddAmountDescription] = useState("");
  const [addAmountDate, setAddAmountDate] = useState(new Date().toISOString().split('T')[0]);
  const [addAmountAccount, setAddAmountAccount] = useState("");

  useEffect(() => {
    fetchDebts();
    if (tree.length === 0) fetchAccounts();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDebtAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !addAmountValue || !addAmountDate || !addAmountDescription) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDebtAmount(selectedDebt.id, {
        amount: Number(addAmountValue),
        description: addAmountDescription,
        date: addAmountDate,
        account: (addAmountAccount && addAmountAccount !== "none") ? addAmountAccount : null
      });
      setIsAddAmountOpen(false);
      setAddAmountValue("");
      setAddAmountDescription("");
      setAddAmountAccount("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    // Suggest the remaining amount
    setPayAmount(debt.amount_remaining.toString());
    setIsPaymentOpen(true);
  };

  const openAddAmountModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setAddAmountValue("");
    setAddAmountDescription("");
    setAddAmountAccount("");
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {meDevem.map(debt => (
                    <DebtCard key={debt.id} debt={debt} onAddPayment={openPaymentModal} onAddDebtAmount={openAddAmountModal} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {minhasDividas.map(debt => (
                    <DebtCard key={debt.id} debt={debt} onAddPayment={openPaymentModal} onAddDebtAmount={openAddAmountModal} />
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
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                  <Input
                    id="payAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedDebt?.amount_remaining}
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11 font-mono font-bold"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
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
                <Select value={payAccount} onValueChange={setPayAccount} required>
                  <SelectTrigger className="rounded-xl border-border/40 bg-muted/15 text-xs sm:text-sm focus:ring-primary/30 h-11">
                    <SelectValue placeholder="Selecione a conta bancária" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60">
                    {subaccounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input
                    id="addAmountValue"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11 font-mono font-bold"
                    value={addAmountValue}
                    onChange={(e) => setAddAmountValue(e.target.value)}
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
                <Label htmlFor="addAmountAccount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Conta de Conciliação (Opcional)</Label>
                <Select value={addAmountAccount} onValueChange={setAddAmountAccount}>
                  <SelectTrigger className="rounded-xl border-border/40 bg-muted/15 text-xs sm:text-sm focus:ring-primary/30 h-11">
                    <SelectValue placeholder="Sem conta bancária vinculada" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60">
                    <SelectItem value="none">Nenhuma (ajuste estritamente contábil / manual)</SelectItem>
                    {subaccounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted/10 border border-border/30 rounded-2xl">
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-relaxed font-sans">
                  💡 Caso selecione uma conta bancária, isto criará automaticamente uma transação do tipo <strong className="text-foreground">{selectedDebt?.is_mine ? "Receita" : "Despesa"}</strong> para balanceamento.
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
