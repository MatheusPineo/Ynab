import { useState, useMemo, useEffect } from "react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useTransactions } from "@/shared/hooks/useTransactions";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Input } from "@/shared/components/ui/input";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { formatMoney } from "@/shared/lib/currency-utils";
import { HandCoins, ArrowDownToLine, Info } from "lucide-react";
import { toast } from "sonner";
import { AccountNode } from "@/types";

const LoansDashboard = () => {
  const { tree, fetchAccounts } = useAccountStore();
  const { transferTransaction } = useTransactions();
  
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const [selectedLoan, setSelectedLoan] = useState<AccountNode | null>(null);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [destinationAccountId, setDestinationAccountId] = useState<string>("");
  const [receiveDate, setReceiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flatten the account tree and filter only LOAN_GIVEN accounts
  const loanAccounts = useMemo(() => {
    const list: AccountNode[] = [];
    const walk = (nodes: AccountNode[]) => {
      nodes.forEach(n => {
        if (n.account_type === 'LOAN_GIVEN') list.push(n);
        if (n.children) walk(n.children);
      });
    };
    walk(tree);
    return list;
  }, [tree]);

  const handleOpenReceiveModal = (loan: AccountNode) => {
    setSelectedLoan(loan);
    setReceiveAmount(0);
    setDestinationAccountId("");
    setReceiveDate(new Date().toISOString().split('T')[0]);
  };

  const handleReceivePayment = async () => {
    if (!selectedLoan || !destinationAccountId || receiveAmount <= 0) {
      toast.error("Preencha o valor e selecione a conta de destino.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Zero-friction UX: Under the hood, we execute a transfer from the Tracking Account (Loan) to the On-Budget Account (e.g., Nubank).
      await transferTransaction.mutateAsync({
        from_account: String(selectedLoan.id),
        to_account: destinationAccountId,
        amount: receiveAmount,
        to_amount: receiveAmount, // Assuming same currency for simplicity in this flow
        description: `Recebimento de Empréstimo: ${selectedLoan.name}`,
        date: receiveDate
      });
      
      setSelectedLoan(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar o recebimento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex flex-col gap-1 mt-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <HandCoins className="h-6 w-6 text-rose-500" />
          Empréstimos Concedidos
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Acompanhe o dinheiro que você emprestou para terceiros. Registre os pagamentos recebidos para que o dinheiro retorne automaticamente ao seu orçamento principal.
        </p>
      </div>

      {loanAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border/60 rounded-2xl bg-muted/10 text-center">
          <Info className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold text-foreground">Nenhum empréstimo ativo</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            Para cadastrar uma dívida de terceiros, vá até a aba de Contas e crie uma nova conta do tipo "Empréstimo Concedido (A Receber)".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loanAccounts.map((loan) => (
            <Card key={loan.id} className="glass border-border/50 shadow-soft overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{loan.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                    Saldo Pendente
                  </span>
                  <span className="text-2xl font-black text-rose-500 tabular-nums">
                    {/* We display the absolute balance. If it's a loan, the balance in DB is positive, representing how much they owe us. */}
                    {formatMoney(Math.abs(Number(loan.balance)), loan.currency || "BRL")}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-4 bg-muted/10 border-t border-border/30">
                <Button 
                  onClick={() => handleOpenReceiveModal(loan)}
                  disabled={Number(loan.balance) <= 0}
                  className="w-full bg-background hover:bg-muted text-foreground border border-border/50 shadow-sm transition-all group-hover:border-primary/30"
                >
                  <ArrowDownToLine className="h-4 w-4 mr-2 text-emerald-500" />
                  Registrar Recebimento
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Receive Payment Modal */}
      <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <DialogContent className="sm:max-w-[400px] glass border-border/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
              Receber Pagamento
            </DialogTitle>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="grid gap-5 py-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-xs text-rose-500/90 font-medium">
                  Você está recebendo um pagamento referente ao empréstimo <strong className="text-rose-500">{selectedLoan.name}</strong>.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="receiveAmount">Valor Recebido</Label>
                <CurrencyInput 
                  id="receiveAmount" 
                  value={receiveAmount}
                  onChange={setReceiveAmount}
                  className="bg-background/50 text-left text-lg" 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="receiveDate">Data do Recebimento</Label>
                <Input 
                  id="receiveDate" 
                  type="date" 
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  className="bg-background/50" 
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="destAccount">Para onde o dinheiro foi?</Label>
                <GlobalAccountSelector
                  value={destinationAccountId}
                  onValueChange={setDestinationAccountId}
                  placeholder="Ex: Nubank, Carteira..."
                  excludeAccountId={String(selectedLoan.id)}
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                  Ao selecionar uma conta (ex: Nubank), o sistema injetará este dinheiro de volta no seu "Pronto para Alocar".
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedLoan(null)}>Cancelar</Button>
            <Button 
              onClick={handleReceivePayment} 
              disabled={isSubmitting || receiveAmount <= 0 || !destinationAccountId}
              className="gradient-primary"
            >
              {isSubmitting ? "Processando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoansDashboard;
