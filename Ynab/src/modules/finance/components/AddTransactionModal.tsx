import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import { Plus, TrendingDown, TrendingUp, ArrowLeftRight, CheckCircle2, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useTransactions } from "@/shared/hooks/useTransactions";
import { type Transaction } from "@/types";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { RecurringScopeModal } from "@/modules/finance/components/RecurringScopeModal";
import { RecurrenceEditModal } from "@/modules/finance/components/RecurrenceEditModal";
import { useDebtStore } from "@/modules/finance/store/useDebtStore";
import { authenticatedFetch } from "@/shared/lib/api";
import { toast } from "sonner";

interface Props {
  children?: React.ReactNode;
  transaction?: Transaction; // If provided, we are in Edit mode
  onClose?: () => void;
  initialAccountId?: string;
}

export const AddTransactionModal = ({ children, transaction, onClose, initialAccountId }: Props) => {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  
  // Estados para caixas de busca de contas
  const [accountSearch, setAccountSearch] = useState("");
  const [toAccountSearch, setToAccountSearch] = useState("");

  const { splitRules, transactionDraft, fetchSplitRules, setTransactionDraft } = useDebtStore();
  const [applySplit, setApplySplit] = useState(false);
  const [splitRuleId, setSplitRuleId] = useState<string>("none");
  const [sharedAmount, setSharedAmount] = useState<number>(0);
  const [recurrenceEditModalOpen, setRecurrenceEditModalOpen] = useState(false);
  const [date, setDate] = useState<string>(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  // Carrega regras de rateio e recupera rascunho (se houver) ao abrir o modal
  useEffect(() => {
    if (open) {
      fetchSplitRules();
      if (transactionDraft) {
        setDescription(transactionDraft.description);
        setAmount(transactionDraft.amount);
        setType(transactionDraft.type);
        setAccountId(transactionDraft.accountId);
        setCategoryId(transactionDraft.categoryId);
        setStatus(transactionDraft.status);
        setDate(transactionDraft.date);
        setIsRecurring(transactionDraft.isRecurring);
        setRecurrenceInterval(transactionDraft.recurrenceInterval);
        if (transactionDraft.applySplit) {
          setApplySplit(true);
          setSplitRuleId(transactionDraft.splitRuleId || "none");
          setSharedAmount(transactionDraft.sharedAmount || 0);
        }
        // Limpa o rascunho para não reaplicar nas próximas aberturas
        setTransactionDraft(null);
      }
    }
  }, [open, transactionDraft]);

  // Resetar termos de busca ao fechar o modal
  useEffect(() => {
    if (!open) {
      setAccountSearch("");
      setToAccountSearch("");
    }
  }, [open]);

  // Sincronizar e limpar os campos controlados com base no ciclo de abertura e edição
  useEffect(() => {
    if (open) {
      setDescription(transaction?.description || "");
      setAmount(transaction ? Math.abs(transaction.amount) : 0);
      setType(transaction ? (transaction.is_income ? "income" : "expense") : "expense");
      setAccountId(transaction?.account ? String(transaction.account) : (initialAccountId || ""));
      setUseCategory(transaction?.category ? true : false);
      setCategoryId(transaction?.category ? String(transaction.category) : "none");
      setDate(transaction ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setStatus(transaction?.status || "realized");
      setIsRecurring(transaction?.is_recurring || false);
      setRecurrenceInterval(transaction?.recurrence_interval || "monthly");
      
      const txAny = transaction as any;
      if (txAny?.split_rule) {
        setApplySplit(true);
        setSplitRuleId(String(txAny.split_rule));
        setSharedAmount(txAny.shared_amount ? Math.abs(txAny.shared_amount) : 0);
      } else {
        setApplySplit(false);
        setSplitRuleId("none");
        setSharedAmount(0);
      }
    }
  }, [open, transaction, initialAccountId]);

  // Estados controlados para os seletores novos
  const [type, setType] = useState<string>(transaction ? (transaction.is_income ? "income" : "expense") : "expense");
  const [accountId, setAccountId] = useState<string>(transaction?.account ? String(transaction.account) : (initialAccountId || ""));
  const [useCategory, setUseCategory] = useState(transaction?.category ? true : false);
  const [categoryId, setCategoryId] = useState<string>(transaction?.category ? String(transaction.category) : "none");
  const [status, setStatus] = useState<string>(transaction?.status || "realized");
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>(transaction?.recurrence_interval || "monthly");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [toAmount, setToAmount] = useState<number>(0);

  // Estados para o preenchimento automático (autocomplete) baseado no histórico
  const [description, setDescription] = useState<string>(transaction?.description || "");
  const [amount, setAmount] = useState<number>(transaction ? Math.abs(transaction.amount) : 0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [scopeModalOpen, setScopeModalOpen] = useState(false);

  // Estados para cartão de crédito regional
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [inputType, setInputType] = useState<"TOTAL" | "PARCELA">("TOTAL");
  const [totalInstallments, setTotalInstallments] = useState("1");
  const [startingInstallment, setStartingInstallment] = useState("1");

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await authenticatedFetch("/credit-cards/");
        if (res.ok) {
          const data = await res.json();
          setCreditCards(data || []);
        }
      } catch (err) {
        console.error("Erro ao buscar cartões em AddTransactionModal:", err);
      }
    };
    fetchCards();
  }, []);

  const currentCard = useMemo(() => {
    if (!accountId) return null;
    return creditCards.find(
      (c: any) => String(c.account_id) === String(accountId) || String(c.account) === String(accountId)
    );
  }, [accountId, creditCards]);

  useEffect(() => {
    if (currentCard && currentCard.country_of_issue === "PT") {
      setTotalInstallments("1");
      setStartingInstallment("1");
      setInputType("TOTAL");
    }
  }, [currentCard]);



  // Resetar índice de sugestão ativa ao mudar o termo de busca
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [description]);



  const { tree, categoryGroups } = useAccountStore();
  const { transactions = [], addTransaction, updateTransaction, transferTransaction } = useTransactions();
  
  const isEdit = !!transaction;

  // Fechar sugestões ao clicar fora do componente de autocomplete
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const container = document.getElementById("autocomplete-container");
      if (container && !container.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      

    };
    
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Obter o nome de uma categoria pelo ID
  const getCategoryName = (catId: any) => {
    if (!catId) return "";
    for (const group of categoryGroups) {
      const found = (group.children || []).find((c: any) => String(c.id) === String(catId));
      if (found) return found.name;
    }
    return "";
  };

  // Buscar sugestões de transações anteriores
  const getSuggestions = () => {
    if (!description || description.trim().length === 0) return [];
    if (!Array.isArray(transactions)) {
      console.warn("⚠️ transactions não é um array válido dentro do AddTransactionModal:", transactions);
      return [];
    }
    
    const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const term = normalizeStr(description);
    
    const matching = transactions.filter(t => 
      t &&
      typeof t.description === "string" && 
      normalizeStr(t.description).includes(term) &&
      !t.transfer_group
    );
    
    const uniqueMap = new Map<string, Transaction>();
    
    // Pegar as ocorrências mais recentes (fim do array para o início)
    [...matching].reverse().forEach(t => {
      if (t && typeof t.description === "string") {
        const descKey = t.description.trim();
        if (!uniqueMap.has(descKey)) {
          uniqueMap.set(descKey, t);
        }
      }
    });
    
    return Array.from(uniqueMap.values()).slice(0, 5);
  };

  const suggestions = getSuggestions();

  const handleSelectSuggestion = (sug: Transaction) => {
    setDescription(sug.description);
    setAmount(Math.abs(sug.amount));
    setType(sug.is_income ? "income" : "expense");
    if (sug.account) setAccountId(String(sug.account));
    if (sug.category) {
      setUseCategory(true);
      setCategoryId(String(sug.category));
    } else {
      setUseCategory(false);
      setCategoryId("none");
    }
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const getAllAccounts = (nodes: any[], depth = 0): any[] => {
    let list: any[] = [];
    if (!nodes || !Array.isArray(nodes)) return list;
    
    nodes.forEach(node => {
      const indent = "\u00A0\u00A0".repeat(depth);
      list.push({
        ...node,
        displayName: `${indent}${depth > 0 ? "↳ " : ""}${node.name}`
      });
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        list = [...list, ...getAllAccounts(node.children, depth + 1)];
      }
    });
    return list;
  };
  
  const allAccounts = getAllAccounts(tree);



  const fromAccount = allAccounts.find(a => String(a.id) === accountId);
  const toAccount = allAccounts.find(a => String(a.id) === toAccountId);
  const isTransfer = type === "transfer";
  const showLiquidValue = isTransfer && fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const amountValue = amount;
    const is_income = type === "income";

    const transactionData = {
      account: accountId,
      description: formData.get("description") as string,
      amount: amountValue,
      is_income: is_income,
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      category: (isTransfer || !useCategory || categoryId === "none") ? null : categoryId,
      status: status,
      is_recurring: isRecurring,
      recurrence_interval: isRecurring ? recurrenceInterval : undefined,
      split_rule: (applySplit && splitRuleId !== "none") ? splitRuleId : null,
      shared_amount: (applySplit && sharedAmount > 0) ? sharedAmount : null,
    };

    if (isTransfer) {
      await transferTransaction.mutateAsync({
        from_account: accountId,
        to_account: toAccountId,
        amount: amountValue,
        to_amount: showLiquidValue ? toAmount : amountValue,
        description: formData.get("description") as string,
        date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      });
      setOpen(false);
      if (onClose) onClose();
    } else if (isEdit && transaction) {
      const isScheduledTx = transaction.status === "scheduled";
      const amountChanged = amount !== Math.abs(transaction.amount);

      if (isScheduledTx && amountChanged) {
        setRecurrenceEditModalOpen(true);
        return;
      } else if (transaction.recurring_parent || transaction.is_recurring) {
        setScopeModalOpen(true);
        return; // Retorna para aguardar escolha no modal
      } else {
        await updateTransaction.mutateAsync({ id: transaction.id, updates: transactionData });
        setOpen(false);
        if (onClose) onClose();
      }
    } else {
      if (type === "expense" && currentCard) {
        try {
          const payload = {
            description: formData.get("description") as string,
            total_amount: amountValue,
            total_installments: Number(totalInstallments),
            starting_installment: Number(startingInstallment),
            date: formData.get("date") as string || new Date().toISOString().split('T')[0],
            expense_account_id: (!useCategory || categoryId === "none") ? null : categoryId,
            currency: currentCard.currency,
            exchange_rate: 1.0,
            iof_amount: 0.0,
            input_type: inputType,
            split_rule: (applySplit && splitRuleId !== "none") ? splitRuleId : null,
            shared_amount: (applySplit && sharedAmount > 0) ? sharedAmount : null,
          };
          const response = await authenticatedFetch(`/credit-cards/${currentCard.id}/create_transaction/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Erro ao processar compra no cartão");

          toast.success("✨ Compra lançada com sucesso no cartão!");
          await useAccountStore.getState().fetchAccounts();
          await useAccountStore.getState().fetchTransactions();
          setOpen(false);
          if (onClose) onClose();
          return;
        } catch (error: any) {
          toast.error(error.message);
          return;
        }
      }
      await addTransaction.mutateAsync(transactionData as any);
      setOpen(false);
      if (onClose) onClose();
    }
  };

  const handleConfirmEditScope = async (scope: "single" | "future" | "all") => {
    if (!transaction) return;
    
    const amountValue = amount;
    const transactionData = {
      account: accountId,
      description: description,
      amount: amountValue,
      is_income: type === "income",
      date: (document.getElementById("date") as HTMLInputElement)?.value || new Date().toISOString().split('T')[0],
      category: (!useCategory || categoryId === "none") ? null : categoryId,
      status: status,
      is_recurring: isRecurring,
      recurrence_interval: recurrenceInterval,
      split_rule: (applySplit && splitRuleId !== "none") ? splitRuleId : null,
      shared_amount: (applySplit && sharedAmount > 0) ? sharedAmount : null,
    };

    await updateTransaction.mutateAsync({ id: transaction.id, updates: transactionData, scope });
    setScopeModalOpen(false);
    setOpen(false);
    if (onClose) onClose();
  };

  const handleConfirmRecurrenceEdit = async (scope: "single" | "future") => {
    if (!transaction) return;
    
    const amountValue = amount;
    const transactionData = {
      account: accountId,
      description: description,
      amount: amountValue,
      is_income: type === "income",
      date: (document.getElementById("date") as HTMLInputElement)?.value || new Date().toISOString().split('T')[0],
      category: (!useCategory || categoryId === "none") ? null : categoryId,
      status: status,
      is_recurring: isRecurring,
      recurrence_interval: recurrenceInterval,
      split_rule: (applySplit && splitRuleId !== "none") ? splitRuleId : null,
      shared_amount: (applySplit && sharedAmount > 0) ? sharedAmount : null,
    };

    await updateTransaction.mutateAsync({ id: transaction.id, updates: transactionData, scope });
    setRecurrenceEditModalOpen(false);
    setOpen(false);
    if (onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val && onClose) onClose();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button className="rounded-full gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold">
            <Plus className="h-4 w-4 mr-1" />
            Nova transação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/60">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Transação" : "Lançar Transação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div id="autocomplete-container" className="relative grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input 
              id="description" 
              name="description" 
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (!showSuggestions || suggestions.length === 0) return;
                
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveSuggestionIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : 0
                  );
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : suggestions.length - 1
                  );
                } else if (e.key === "Enter") {
                  if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                    e.preventDefault(); // Impede o submit do formulário
                    handleSelectSuggestion(suggestions[activeSuggestionIndex]);
                  }
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              placeholder="Ex: Mercado, Uber..." 
              required 
              className="bg-background/50" 
              autoComplete="off"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] z-50 w-full rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-glow py-1 text-sm max-h-52 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider opacity-60 select-none">
                  Sugestões do Histórico
                </div>
                {suggestions.map((sug, index) => {
                  const sAcc = allAccounts.find(a => String(a.id) === String(sug.account));
                  const isHighlighted = index === activeSuggestionIndex;
                  return (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-foreground transition-colors flex flex-col gap-1 cursor-pointer",
                        isHighlighted ? "bg-primary/20" : "hover:bg-primary/10"
                      )}
                    >
                      <div className="font-medium text-xs flex justify-between items-center w-full">
                        <span>{sug.description}</span>
                        <span className={sug.is_income ? "text-emerald-400" : "text-rose-400"}>
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: sAcc?.currency || "BRL" }).format(Math.abs(sug.amount))}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-1.5 gap-y-0.5 items-center">
                        <span className={cn(
                          "text-[9px] font-semibold px-1 py-0.2 rounded-md",
                          sug.is_income ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        )}>
                          {sug.is_income ? "Receita" : "Despesa"}
                        </span>
                        {sug.category && (
                          <>
                            <span>•</span>
                            <span className="bg-primary/10 text-primary-foreground/90 px-1 rounded-sm">
                              {getCategoryName(sug.category)}
                            </span>
                          </>
                        )}
                        {sAcc && (
                          <>
                            <span>•</span>
                            <span>{sAcc.name}</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor</Label>
              <CurrencyInput 
                id="amount" 
                value={amount}
                onChange={setAmount}
                placeholder="0,00" 
                required 
                className="bg-background/50 text-left" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" className="bg-background/50 border-border/60">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                      <span>Despesa</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="income">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span>Receita</span>
                    </div>
                  </SelectItem>
                  {!isEdit && (
                    <SelectItem value="transfer">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                        <span>Transferência</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showLiquidValue && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="to_amount" className="text-emerald-400 font-semibold">
                Valor Líquido Recebido ({toAccount?.currency})
              </Label>
              <div className="relative">
                <CurrencyInput 
                  id="to_amount" 
                  value={toAmount}
                  onChange={setToAmount}
                  placeholder="Valor final na conta de destino" 
                  required 
                  className="bg-emerald-500/10 border-emerald-500/30 focus-visible:ring-emerald-500 text-left" 
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Informe o valor que de fato caiu na conta após taxas e câmbio.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="bg-background/50 border-border/60">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  <SelectItem value="realized">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Efetivada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>Pendente</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input 
                id="date" 
                name="date" 
                type="date" 
                defaultValue={transaction ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                className="bg-background/50" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div id="account-container" className="relative grid gap-2 col-span-full">
              <Label htmlFor="account">{isTransfer ? "De Conta (Origem)" : "Conta"}</Label>
              <GlobalAccountSelector
                value={accountId}
                onValueChange={setAccountId}
                placeholder="Selecione uma conta"
              />
            </div>

            {isTransfer && (
              <div id="to-account-container" className="relative grid gap-2 animate-in slide-in-from-right-2 col-span-full">
                <Label htmlFor="to_account">Para Conta (Destino)</Label>
                <GlobalAccountSelector
                  value={toAccountId}
                  onValueChange={setToAccountId}
                  placeholder="Selecione uma conta"
                  excludeAccountId={accountId}
                />
              </div>
            )}
          </div>

          {!isTransfer && type === "expense" && currentCard && !isEdit && (
            <div className="grid gap-4 p-4 rounded-lg border border-border/50 bg-background/30 animate-in slide-in-from-top-2">
              {currentCard.country_of_issue === "PT" ? (
                <div className="flex flex-col gap-1.5 justify-center bg-primary/10 p-3 rounded-xl border border-primary/20 text-xs text-primary font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    {currentCard.settlement_mode === "REVOLVING_CREDIT"
                      ? `Crédito Rotativo (${currentCard.revolving_percentage}% mín.)`
                      : currentCard.settlement_mode === "FRACTIONED"
                      ? "Pagamento Fracionado"
                      : "Liquidação a 100% no fecho (Débito Diferido)"
                    }
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label htmlFor="modal_installments" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Parcelamento</Label>
                    <Input
                      id="modal_installments"
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
                      className="rounded-xl bg-background/50 border-border/60 h-11 text-sm font-medium font-mono"
                      required
                    />
                  </div>

                  {Number(totalInstallments) > 1 && (
                    <div className="flex flex-col gap-1.5 col-span-2 mt-1">
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

                      {amount > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1 px-1">
                          {inputType === "TOTAL"
                            ? `Em ${totalInstallments}x de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: currentCard.currency || "BRL" }).format(amount / Number(totalInstallments))}, começando a partir da ${startingInstallment}ª parcela.`
                            : `Em ${totalInstallments}x de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: currentCard.currency || "BRL" }).format(amount)}, totalizando ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: currentCard.currency || "BRL" }).format(amount * Number(totalInstallments))}, começando a partir da ${startingInstallment}ª parcela.`
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {Number(totalInstallments) > 1 && (
                    <div className="flex flex-col gap-1.5 col-span-2">
                      <Label htmlFor="modal_startingInstallment" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                        A partir de qual parcela?
                      </Label>
                      <Input
                        id="modal_startingInstallment"
                        type="number"
                        min="1"
                        max={totalInstallments}
                        value={startingInstallment}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val > Number(totalInstallments)) val = Number(totalInstallments);
                          setStartingInstallment(String(val || ""));
                        }}
                        className="rounded-xl bg-background/50 border-border/60 h-11 text-sm font-medium font-mono"
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}



          {!isTransfer && (
            <div className="grid gap-4 rounded-lg border border-border/50 p-4 bg-background/30">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="apply_split" 
                  checked={applySplit}
                  onChange={(e) => setApplySplit(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="apply_split" className="font-medium cursor-pointer">Aplicar Regra de Rateio?</Label>
              </div>

              {applySplit && (
                <div className="grid gap-3 pl-6 animate-in slide-in-from-top-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 grid gap-1.5">
                      <Label htmlFor="split_rule" className="text-xs text-muted-foreground">Regra de Rateio</Label>
                      <Select value={splitRuleId} onValueChange={setSplitRuleId}>
                        <SelectTrigger className="bg-background/50 border-border/60">
                          <SelectValue placeholder="Selecione uma regra" />
                        </SelectTrigger>
                        <SelectContent className="glass border-border/60">
                          <SelectItem value="none">Selecione uma regra</SelectItem>
                          {splitRules.map(rule => (
                            <SelectItem key={rule.id} value={String(rule.id)}>{rule.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Persiste o draft no Zustand para recuperar ao voltar
                        setTransactionDraft({
                          description,
                          amount,
                          type,
                          accountId,
                          categoryId,
                          status,
                          date,
                          isRecurring,
                          recurrenceInterval,
                          splitRuleId,
                          sharedAmount,
                          applySplit: true
                        });
                        setOpen(false);
                        if (onClose) onClose();
                        // Navega para a aba de regras de rateio (Deep Link)
                        window.location.hash = "#/settings/split-rules";
                      }}
                      className="text-xs font-bold text-primary hover:underline h-10 px-2 flex items-center bg-primary/10 rounded-lg border border-primary/20 cursor-pointer"
                    >
                      Criar/Editar
                    </button>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="shared_amount" className="text-xs text-muted-foreground">Valor Compartilhado (Opcional)</Label>
                    <CurrencyInput
                      id="shared_amount"
                      value={sharedAmount}
                      onChange={setSharedAmount}
                      placeholder="Deixe 0 para ratear valor total"
                      className="bg-background/50 text-left"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!isEdit && (
            <div className="grid gap-4 rounded-lg border border-border/50 p-4 bg-background/30">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="is_recurring" 
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_recurring" className="font-medium cursor-pointer">Repetir esta transação?</Label>
              </div>
              
              {isRecurring && (
                <div className="grid gap-2 pl-6 animate-in slide-in-from-top-2">
                  <Label htmlFor="recurrence_interval" className="text-xs text-muted-foreground">Frequência</Label>
                  <Select 
                    value={recurrenceInterval} 
                    onValueChange={setRecurrenceInterval}
                  >
                    <SelectTrigger className="bg-background/50 border-border/60">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent className="glass border-border/60">
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                      <SelectItem value="yearly">Anualmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full gradient-primary">
              {isEdit ? "Salvar Alterações" : "Salvar Transação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <RecurringScopeModal
        open={scopeModalOpen}
        onOpenChange={setScopeModalOpen}
        actionType="edit"
        onConfirm={handleConfirmEditScope}
      />
      <RecurrenceEditModal
        open={recurrenceEditModalOpen}
        onOpenChange={setRecurrenceEditModalOpen}
        onConfirm={handleConfirmRecurrenceEdit}
      />
    </Dialog>
  );
};
