import os

file_path = 'C:/Users/mathe/PROJETO-YNAB/Ynab/src/modules/finance/pages/Debts.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '  onAddPayment: (d: Debt) => void; \n  onAddDebtAmount: (d: Debt) => void;',
    '  onAddPayment: (d: Debt) => void; \n  onTargetedPayment: (d: Debt, subaccountId: number, amount: number) => void;\n  onAddDebtAmount: (d: Debt) => void;'
)

content = content.replace(
    'const DebtCard = ({ \n  debt, \n  onAddPayment, \n  onAddDebtAmount,',
    'const DebtCard = ({ \n  debt, \n  onAddPayment, \n  onTargetedPayment,\n  onAddDebtAmount,'
)

content = content.replace(
    'const [groupedDebts, setGroupedDebts] = useState<{ subaccount_name: string; total_outstanding_balance: number }[]>([]);',
    'const [groupedDebts, setGroupedDebts] = useState<{ subaccount_id: number; subaccount_name: string; total_outstanding_balance: number; currency: string }[]>([]);'
)

content = content.replace(
    'let activeGroups: { name: string; amount: number }[] = [];',
    'let activeGroups: { id?: number; name: string; amount: number; currency?: string }[] = [];'
)

content = content.replace(
    'name: g.subaccount_name,\n        amount: Number(g.total_outstanding_balance)\n      }));',
    'id: g.subaccount_id,\n        name: g.subaccount_name,\n        amount: Number(g.total_outstanding_balance),\n        currency: g.currency\n      }));'
)

header_orig = """<div className="text-xs text-muted-foreground mt-1 font-semibold">
            {debt.is_mine ? "Total a Pagar: " : "Total a Receber: "}
            <span className="text-foreground font-bold">
              {formatMoney(debt.amount_remaining, debt.currency)}
            </span>
          </div>"""

header_new = """<div className="text-xs text-muted-foreground mt-1 font-semibold flex flex-col gap-0.5">
            {Object.entries(currencyTotals).map(([cur, amount]) => (
              <div key={cur}>
                {debt.is_mine ? "Total a Pagar: " : "Total a Receber: "}
                <span className="text-foreground font-bold">
                  {formatMoney(amount, cur)}
                </span>
              </div>
            ))}
          </div>"""

content = content.replace(header_orig, header_new)

return_orig = """  return (
    <Card"""

return_new = """  // Multi-currency header aggregation
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
    <Card"""

content = content.replace(return_orig, return_new)

row_orig = """<div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-muted/30 border border-border/10">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span>📁</span> {g.name}
                  </span>
                  <span className="font-bold text-foreground">{formatMoney(g.amount, debt.currency)}</span>
                </div>"""

row_new = """<div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 px-3 rounded-xl bg-muted/30 border border-border/40 gap-2">
                  <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <span>📁</span> {g.name}
                    </span>
                    <span className="font-bold text-foreground">{formatMoney(g.amount, g.currency || debt.currency)}</span>
                  </div>
                  {g.id && !isPaid && (
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="h-7 text-[10px] uppercase font-bold tracking-wider shrink-0 cursor-pointer text-primary border-primary/20 hover:bg-primary/10" 
                      onClick={() => onTargetedPayment(debt, g.id as number, g.amount)}
                    >
                      Registrar Pagamento
                    </Button>
                  )}
                </div>"""

content = content.replace(row_orig, row_new)

btn_orig = """<Button size="sm" className="h-8 text-xs shadow-soft cursor-pointer shrink-0" onClick={() => onAddPayment(debt)}>
                Registrar Pagamento
              </Button>"""
btn_new = """<Button size="sm" className="h-8 text-xs shadow-soft cursor-pointer shrink-0" onClick={() => onAddPayment(debt)}>
                Ajuste Genérico
              </Button>"""
content = content.replace(btn_orig, btn_new)

state_orig = """// Payment Form State
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAccount, setPayAccount] = useState("");"""

state_new = """// Payment Form State
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
  };"""
content = content.replace(state_orig, state_new)

submit_orig = """      setIsPaymentOpen(false);
      setPayAmount("");
      setPayAccount("");
    } finally {
      setIsSubmitting(false);
    }
  };"""

submit_new = """      setIsPaymentOpen(false);
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
  };"""
content = content.replace(submit_orig, submit_new)

content = content.replace('setConciliationMode("cash_loan");\n    } catch (err: any) {', 'setConciliationMode("cash_loan");\n      refreshStores();\n    } catch (err: any) {')

open_orig = """  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayAmount(debt.amount_remaining.toString());
    setIsPaymentOpen(true);
  };"""

open_new = """  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayAmount(debt.amount_remaining.toString());
    setIsPaymentOpen(true);
  };

  const openTargetedPaymentModal = (debt: Debt, subaccountId: number, amountRemaining: number) => {
    setSelectedDebt(debt);
    setTargetedSubaccountId(subaccountId);
    setTargetedPayAmount(amountRemaining.toString());
    setIsTargetedPaymentOpen(true);
  };"""
content = content.replace(open_orig, open_new)

content = content.replace('<DebtCard key={debt.id} debt={debt} onAddPayment={openPaymentModal} onAddDebtAmount={openAddAmountModal} debtors={debtors} />', '<DebtCard key={debt.id} debt={debt} onAddPayment={openPaymentModal} onTargetedPayment={openTargetedPaymentModal} onAddDebtAmount={openAddAmountModal} debtors={debtors} />')

modal_orig = """      {/* Add Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 backdrop-blur-md overflow-hidden p-6 shadow-glow">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <form onSubmit={handleAddPayment} className="space-y-5 relative">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-extrabold text-foreground">Registrar Pagamento</DialogTitle>"""

modal_new = """      {/* Targeted Payment Modal */}
      <Dialog open={isTargetedPaymentOpen} onOpenChange={setIsTargetedPaymentOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 backdrop-blur-md overflow-hidden p-6 shadow-glow">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <form onSubmit={handleTargetedPaymentSubmit} className="space-y-5 relative">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-extrabold text-foreground">Registrar Pagamento Direcionado</DialogTitle>
              <p className="text-xs text-muted-foreground">O valor será injetado diretamente na subconta associada e abaterá as despesas em formato cronológico (FIFO).</p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="targeted-amount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Valor Pago / Recebido</Label>
                <CurrencyInput
                  id="targeted-amount"
                  className="rounded-xl border-border/40 bg-muted/15 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-muted/25 transition-all h-11 text-left"
                  placeholder="0.00"
                  value={targetedPayAmount || 0}
                  onChange={(val) => setTargetedPayAmount(String(val))}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-border/20">
              <Button type="button" variant="outline" className="rounded-xl border-border/60 text-xs font-bold active:scale-95 transition-all cursor-pointer" onClick={() => setIsTargetedPaymentOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs shadow-glow active:scale-95 transition-all cursor-pointer">
                {isSubmitting ? "Processando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-primary/5 backdrop-blur-md overflow-hidden p-6 shadow-glow">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <form onSubmit={handleAddPayment} className="space-y-5 relative">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-extrabold text-foreground">Ajuste Genérico</DialogTitle>"""

content = content.replace(modal_orig, modal_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
