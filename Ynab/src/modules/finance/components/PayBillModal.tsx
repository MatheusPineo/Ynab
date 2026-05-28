import { useState, useEffect, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { formatMoney } from "@/shared/lib/currency-utils";
import { authenticatedFetch } from "@/shared/lib/api";
import { CreditCard, Check, Percent, Receipt, ArrowRight, ListFilter } from "lucide-react";
import { Input } from "@/shared/components/ui/input";

interface PayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accountId: string, paymentMode: string, payloadData: any) => Promise<void>;
  billName: string;
  totalAmount: string;
  creditCardId: string;
  billId: string;
}

export function PayBillModal({
  isOpen,
  onClose,
  onConfirm,
  billName,
  totalAmount,
  creditCardId,
  billId
}: PayBillModalProps) {
  const [activeTab, setActiveTab] = useState<"ITEMIZED" | "FIFO" | "PERCENTAGE">("ITEMIZED");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [installments, setInstallments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState("BRL");

  // Tab 1: Itemized checkbox selection state
  const [selectedInstIds, setSelectedInstIds] = useState<Record<string, boolean>>({});

  // Tab 2: FIFO Amount state
  const [fifoAmount, setFifoAmount] = useState<string>("");

  // Tab 3: Percentage state (1-100)
  const [percentage, setPercentage] = useState<number>(100);

  // Fetch bill installments and card details when modal opens
  useEffect(() => {
    if (isOpen && creditCardId && billId) {
      const loadBillDetails = async () => {
        setIsLoading(true);
        try {
          const res = await authenticatedFetch(`/credit-cards/${creditCardId}/bills/`);
          if (res.ok) {
            const data = await res.json();
            const currentBill = data.find((b: any) => String(b.id) === String(billId));
            if (currentBill) {
              // Filtrar parcelas pendentes ou lançadas que aguardam pagamento
              const unpaid = (currentBill.installments || []).filter(
                (inst: any) => inst.status === "pending" || inst.status === "posted"
              );
              setInstallments(unpaid);
              
              // Inicializar seleção de todos os itens por padrão no modo ITEMIZED
              const initialSelected: Record<string, boolean> = {};
              unpaid.forEach((inst: any) => {
                initialSelected[inst.id] = true;
              });
              setSelectedInstIds(initialSelected);
            }
          }
          
          const cardRes = await authenticatedFetch(`/credit-cards/${creditCardId}/`);
          if (cardRes.ok) {
            const cardData = await cardRes.json();
            setCurrency(cardData.currency || "BRL");
          }
        } catch (error) {
          console.error("Erro ao carregar faturas/cartão:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadBillDetails();
    }
  }, [isOpen, creditCardId, billId]);

  // Tab 1 (Itemized) total calculation
  const itemizedTotal = useMemo(() => {
    return installments
      .filter((inst) => selectedInstIds[inst.id])
      .reduce((sum, inst) => sum + Number(inst.amount), 0);
  }, [installments, selectedInstIds]);

  // Tab 2 (FIFO) real-time simulation
  const fifoSimulation = useMemo(() => {
    const inputAmount = parseFloat(fifoAmount.replace(",", ".")) || 0;
    let pool = inputAmount;
    
    return installments.map((inst) => {
      const amt = Number(inst.amount);
      let paidAmt = 0;
      let progress = 0;
      let checked = false;

      if (pool >= amt) {
        paidAmt = amt;
        pool -= amt;
        progress = 100;
        checked = true;
      } else if (pool > 0) {
        paidAmt = pool;
        progress = (pool / amt) * 100;
        pool = 0;
        checked = true;
      }

      return {
        ...inst,
        paidAmt,
        progress,
        checked
      };
    });
  }, [installments, fifoAmount]);

  // Tab 3 (Percentage) total calculations
  const totalPendingAmount = useMemo(() => {
    return installments.reduce((sum, inst) => sum + Number(inst.amount), 0);
  }, [installments]);

  const percentageTotal = useMemo(() => {
    return (totalPendingAmount * percentage) / 100;
  }, [totalPendingAmount, percentage]);

  const handleCheckboxToggle = (id: string) => {
    setSelectedInstIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAllItemized = (select: boolean) => {
    const nextSelected: Record<string, boolean> = {};
    installments.forEach((inst) => {
      nextSelected[inst.id] = select;
    });
    setSelectedInstIds(nextSelected);
  };

  const handlePercentageChange = (val: number) => {
    // Limitar entre 1 e 100
    const cleanVal = Math.max(1, Math.min(100, isNaN(val) ? 1 : val));
    setPercentage(cleanVal);
  };

  const handleSubmit = async () => {
    if (!selectedAccount) return;

    let payloadData: any = {};
    if (activeTab === "ITEMIZED") {
      const selectedIds = Object.keys(selectedInstIds).filter((id) => selectedInstIds[id]);
      if (selectedIds.length === 0) return;
      payloadData = { installment_ids: selectedIds };
    } else if (activeTab === "FIFO") {
      const amt = parseFloat(fifoAmount.replace(",", ".")) || 0;
      if (amt <= 0) return;
      payloadData = { amount: amt };
    } else if (activeTab === "PERCENTAGE") {
      payloadData = { percentage: percentage / 100 };
    }

    setIsLoading(true);
    try {
      await onConfirm(selectedAccount, activeTab, payloadData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-card border-border shadow-2xl rounded-3xl overflow-hidden p-0">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-indigo-900/40 via-indigo-950/20 to-transparent p-6 pb-4 border-b border-border/60">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-indigo-400 mb-1">
              <CreditCard className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-wider uppercase">Pagamento de Cartão</span>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Pagar {billName}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Escolha uma conta de origem e selecione o método de liquidação dos lançamentos desta fatura.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Global Account Selector */}
        <div className="p-6 pb-2 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Conta de Pagamento (Débito)
          </label>
          <GlobalAccountSelector 
            value={selectedAccount} 
            onChange={setSelectedAccount} 
            placeholder="Selecione a conta de origem dos fundos..."
          />
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pb-2">
          <div className="flex bg-muted/40 p-1 rounded-2xl border border-border/40">
            <button
              onClick={() => setActiveTab("ITEMIZED")}
              className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
                activeTab === "ITEMIZED"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Escolher Compras
            </button>
            <button
              onClick={() => setActiveTab("FIFO")}
              className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
                activeTab === "FIFO"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Digitar Valor (FIFO)
            </button>
            <button
              onClick={() => setActiveTab("PERCENTAGE")}
              className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
                activeTab === "PERCENTAGE"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Porcentagem
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-4 max-h-[350px] overflow-y-auto">
          {isLoading && installments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-xs">Carregando parcelas da fatura...</p>
            </div>
          ) : installments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <Check className="h-8 w-8 text-emerald-500 mx-auto bg-emerald-500/10 p-1.5 rounded-full" />
              <p className="text-sm font-semibold">Tudo Pago!</p>
              <p className="text-xs text-muted-foreground">Esta fatura não possui lançamentos pendentes.</p>
            </div>
          ) : (
            <>
              {/* Tab 1: ITEMIZED */}
              {activeTab === "ITEMIZED" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-muted-foreground border-b border-border/40 pb-2">
                    <span>Lista de Lançamentos ({installments.length})</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAllItemized(true)}
                        className="hover:text-foreground transition-colors font-medium"
                      >
                        Selecionar Tudo
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleSelectAllItemized(false)}
                        className="hover:text-foreground transition-colors font-medium"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {installments.map((inst) => (
                      <div
                        key={inst.id}
                        onClick={() => handleCheckboxToggle(inst.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedInstIds[inst.id]
                            ? "bg-indigo-950/20 border-indigo-500/40"
                            : "bg-muted/10 border-border/40 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              selectedInstIds[inst.id]
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "border-muted-foreground/60"
                            }`}
                          >
                            {selectedInstIds[inst.id] && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {inst.transaction?.description}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Parcela {inst.installment_number}/{inst.total_installments} • {new Date(inst.transaction?.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold tabular-nums">
                          {formatMoney(inst.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: FIFO */}
              {activeTab === "FIFO" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Valor a Pagar (EUR / BRL)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                        {currency === "BRL" ? "R$" : "€"}
                      </span>
                      <Input
                        type="text"
                        placeholder="0,00"
                        value={fifoAmount}
                        onChange={(e) => setFifoAmount(e.target.value)}
                        className="pl-12 bg-muted/20 border-border/60 rounded-xl font-mono text-base font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Simulação da Fila Cronológica (FIFO)
                    </span>
                    <div className="space-y-2">
                      {fifoSimulation.map((inst) => (
                        <div
                          key={inst.id}
                          className={`p-3 rounded-xl border bg-muted/5 transition-all ${
                            inst.progress === 100
                              ? "border-emerald-500/30 bg-emerald-950/5"
                              : inst.progress > 0
                              ? "border-indigo-500/30 bg-indigo-950/5"
                              : "border-border/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all ${
                                  inst.progress === 100
                                    ? "bg-emerald-600 border-emerald-500 text-white"
                                    : inst.progress > 0
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "border-muted-foreground/40"
                                }`}
                              >
                                {inst.progress === 100 && <Check className="h-3 w-3 stroke-[3]" />}
                                {inst.progress > 0 && inst.progress < 100 && (
                                  <span className="text-[8px] font-bold">1/2</span>
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground">
                                  {inst.transaction?.description}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Parcela {inst.installment_number}/{inst.total_installments}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold tabular-nums">
                                {formatMoney(inst.amount, currency)}
                              </p>
                              {inst.progress > 0 && (
                                <p className="text-[10px] text-emerald-400 font-semibold tabular-nums">
                                  Cobre: {formatMoney(inst.paidAmt, currency)}
                                </p>
                              )}
                            </div>
                          </div>
                          {inst.progress > 0 && inst.progress < 100 && (
                            <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mt-2 border border-border/10">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${inst.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: PERCENTAGE */}
              {activeTab === "PERCENTAGE" && (
                <div className="space-y-6 py-2">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="col-span-3 space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Porcentagem de Quitação
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={percentage}
                        onChange={(e) => handlePercentageChange(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-center">
                        Valor (%)
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={percentage}
                          onChange={(e) => handlePercentageChange(Number(e.target.value))}
                          className="pr-6 font-mono font-semibold text-center rounded-xl bg-muted/20 border-border/60"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/20 rounded-2xl p-4 border border-border/40 flex flex-col gap-2.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Resumo da Distribuição Pro-Rata
                    </span>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Pendente da Fatura:</span>
                      <span className="font-semibold tabular-nums">{formatMoney(totalPendingAmount, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Porcentagem Aplicada:</span>
                      <span className="font-semibold text-indigo-400 font-mono">{percentage}%</span>
                    </div>
                    <div className="border-t border-border/60 my-1 pt-2 flex items-center justify-between">
                      <span className="text-sm font-bold">Total a Debitar:</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                        {formatMoney(percentageTotal, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Summary Action Bar */}
        <div className="bg-muted/10 p-6 border-t border-border/60 flex flex-col gap-4">
          {installments.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Total Calculado</p>
                <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                  {activeTab === "ITEMIZED" && formatMoney(itemizedTotal, currency)}
                  {activeTab === "FIFO" && formatMoney(parseFloat(fifoAmount.replace(",", ".")) || 0, currency)}
                  {activeTab === "PERCENTAGE" && formatMoney(percentageTotal, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Modo</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeTab === "ITEMIZED" && "Itemizado"}
                  {activeTab === "FIFO" && "FIFO"}
                  {activeTab === "PERCENTAGE" && "Pro-Rata"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={
                !selectedAccount || 
                isLoading || 
                installments.length === 0 ||
                (activeTab === "ITEMIZED" && itemizedTotal <= 0) ||
                (activeTab === "FIFO" && (parseFloat(fifoAmount.replace(",", ".")) || 0) <= 0)
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Confirmar Pagamento</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
