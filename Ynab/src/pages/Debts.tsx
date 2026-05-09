import { useEffect, useState } from "react";
import { Plus, CreditCard, ChevronDown, ChevronUp, CheckCircle2, History, Trash, Handshake } from "lucide-react";
import { formatCurrency } from "@/lib/currency-utils";
import { useDebtStore, Debt, DebtPayment } from "@/store/useDebtStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AccountNode } from "@/types";

// Helper component for Debt Card
const DebtCard = ({ debt, onAddPayment }: { debt: Debt; onAddPayment: (d: Debt) => void }) => {
  const [showHistory, setShowHistory] = useState(false);
  const { deleteDebt, deletePayment } = useDebtStore();
  
  const progress = Math.min(100, Math.round((debt.amount_paid / debt.original_amount) * 100)) || 0;
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
            <span className="text-xs font-medium text-muted-foreground">Valor Original</span>
            <div className="font-semibold text-foreground">
              {formatCurrency(debt.original_amount, debt.currency)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Restante</span>
            <div className={cn("font-bold", isPaid ? "text-emerald-500" : "text-amber-500")}>
              {formatCurrency(debt.amount_remaining, debt.currency)}
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
      
      <div className="bg-muted/30 border-t border-sidebar-border px-6 py-3 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 px-2 text-muted-foreground"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="mr-2 h-3.5 w-3.5" />
          {debt.payments.length} Pagamento{debt.payments.length !== 1 && 's'}
          {showHistory ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
        </Button>
        
        {!isPaid && (
          <Button size="sm" className="h-8 shadow-soft" onClick={() => onAddPayment(debt)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Adicionar Saldo
          </Button>
        )}
      </div>

      {/* Payment History Expandable */}
      {showHistory && (
        <div className="bg-background/50 border-t border-sidebar-border p-4 text-sm animate-in slide-in-from-top-2 duration-200">
          {debt.payments.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-2">Nenhum pagamento registrado.</div>
          ) : (
            <div className="space-y-3">
              {debt.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{formatCurrency(p.amount, debt.currency)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.date).toLocaleDateString('pt-BR')} • {p.account_name || 'Sem conta'}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                    onClick={() => handleDeletePayment(p.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
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
  const { debts, fetchDebts, addDebt, addPayment } = useDebtStore();
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

  // Payment Form State
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAccount, setPayAccount] = useState("");

  useEffect(() => {
    fetchDebts();
    if (tree.length === 0) fetchAccounts();
  }, [fetchDebts, fetchAccounts, tree.length]);

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
        currency: baseCurrency,
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

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    // Suggest the remaining amount
    setPayAmount(debt.amount_remaining.toString());
    setIsPaymentOpen(true);
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dívidas</h1>
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
                Me Devem ({meDevem.length})
              </TabsTrigger>
              <TabsTrigger value="minhas_dividas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Minhas Dívidas ({minhasDividas.length})
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
                    <DebtCard key={debt.id} debt={debt} onAddPayment={openPaymentModal} />
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
                    <DebtCard key={debt.id} debt={debt} onAddPayment={openPaymentModal} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Nova Dívida Modal */}
      <Dialog open={isAddDebtOpen} onOpenChange={setIsAddDebtOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddDebt}>
            <DialogHeader>
              <DialogTitle>Nova Dívida</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo</Label>
                <div className="col-span-3">
                  <Select value={debtType} onValueChange={(val: any) => setDebtType(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="me_devem">Me Devem</SelectItem>
                      <SelectItem value="minhas_dividas">Eu Devo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="counterparty" className="text-right">
                  {debtType === "me_devem" ? "Devedor" : "Credor"}
                </Label>
                <Input
                  id="counterparty"
                  className="col-span-3"
                  placeholder="Nome da pessoa ou empresa"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="col-span-3"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right mt-2">Obs.</Label>
                <Input
                  id="notes"
                  className="col-span-3"
                  placeholder="Detalhes opcionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDebtOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registrar Pagamento Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddPayment}>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogFooter className="text-sm text-muted-foreground mt-1 text-left sm:justify-start">
                Dívida de: <strong className="ml-1 text-foreground">{selectedDebt?.counterparty_name}</strong>
              </DialogFooter>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payAmount" className="text-right">Valor</Label>
                <Input
                  id="payAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedDebt?.amount_remaining}
                  className="col-span-3"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payDate" className="text-right">Data</Label>
                <Input
                  id="payDate"
                  type="date"
                  className="col-span-3"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payAccount" className="text-right">Conta</Label>
                <div className="col-span-3">
                  <Select value={payAccount} onValueChange={setPayAccount} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {subaccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 col-span-4 text-center">
                Isto criará automaticamente uma {selectedDebt?.is_mine ? "despesa" : "receita"} na conta selecionada.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>Confirmar Pagamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Debts;
