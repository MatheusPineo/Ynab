import { useEffect, useState, useMemo } from "react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useCurrencyStore } from "@/modules/finance/store/useCurrencyStore";
import { authenticatedFetch } from "@/shared/lib/api";
import { formatMoney } from "@/shared/lib/currency-utils";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { CreditCard as CreditCardIcon, Plus, Calendar, Clock, CheckCircle2, Sparkles, Zap, Tag, DollarSign, Wallet, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { CreditCardBrandIcon } from "@/modules/finance/components/CreditCardBrandIcon";
import { BillDetailsView } from "@/modules/finance/components/BillDetailsView";

interface CreditCardModel {
  id: string;
  name: string;
  closing_day: number;
  due_day: number;
  credit_limit: number;
  available_limit: number;
  currency: string;
  account_id: string;
  brand?: string | null;
  country_of_issue?: "BR" | "PT";
  settlement_mode?: "FULL_REIMBURSEMENT" | "REVOLVING_CREDIT" | "FRACTIONED";
  revolving_percentage?: number | string | null;
}

interface InstallmentModel {
  id: string;
  amount: number;
  installment_number: number;
  total_installments: number;
  status: "pending" | "posted" | "paid" | "anticipated";
  transaction: {
    description: string;
    date: string;
    original_currency: string;
    exchange_rate: number;
    iof_amount: number;
    category_id?: string;
  };
}

interface CreditCardBillModel {
  id: string;
  month: number;
  year: number;
  total_amount: number;
  is_closed: boolean;
  installments?: InstallmentModel[];
}

export const CreditCards = () => {
  const { fetchAccounts, categoryGroups, fetchCategoryGroups, getCategoryName } = useAccountStore();
  const { baseCurrency } = useCurrencyStore();

  const [cards, setCards] = useState<CreditCardModel[]>([]);
  const [bills, setBills] = useState<CreditCardBillModel[]>([]);
  const [selectedCard, setSelectedCard] = useState<CreditCardModel | null>(null);
  const [selectedBill, setSelectedBill] = useState<CreditCardBillModel | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Novo Cartão de Crédito
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [closingDay, setClosingDay] = useState("20");
  const [dueDay, setDueDay] = useState("28");
  const [cardCurrency, setCardCurrency] = useState("BRL");
  const [cardBrand, setCardBrand] = useState("Mastercard");
  const [cardCountry, setCardCountry] = useState<"BR" | "PT">("BR");
  const [settlementMode, setSettlementMode] = useState<"FULL_REIMBURSEMENT" | "REVOLVING_CREDIT" | "FRACTIONED">("FULL_REIMBURSEMENT");
  const [revolvingPercentage, setRevolvingPercentage] = useState("");

  // Modal de Nova Transação (Compra Matriz)
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCardModel | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [inputType, setInputType] = useState<"TOTAL" | "PARCELA">("TOTAL");
  const [totalInstallments, setTotalInstallments] = useState("1");
  const [startingInstallment, setStartingInstallment] = useState("1");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1.00");
  const [iofAmount, setIofAmount] = useState("0.00");
  const [categoryError, setCategoryError] = useState(false);

  // Modais de Edição/Exclusão Granular
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState<string | null>(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState<InstallmentModel | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [manageScope, setManageScope] = useState<'single' | 'future' | 'all'>('single');

  const monthsNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const fetchCreditCards = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/credit-cards/");
      if (response.ok) {
        const data = await response.json();
        const cardsList = Array.isArray(data) ? data : [];
        setCards(cardsList);
        if (cardsList.length > 0 && !selectedCard) {
          setSelectedCard(cardsList[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar cartões:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBillsForCard = async (cardId: string, keepSelected = false) => {
    try {
      const response = await authenticatedFetch(`/credit-cards/${cardId}/bills/`);
      if (response.ok) {
        const data = await response.json();
        const sortedBills = (Array.isArray(data) ? data : []).sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
        setBills(sortedBills);
        
        if (!keepSelected) {
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          
          const b = sortedBills.find(bill => bill.month === currentMonth && bill.year === currentYear);
          setSelectedBill(b || null);
          setSelectedMonth(currentMonth - 1);
          setSelectedYear(currentYear);
        } else {
          setSelectedBill((prevBill: any) => {
             if (prevBill) {
                return sortedBills.find(bill => bill.month === prevBill.month && bill.year === prevBill.year) || null;
             }
             return prevBill;
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar faturas:", error);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchCategoryGroups();
    fetchCreditCards();
  }, []);

  useEffect(() => {
    if (selectedCard) {
      fetchBillsForCard(selectedCard.id);
      if (selectedCard.country_of_issue === "PT") {
        setTotalInstallments("1");
        setStartingInstallment("1");
        setInputType("TOTAL");
      }
    }
  }, [selectedCard]);

  // Criar Novo Cartão de Crédito
  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !creditLimit) {
      toast.error("Preencha o nome do cartão e o limite.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: cardName,
        credit_limit: Number(creditLimit),
        closing_day: Number(closingDay),
        due_day: Number(dueDay),
        currency: cardCurrency,
        brand: cardBrand,
        country_of_issue: cardCountry,
        settlement_mode: cardCountry === "PT" ? settlementMode : "FULL_REIMBURSEMENT",
        revolving_percentage: (cardCountry === "PT" && settlementMode === "REVOLVING_CREDIT" && revolvingPercentage) ? Number(revolvingPercentage) : null
      };

      const response = await authenticatedFetch("/credit-cards/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || JSON.stringify(result));

      toast.success("✨ Cartão de Crédito e Conta YNAB cadastrados com sucesso!");
      setIsNewCardOpen(false);
      setCardName("");
      setCreditLimit("");
      setCardCountry("BR");
      setSettlementMode("FULL_REIMBURSEMENT");
      setRevolvingPercentage("");
      await fetchCreditCards();
      await fetchAccounts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardToEdit) return;
    if (!cardName || !creditLimit) {
      toast.error("Preencha o nome do cartão e o limite.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: cardName,
        credit_limit: Number(creditLimit),
        closing_day: Number(closingDay),
        due_day: Number(dueDay),
        currency: cardCurrency,
        brand: cardBrand,
        country_of_issue: cardCountry,
        settlement_mode: cardCountry === "PT" ? settlementMode : "FULL_REIMBURSEMENT",
        revolving_percentage: (cardCountry === "PT" && settlementMode === "REVOLVING_CREDIT" && revolvingPercentage) ? Number(revolvingPercentage) : null
      };

      const response = await authenticatedFetch(`/credit-cards/${cardToEdit.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || JSON.stringify(result));

      toast.success("✨ Cartão atualizado com sucesso!");
      setIsEditCardOpen(false);
      setCardToEdit(null);
      await fetchCreditCards();
      await fetchAccounts();
      if (selectedCard?.id === cardToEdit.id) {
        setSelectedCard({ ...selectedCard, ...payload } as any);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submissão de Compra Matriz
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    
    setCategoryError(false);
    
    if (!categoryId) {
      setCategoryError(true);
      toast.error("Por favor, selecione uma Subconta de despesa.");
      return;
    }
    
    if (!description || !amount) {
      toast.error("Preencha descrição e valor.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        description,
        total_amount: Number(amount),
        total_installments: Number(totalInstallments),
        starting_installment: Number(startingInstallment),
        date: txDate,
        expense_account_id: categoryId,
        currency: selectedCard.currency,
        exchange_rate: Number(exchangeRate),
        iof_amount: Number(iofAmount),
        input_type: inputType
      };

      const response = await authenticatedFetch(`/credit-cards/${selectedCard.id}/create_transaction/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao processar compra");

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">Compra lançada com sucesso!</span>
          <span className="text-xs opacity-90">YNAB: Valor deduzido da categoria e alocado para pagamento do cartão!</span>
        </div>
      );

      await fetchCreditCards();
      // Atualiza o selectedCard com os novos dados buscados em fetchCreditCards
      const updatedCardResponse = await authenticatedFetch(`/credit-cards/${selectedCard.id}/`);
      if (updatedCardResponse.ok) {
        const updatedCardData = await updatedCardResponse.json();
        setSelectedCard(updatedCardData);
      }
      
      await fetchBillsForCard(selectedCard.id);
      await fetchAccounts();
      await fetchCategoryGroups();
      setIsNewTxOpen(false);
      setDescription("");
      setAmount("");
      setTotalInstallments("1");
      setStartingInstallment("1");
      setIofAmount("0.00");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Antecipar Parcela
  const handleAnticipateInstallment = async (installmentId: string) => {
    if (!selectedCard) return;
    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(`/credit-cards/${selectedCard.id}/anticipate_installment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installment_id: installmentId })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao antecipar parcela");

      toast.success("⚡ Parcela antecipada com sucesso para a fatura atual!");
      await fetchCreditCards();
      await fetchBillsForCard(selectedCard.id);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir Lançamento (Compra Matriz ou Parcela)
  const handleDeleteInstallmentClick = (installmentId: string) => {
    setInstallmentToDelete(installmentId);
    setManageScope('single');
    setDeleteModalOpen(true);
  };

  const confirmDeleteInstallment = async () => {
    if (!selectedCard || !installmentToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(`/credit-cards/${selectedCard.id}/manage_installment/${installmentToDelete}/?mode=${manageScope}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao excluir lançamento");
      }

      toast.success("Lançamento(s) excluído(s) com sucesso!");
      await fetchCreditCards();
      await fetchBillsForCard(selectedCard.id);
      await fetchAccounts();
      setDeleteModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInstallmentClick = (inst: InstallmentModel) => {
    setInstallmentToEdit(inst);
    setEditAmount(inst.amount);
    setEditDescription(inst.transaction.description);
    setManageScope('single');
    setEditModalOpen(true);
  };

  const confirmEditInstallment = async () => {
    if (!selectedCard || !installmentToEdit) return;
    if (!editAmount || !editDescription) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(`/credit-cards/${selectedCard.id}/manage_installment/${installmentToEdit.id}/?mode=${manageScope}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: editAmount, description: editDescription })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao editar lançamento");
      }

      toast.success("Lançamento(s) editado(s) com sucesso!");
      await fetchCreditCards();
      await fetchBillsForCard(selectedCard.id);
      await fetchAccounts();
      setEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-card/80 via-card/40 to-primary/5 border border-border/60 shadow-soft backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow shrink-0">
            <CreditCardIcon className="h-7 w-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Cartões de Crédito
              <HelpTooltip content="Central avançada para criar e gerenciar cartões, faturas e parcelamentos com conciliação YNAB nativa." side="right" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Cadastre cartões, acompanhe faturas e garanta liquidez automática para o vencimento.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => setIsNewCardOpen(true)}
            variant="outline"
            className="rounded-2xl border-primary/50 text-primary hover:bg-primary/10 hover:text-primary h-12 font-bold px-5 gap-2 shadow-soft"
          >
            <Plus className="h-5 w-5" /> Cadastrar Cartão
          </Button>

          <Button 
            onClick={() => {
              if (!selectedCard) {
                toast.error("Selecione ou cadastre um cartão de crédito primeiro.");
                return;
              }
              if (selectedCard.country_of_issue === "PT") {
                setTotalInstallments("1");
                setStartingInstallment("1");
                setInputType("TOTAL");
              }
              setIsNewTxOpen(true);
            }}
            className="gradient-primary px-6 h-12 rounded-2xl font-bold shadow-glow hover:scale-105 transition-all text-sm gap-2"
          >
            <Plus className="h-5 w-5" /> Lançar Compra
          </Button>
        </div>
      </div>

      {/* Lista de Cartões */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 px-1">
          <Wallet className="h-5 w-5 text-primary" /> Meus Cartões
        </h2>

        {isLoading && cards.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-3xl bg-muted/20 animate-pulse border border-border/40" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <Card className="rounded-3xl border-border/60 p-12 text-center bg-card/40 backdrop-blur-sm shadow-soft">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCardIcon className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">Nenhum Cartão Cadastrado</CardTitle>
                <CardDescription>
                  Você ainda não possui cartões de crédito configurados.
                </CardDescription>
              </div>
              <Button onClick={() => setIsNewCardOpen(true)} className="gradient-primary rounded-xl font-bold shadow-glow px-6 h-11 mt-2">
                Cadastrar Meu Primeiro Cartão
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const isSelected = selectedCard?.id === card.id;
              const usedPercentage = Math.min(100, Math.round(((card.credit_limit - card.available_limit) / card.credit_limit) * 100)) || 0;

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={cn(
                    "relative overflow-hidden rounded-3xl p-6 transition-all duration-300 cursor-pointer border flex flex-col justify-between min-h-[220px] group select-none shadow-soft",
                    isSelected 
                      ? "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 text-white border-primary/60 shadow-glow" 
                      : "bg-card/40 hover:bg-card/80 border-border/60 text-foreground backdrop-blur-sm"
                  )}
                >
                  <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-widest opacity-70">
                        {card.brand ? `Cartão ${card.brand}` : "Cartão de Crédito"}
                      </span>
                      <h3 className="text-xl font-extrabold truncate">{card.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-1 z-10">
                      <CreditCardBrandIcon brand={card.brand} className="mr-2" />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", isSelected ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:bg-muted/50")}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-card border-border/60">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setCardToEdit(card);
                            setCardName(card.name);
                            setCreditLimit(String(card.credit_limit));
                            setClosingDay(String(card.closing_day));
                            setDueDay(String(card.due_day));
                            setCardCurrency(card.currency);
                            setCardBrand(card.brand || "");
                            setCardCountry(card.country_of_issue || "BR");
                            setSettlementMode(card.settlement_mode || "FULL_REIMBURSEMENT");
                            setRevolvingPercentage(card.revolving_percentage ? String(card.revolving_percentage) : "");
                            setIsEditCardOpen(true);
                          }}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm("Deseja realmente excluir este cartão?")) {
                              try {
                                const response = await authenticatedFetch(`/credit-cards/${card.id}/`, { method: "DELETE" });
                                if (!response.ok) throw new Error("Erro ao excluir cartão");
                                toast.success("Cartão excluído com sucesso");
                                if (selectedCard?.id === card.id) setSelectedCard(null);
                                fetchCreditCards();
                                fetchAccounts();
                              } catch (err: any) {
                                toast.error(err.message);
                              }
                            }
                          }} className="text-red-500 focus:text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="opacity-70">Limite Disponível</span>
                      <span className="font-bold">{formatMoney(card.available_limit, card.currency)}</span>
                    </div>

                    <Progress 
                      value={usedPercentage} 
                      className={cn("h-2 bg-black/20", isSelected ? "[&>div]:bg-primary" : "[&>div]:bg-primary")} 
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 dark:border-border/40 text-[11px] opacity-80">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-amber-400" /> Fechamento: Dia {card.closing_day}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-400" /> Vencimento: Dia {card.due_day}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Faturas do Cartão Selecionado */}
      {selectedCard && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                Faturas do Cartão: <span className="text-primary">{selectedCard.name}</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Selecione o mês para visualizar as compras rotativas e parceladas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Select 
                value={String(selectedMonth)} 
                onValueChange={(v) => {
                  const m = Number(v);
                  setSelectedMonth(m);
                  const b = bills.find(bill => bill.month === m + 1 && bill.year === selectedYear);
                  setSelectedBill(b || null);
                }}
              >
                <SelectTrigger className="w-[110px] sm:w-[130px] bg-card/40 border-border/60 rounded-xl h-10 text-xs sm:text-sm shadow-soft focus:ring-0">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent className="border-border/60">
                  {monthsNames.map((m, i) => (
                    <SelectItem key={m} value={String(i)} className="text-xs sm:text-sm">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={String(selectedYear)}
                onValueChange={(v) => {
                  const y = Number(v);
                  setSelectedYear(y);
                  const b = bills.find(bill => bill.month === selectedMonth + 1 && bill.year === y);
                  setSelectedBill(b || null);
                }}
              >
                <SelectTrigger className="w-[80px] sm:w-[95px] bg-card/40 border-border/60 rounded-xl h-10 text-xs sm:text-sm shadow-soft focus:ring-0">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="border-border/60">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const y = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={y} value={String(y)} className="text-xs sm:text-sm">{y}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Painel da Fatura Selecionada */}
          <div className="mt-4">
            <BillDetailsView 
              card={selectedCard}
              bill={selectedBill}
              onEditInstallment={handleEditInstallmentClick}
              onDeleteInstallment={handleDeleteInstallmentClick}
              onAnticipateInstallment={handleAnticipateInstallment}
              isSubmitting={isSubmitting}
              onRefresh={() => {
                fetchBillsForCard(selectedCard.id, true);
                fetchAccounts();
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Cadastrar Novo Cartão de Crédito */}
      <Dialog open={isNewCardOpen} onOpenChange={setIsNewCardOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl border-border/60 bg-gradient-to-br from-card/95 via-card/80 to-primary/5 backdrop-blur-xl overflow-hidden p-6 shadow-glow">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <form onSubmit={handleCreateCard} className="space-y-5 relative">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-2">
                <CreditCardIcon className="h-6 w-6 text-primary" /> Novo Cartão
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Cadastre os dados do cartão. Uma conta YNAB será criada automaticamente.
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cardName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Nome do Cartão</Label>
                <Input
                  id="cardName"
                  placeholder="Ex: Nubank Ultravioleta, Itaú Black..."
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="creditLimit" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Limite Total do Cartão</Label>
                <CurrencyInput
                  id="creditLimit"
                  placeholder="Ex: 15000.00"
                  value={creditLimit || 0}
                  onChange={(val) => setCreditLimit(String(val))}
                  className="rounded-xl bg-muted/15 border-border/40 h-11 font-mono font-bold text-sm text-left"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="closingDay" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Dia de Fechamento</Label>
                  <Input
                    id="closingDay"
                    type="number"
                    min="1"
                    max="31"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="rounded-xl bg-muted/15 border-border/40 h-11 font-mono text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dueDay" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Dia de Vencimento</Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="rounded-xl bg-muted/15 border-border/40 h-11 font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cardCurrency" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Moeda</Label>
                <Select value={cardCurrency} onValueChange={setCardCurrency}>
                  <SelectTrigger className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium">
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60">
                    <SelectItem value="BRL">Real (R$)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dólar ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cardBrand" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Bandeira do Cartão</Label>
                <Select value={cardBrand} onValueChange={setCardBrand}>
                  <SelectTrigger className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium">
                    <SelectValue placeholder="Selecione a bandeira" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60">
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="American Express">American Express</SelectItem>
                    <SelectItem value="Elo">Elo</SelectItem>
                    <SelectItem value="UnionPay">UnionPay</SelectItem>
                    <SelectItem value="JCB">JCB</SelectItem>
                    <SelectItem value="Outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">País de Emissão</Label>
                <Select value={cardCountry} onValueChange={(val: "BR" | "PT") => {
                  setCardCountry(val);
                  if (val === "BR") {
                    setSettlementMode("FULL_REIMBURSEMENT");
                    setRevolvingPercentage("");
                  }
                }}>
                  <SelectTrigger className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium">
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60">
                    <SelectItem value="BR">Brasil (BR)</SelectItem>
                    <SelectItem value="PT">Portugal (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cardCountry === "PT" && (
                <>
                  <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Modo de Liquidação / Pagamento</Label>
                    <Select value={settlementMode} onValueChange={(val: any) => {
                      setSettlementMode(val);
                      if (val !== "REVOLVING_CREDIT") setRevolvingPercentage("");
                    }}>
                      <SelectTrigger className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium">
                        <SelectValue placeholder="Selecione o modo" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/60">
                        <SelectItem value="FULL_REIMBURSEMENT">100% de Reembolso (Fim do Mês)</SelectItem>
                        <SelectItem value="REVOLVING_CREDIT">Crédito Rotativo (Pagamento Parcial)</SelectItem>
                        <SelectItem value="FRACTIONED">Pagamento Fracionado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settlementMode === "REVOLVING_CREDIT" && (
                    <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2">
                      <Label htmlFor="revolvingPercentage" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Porcentagem Mínima de Pagamento (%)</Label>
                      <Input
                        id="revolvingPercentage"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Ex: 15"
                        value={revolvingPercentage}
                        onChange={(e) => setRevolvingPercentage(e.target.value)}
                        className="rounded-xl bg-muted/15 border-border/40 h-11 font-mono text-sm"
                        required
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0 border-t border-border/20">
              <Button type="button" variant="outline" onClick={() => setIsNewCardOpen(false)} className="rounded-xl border-border/60 text-xs font-bold">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gradient-primary rounded-xl font-bold text-xs shadow-glow">
                {isSubmitting ? "Cadastrando..." : "Cadastrar Cartão"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Cartão */}
      <Dialog open={isEditCardOpen} onOpenChange={setIsEditCardOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl shadow-glow overflow-hidden p-0 gap-0">
          <DialogHeader className="p-6 pb-2 relative z-10">
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Edit2 className="h-5 w-5" />
              </div>
              Editar Cartão
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateCard} className="flex flex-col relative z-10">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-1.5">
                <Label htmlFor="editCardName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Nome do Cartão e Subconta</Label>
                <Input
                  id="editCardName"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Ex: Nubank, Itaú..."
                  className="rounded-xl bg-muted/15 border-border/40 h-11 text-base font-semibold placeholder:font-normal"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="editCreditLimit" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Limite de Crédito</Label>
                  <CurrencyInput
                    id="editCreditLimit"
                    value={creditLimit}
                    onValueChange={(val) => setCreditLimit(val)}
                    className="rounded-xl bg-muted/15 border-border/40 h-11 text-base font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Moeda</Label>
                  <Select value={cardCurrency} onValueChange={setCardCurrency}>
                    <SelectTrigger className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/60">
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Bandeira do Cartão</Label>
                  <Select value={cardBrand} onValueChange={setCardBrand}>
                    <SelectTrigger className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/60">
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                      <SelectItem value="American Express">American Express</SelectItem>
                      <SelectItem value="Elo">Elo</SelectItem>
                      <SelectItem value="UnionPay">UnionPay</SelectItem>
                      <SelectItem value="JCB">JCB</SelectItem>
                      <SelectItem value="Outra">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="editClosingDay" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Dia Fechamento</Label>
                  <Input
                    id="editClosingDay"
                    type="number"
                    min={1} max={31}
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="editDueDay" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Dia Vencimento</Label>
                  <Input
                    id="editDueDay"
                    type="number"
                    min={1} max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">País de Emissão</Label>
                <Select value={cardCountry} onValueChange={(val: "BR" | "PT") => {
                  setCardCountry(val);
                  if (val === "BR") {
                    setSettlementMode("FULL_REIMBURSEMENT");
                    setRevolvingPercentage("");
                  }
                }}>
                  <SelectTrigger className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium">
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/60">
                    <SelectItem value="BR">Brasil (BR)</SelectItem>
                    <SelectItem value="PT">Portugal (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cardCountry === "PT" && (
                <>
                  <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Modo de Liquidação / Pagamento</Label>
                    <Select value={settlementMode} onValueChange={(val: any) => {
                      setSettlementMode(val);
                      if (val !== "REVOLVING_CREDIT") setRevolvingPercentage("");
                    }}>
                      <SelectTrigger className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium">
                        <SelectValue placeholder="Selecione o modo" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/60">
                        <SelectItem value="FULL_REIMBURSEMENT">100% de Reembolso (Fim do Mês)</SelectItem>
                        <SelectItem value="REVOLVING_CREDIT">Crédito Rotativo (Pagamento Parcial)</SelectItem>
                        <SelectItem value="FRACTIONED">Pagamento Fracionado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settlementMode === "REVOLVING_CREDIT" && (
                    <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2">
                      <Label htmlFor="editRevolvingPercentage" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Porcentagem Mínima de Pagamento (%)</Label>
                      <Input
                        id="editRevolvingPercentage"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Ex: 15"
                        value={revolvingPercentage}
                        onChange={(e) => setRevolvingPercentage(e.target.value)}
                        className="rounded-xl bg-muted/15 border-border/40 h-11 font-mono text-sm"
                        required
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="px-6 py-4 gap-2 sm:gap-0 border-t border-border/20 bg-muted/5">
              <Button type="button" variant="outline" onClick={() => setIsEditCardOpen(false)} className="rounded-xl border-border/60 text-xs font-bold h-11">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gradient-primary rounded-xl font-bold shadow-glow text-xs h-11">
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Lançamento de Compra Matriz */}
      <Dialog open={isNewTxOpen} onOpenChange={setIsNewTxOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border-border/60 bg-gradient-to-br from-card/95 via-card/80 to-primary/5 backdrop-blur-xl overflow-hidden p-6 shadow-glow">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <form onSubmit={handleCreateTransaction} className="space-y-5 relative" noValidate>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-extrabold text-foreground">Nova Compra</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Lançando no cartão: <strong className="text-primary">{selectedCard?.name}</strong>
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Descrição da Compra</Label>
                <Input
                  id="description"
                  placeholder="Ex: Supermercado, Eletrônicos, Passagem Aérea..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Valor Total</Label>
                  <CurrencyInput
                    id="amount"
                    placeholder="0.00"
                    value={amount || 0}
                    onChange={(val) => setAmount(String(val))}
                    className="rounded-xl bg-muted/15 border-border/40 h-11 font-mono font-bold text-sm text-left"
                    required
                  />
                </div>

                {selectedCard?.country_of_issue === "PT" ? (
                  <div className="flex flex-col gap-1.5 justify-center bg-primary/10 p-3 rounded-xl border border-primary/20 text-xs text-primary font-semibold animate-in fade-in h-11 self-end">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      {selectedCard?.settlement_mode === "REVOLVING_CREDIT"
                        ? `Crédito Rotativo (${selectedCard?.revolving_percentage}% mín.)`
                        : selectedCard?.settlement_mode === "FRACTIONED"
                        ? "Pagamento Fracionado"
                        : "Liquidação a 100% no fecho (Débito Diferido)"
                      }
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="installments" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Parcelamento</Label>
                    <Input
                      id="installments"
                      type="number"
                      min="1"
                      value={totalInstallments}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTotalInstallments(val);
                        if (Number(startingInstallment) > Number(val) && val !== "") {
                          setStartingInstallment(val);
                        }
                      }}
                      className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium font-mono"
                      required
                    />
                  </div>
                )}
                
                {selectedCard?.country_of_issue !== "PT" && Number(totalInstallments) > 1 && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2 mt-1">
                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border/40 max-w-[240px]">
                      <button
                        type="button"
                        onClick={() => setInputType("TOTAL")}
                        className={cn(
                          "flex-1 text-xs font-bold py-1.5 rounded-lg transition-all",
                          inputType === "TOTAL" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Valor Total
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputType("PARCELA")}
                        className={cn(
                          "flex-1 text-xs font-bold py-1.5 rounded-lg transition-all",
                          inputType === "PARCELA" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Valor Parcela
                      </button>
                    </div>
                    
                    {amount && (
                      <p className="text-[11px] text-muted-foreground mt-1 px-1">
                        {inputType === "TOTAL" 
                          ? `Em ${totalInstallments}x de ${formatMoney(Number(amount) / Number(totalInstallments), selectedCard?.currency || 'BRL')}, começando a partir da ${startingInstallment}ª parcela.`
                          : `Em ${totalInstallments}x de ${formatMoney(Number(amount), selectedCard?.currency || 'BRL')}, totalizando ${formatMoney(Number(amount) * Number(totalInstallments), selectedCard?.currency || 'BRL')}, começando a partir da ${startingInstallment}ª parcela.`
                        }
                      </p>
                    )}
                  </div>
                )}
                
                {selectedCard?.country_of_issue !== "PT" && Number(totalInstallments) > 1 && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="startingInstallment" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                      A partir de qual parcela?
                      <HelpTooltip content="Use esta opção se você já pagou parcelas anteriores desta compra antes de usar o sistema. Ex: Se a compra foi em 10x e você já pagou 8, digite 9 para lançar apenas as parcelas restantes." />
                    </Label>
                    <Input
                      id="startingInstallment"
                      type="number"
                      min="1"
                      max={totalInstallments}
                      value={startingInstallment}
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val > Number(totalInstallments)) val = Number(totalInstallments);
                        setStartingInstallment(String(val || ""));
                      }}
                      className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium font-mono"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="txDate" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Data da Compra</Label>
                  <Input
                    id="txDate"
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="rounded-xl bg-muted/15 border-border/40 h-11 text-sm font-medium"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-full" id="category-container">
                  <Label htmlFor="category" className={cn("text-[10px] font-bold uppercase tracking-wider font-mono", categoryError ? "text-red-500" : "text-muted-foreground")}>Subconta de despesa</Label>
                  <GlobalAccountSelector 
                    value={categoryId} 
                    onValueChange={(val) => {
                      setCategoryId(val);
                      if (val) setCategoryError(false);
                    }}
                    placeholder="Selecione uma conta"
                  />
                  {categoryError && <span className="text-[10px] font-bold text-red-500 mt-1">Por favor, selecione uma subconta para registrar o gasto.</span>}
                </div>
              </div>

            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0 border-t border-border/20">
              <Button type="button" variant="outline" onClick={() => setIsNewTxOpen(false)} className="rounded-xl border-border/60 text-xs font-bold">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gradient-primary rounded-xl font-bold text-xs shadow-glow">
                {isSubmitting ? "Lançando..." : "Confirmar Compra"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Exclusão Granular */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 gap-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Excluir Lançamento</DialogTitle>
            <p className="text-sm text-muted-foreground">Escolha como deseja excluir esta compra. Os envelopes associados serão automaticamente ajustados.</p>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button variant={manageScope === 'single' ? 'default' : 'outline'} className="justify-start h-auto whitespace-normal px-4 py-4" onClick={() => setManageScope('single')}>
              <div className="text-left">
                <div className="font-medium">Apenas esta parcela</div>
                <div className="text-xs opacity-70 mt-1">Exclui somente este mês, as outras parcelas permanecem intactas.</div>
              </div>
            </Button>
            <Button variant={manageScope === 'future' ? 'default' : 'outline'} className="justify-start h-auto whitespace-normal px-4 py-4" onClick={() => setManageScope('future')}>
              <div className="text-left">
                <div className="font-medium">Esta e as próximas</div>
                <div className="text-xs opacity-70 mt-1">Exclui esta e as parcelas futuras. O valor total da compra diminuirá.</div>
              </div>
            </Button>
            <Button variant={manageScope === 'all' ? 'destructive' : 'outline'} className="justify-start h-auto whitespace-normal px-4 py-4" onClick={() => setManageScope('all')}>
              <div className="text-left">
                <div className="font-medium text-rose-500">Todas as parcelas</div>
                <div className="text-xs opacity-70 mt-1">Exclui toda a compra (Matriz) e todas as suas parcelas de ponta a ponta.</div>
              </div>
            </Button>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteInstallment} disabled={isSubmitting}>Confirmar Exclusão</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Edição Granular */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 gap-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Editar Lançamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Valor da Parcela</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">{baseCurrency}</span>
                <Input type="number" step="0.01" className="pl-12" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
              </div>
            </div>
            
            <div className="pt-4 space-y-3">
              <Label>Aplicar alteração em:</Label>
              <div className="flex flex-col gap-2">
                <Button variant={manageScope === 'single' ? 'default' : 'outline'} className="justify-start h-auto whitespace-normal text-left py-3" onClick={() => setManageScope('single')}>Apenas nesta parcela</Button>
                <Button variant={manageScope === 'future' ? 'default' : 'outline'} className="justify-start h-auto whitespace-normal text-left py-3" onClick={() => setManageScope('future')}>Nesta e nas próximas</Button>
                <Button variant={manageScope === 'all' ? 'default' : 'outline'} className="justify-start h-auto whitespace-normal text-left py-3" onClick={() => setManageScope('all')}>Em todas as parcelas</Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={confirmEditInstallment} disabled={isSubmitting}>Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CreditCards;
