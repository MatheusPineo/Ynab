import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, TrendingDown, TrendingUp, ArrowLeftRight, CheckCircle2, Clock, ChevronDown, Sparkles, Trash2, HandCoins } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useTransactions } from "@/shared/hooks/useTransactions";
import { type Transaction } from "@/types";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";
import { GlobalCategorySelector } from "@/shared/components/ui/global-category-selector";
import { RecurringScopeModal } from "@/modules/finance/components/RecurringScopeModal";
import { RecurrenceEditModal } from "@/modules/finance/components/RecurrenceEditModal";
import { authenticatedFetch } from "@/shared/lib/api";
import { toast } from "sonner";
import { useDebtStore } from "@/modules/finance/store/useDebtStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

interface SplitItem {
  id: string;
  description: string;
  amount: number;
  divideBy: number;
  debtorCategoryIds: string[];
}

interface Props {
  children?: React.ReactNode;
  transaction?: Transaction; // If provided, we are in Edit mode
  onClose?: () => void;
  initialAccountId?: string;
  isOpen?: boolean;
}

export const AddTransactionModal = ({ children, transaction, onClose, initialAccountId, isOpen }: Props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(isOpen || false);

  // Sincronizar prop isOpen externa com o estado open interno
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);
  const [isRecurring, setIsRecurring] = useState(false);
  
  // Estados para caixas de busca de contas
  const [accountSearch, setAccountSearch] = useState("");
  const [toAccountSearch, setToAccountSearch] = useState("");

  const { tree, categoryGroups } = useAccountStore();
  const { transactions = [], addTransaction, updateTransaction, transferTransaction } = useTransactions();

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
  
  type SplitMode = "equally" | "percentage" | "exact" | "itemized";
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>("equally");

  interface SplitMember {
    id: string; // debtor_id or "user"
    name: string;
    active: boolean;
    percentage: number;
    exactValue: number;
    isUser?: boolean;
  }
  const [splitMembers, setSplitMembers] = useState<SplitMember[]>([]);

  interface ReceiptItemMember {
    id: string;
    name: string;
    weight: number; // 0 or 1, or direct allocation percentage weight
  }

  interface ReceiptItem {
    id: number;
    name: string;
    amount: number;
    sharedBy: ReceiptItemMember[]; // members involved in this item
  }

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([
    { id: Date.now(), name: "", amount: 0, sharedBy: [] }
  ]);

  // Aggregation Algorithm: Automatically map product shares to exactValue when receiptItems change
  useEffect(() => {
    if (splitMode !== "itemized") return;
    
    // Create mapping of totals
    const aggregatedShares: Record<string, number> = {};
    splitMembers.forEach(m => {
      aggregatedShares[m.id] = 0;
    });

    receiptItems.forEach(item => {
      const activeShares = item.sharedBy.filter(s => s.weight > 0);
      const totalWeight = activeShares.reduce((sum, s) => sum + s.weight, 0);
      if (totalWeight > 0 && item.amount > 0) {
        activeShares.forEach(share => {
          const shareAmount = (item.amount * share.weight) / totalWeight;
          if (aggregatedShares[share.id] !== undefined) {
            aggregatedShares[share.id] += Number(shareAmount.toFixed(2));
          }
        });
      }
    });

    // Update splitMembers with exact values
    setSplitMembers(prev => prev.map(m => {
      const isMemberActive = (aggregatedShares[m.id] || 0) > 0;
      return {
        ...m,
        active: m.isUser ? true : isMemberActive, // user remains active, others active if they owe money
        exactValue: Number((aggregatedShares[m.id] || 0).toFixed(2))
      };
    }));
  }, [receiptItems, splitMode]);

  // Inline Debtor Creation State
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [isCreatingDebtor, setIsCreatingDebtor] = useState(false);

  const handleCreateAndAddPerson = async () => {
    if (!newPersonName.trim()) {
      toast.error("Por favor, digite um nome válido.");
      return;
    }
    setIsCreatingDebtor(true);
    try {
      const response = await authenticatedFetch("/debts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterparty_name: newPersonName.trim(),
          original_amount: 0.00,
          currency: "EUR",
          is_mine: true,
          notes: "Adicionado via rateio"
        })
      });
      if (!response.ok) {
        throw new Error("Erro ao criar devedor.");
      }
      const data = await response.json();
      
      // Append created debtor dynamically to split members list
      const newMember: SplitMember = {
        id: data.id,
        name: data.counterparty_name,
        active: true,
        percentage: 0,
        exactValue: 0
      };
      setSplitMembers(prev => [...prev, newMember]);
      setNewPersonName("");
      setIsAddingPerson(false);
      toast.success(`${data.counterparty_name} adicionado com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || "Erro de conexão ao criar devedor.");
    } finally {
      setIsCreatingDebtor(false);
    }
  };

  const { debts } = useDebtStore();

  useEffect(() => {
    if (open) {
      try {
        useDebtStore.getState().fetchDebts();
      } catch (e) {}
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const uniqueFriends = Array.from(new Map(debts.map(d => [d.counterparty_name, d])).values());
      const members: SplitMember[] = [
        { id: "user", name: "Você", active: true, percentage: 0, exactValue: 0, isUser: true },
        ...uniqueFriends.map(d => ({
          id: d.id,
          name: d.counterparty_name,
          active: false,
          percentage: 0,
          exactValue: 0
        }))
      ];
      setSplitMembers(members);
      setIsSplitting(false);
      setSplitMode("equally");
    }
  }, [open, debts.length]);

  const [recurrenceEditModalOpen, setRecurrenceEditModalOpen] = useState(false);
  const [date, setDate] = useState<string>(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  // Carrega grupos de categorias ao abrir o modal
  useEffect(() => {
    if (open) {
      try {
        useAccountStore.getState().fetchCategoryGroups?.();
      } catch (err) {
        console.error("Erro ao carregar grupos de categoria ao abrir o modal:", err);
      }
    }
  }, [open]);

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
      setIsSplitting(false);
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
    const acc = allAccounts.find(a => String(a.id) === String(accountId));
    const isCreditType = acc?.account_type === "credit_card" || acc?.account_type === "CREDIT_CARD";
    if (!isCreditType) return null;

    return creditCards.find(
      (c: any) => String(c.account_id) === String(accountId) || String(c.account) === String(accountId)
    );
  }, [accountId, creditCards, allAccounts]);

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
    for (const group of categoryGroups || []) {
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
        return;
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

      // ADVANCED SPLIT ENGINE LOGIC
      if (isSplitting && type === "expense") {
        const activeMembers = splitMembers.filter(m => m.active);
        
        // Build payload splits
        const splits = activeMembers.filter(m => !m.isUser).map(m => {
          let splitAmount = 0;
          if (splitMode === "equally") splitAmount = equalAmount;
          else if (splitMode === "percentage") splitAmount = (amountValue * m.percentage) / 100;
          else if (splitMode === "exact" || splitMode === "itemized") splitAmount = m.exactValue;
          
          return {
            debtor_id: m.id,
            amount: splitAmount,
            src_category_id: categoryId === "none" ? null : categoryId
          };
        });

        const userMember = activeMembers.find(m => m.isUser);
        let userAmount = 0;
        if (userMember) {
          if (splitMode === "equally") userAmount = equalAmount;
          else if (splitMode === "percentage") userAmount = (amountValue * userMember.percentage) / 100;
          else if (splitMode === "exact" || splitMode === "itemized") userAmount = userMember.exactValue;
        }

        // Pass unified payload with splits array to the store
        await addTransaction.mutateAsync({ ...transactionData, amount: userAmount, total_amount: amountValue, splits } as any);

        setOpen(false);
        if (onClose) onClose();
        return;
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
    };

    await updateTransaction.mutateAsync({ id: transaction.id, updates: transactionData, scope });
    setScopeModalOpen(false);
    setOpen(false);
    if (onClose) onClose();
  };

  // Math Engine Computations
  const activeMembersCount = splitMembers.filter(m => m.active).length;
  const equalAmount = activeMembersCount > 0 ? Number((amount / activeMembersCount).toFixed(2)) : 0;
  const totalPercentage = splitMembers.filter(m => m.active).reduce((sum, m) => sum + (m.percentage || 0), 0);
  const totalExact = splitMembers.filter(m => m.active).reduce((sum, m) => sum + (m.exactValue || 0), 0);
  const remainingExact = amount - totalExact;

  const totalReceiptItemsSum = receiptItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remainingReceiptExact = amount - totalReceiptItemsSum;

  // Validation guard
  let splitError: string | null = null;
  if (isSplitting && type === "expense") {
    if (activeMembersCount < 2) {
      splitError = "Selecione pelo menos 2 pessoas (incluindo você).";
    } else if (splitMode === "percentage" && totalPercentage !== 100) {
      splitError = `Soma atual (${totalPercentage}%) não atinge 100%.`;
    } else if (splitMode === "exact" && Math.abs(remainingExact) >= 0.01) {
      splitError = `Restam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingExact)} para fechar o valor.`;
    } else if (splitMode === "itemized") {
      if (Math.abs(remainingReceiptExact) >= 0.01) {
        splitError = `O total dos produtos (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceiptItemsSum)}) não bate com o valor total da transação (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}).`;
      }
    }
  }

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
      {!isEdit && (
        <DialogTrigger asChild>
          {children || (
            <Button className="rounded-full gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold">
              <Plus className="h-4 w-4 mr-1" />
              Nova transação
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] glass border-border/60 max-h-[85vh] overflow-y-auto">
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
                    e.preventDefault();
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
                            <span className="text-[9px] font-semibold px-1 py-0.5 rounded-md text-emerald-200 bg-emerald-500/20 border border-emerald-500/30">
                              {getCategoryName(sug.category)}
                            </span>
                          </>
                        )}
                        {sAcc && (
                          <>
                            <span>•</span>
                            <span className="text-[9px] font-semibold px-1 py-0.5 rounded-md text-white/80 bg-white/10 border border-white/10">
                              {sAcc.name}
                            </span>
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
              <Label htmlFor="account">
                {isTransfer 
                  ? "De Conta (Origem)" 
                  : isSplitting 
                  ? "Conta de Origem (De onde saiu o valor total?)" 
                  : "Conta"}
              </Label>
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

            {/* SELETOR DE CATEGORIA AGRUPADO (Apenas para despesas/receitas) */}
            {!isTransfer && (
              <div id="category-container" className="relative grid gap-2 col-span-full animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="category">
                  {isSplitting 
                    ? "Categoria (Apenas a sua parte da despesa)" 
                    : "Categoria"}
                </Label>
                <GlobalCategorySelector
                  value={categoryId}
                  onValueChange={(v) => {
                    setCategoryId(v);
                    setUseCategory(v !== "none");
                  }}
                  placeholder="Selecione uma categoria"
                  currency={allAccounts.find(a => String(a.id) === String(accountId))?.currency}
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

          {!isEdit && type === "expense" && (
            <div className="grid gap-4 mt-2">
              <button 
                type="button"
                onClick={() => setIsSplitting(!isSplitting)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all shadow-soft"
              >
                <ArrowLeftRight className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  ⇄ Dividir Conta com alguém?
                </span>
              </button>

              {isSplitting && (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300 space-y-5">
                  <Tabs value={splitMode} onValueChange={(v: any) => setSplitMode(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-background/50 border border-border/50 h-11">
                      <TabsTrigger value="equally" className="text-[10px] font-bold">Igualitário</TabsTrigger>
                      <TabsTrigger value="percentage" className="text-[10px] font-bold">Porcentagem</TabsTrigger>
                      <TabsTrigger value="exact" className="text-[10px] font-bold">Valor Exato</TabsTrigger>
                      <TabsTrigger value="itemized" className="text-[10px] font-bold">Por Produto</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {splitMode === "itemized" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/40">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Total Produtos:
                        </span>
                        <span className={cn("text-sm font-black", splitError ? "text-rose-400" : "text-emerald-400")}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceiptItemsSum)} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                        {receiptItems.map((item, itemIdx) => (
                          <div key={item.id} className="p-3.5 rounded-xl border border-border/40 bg-background/40 space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Ex: Hambúrguer"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...receiptItems];
                                  updated[itemIdx].name = e.target.value;
                                  setReceiptItems(updated);
                                }}
                                className="h-9 text-xs bg-background/50 border-border/50 flex-1"
                              />
                              <div className="w-28">
                                <CurrencyInput
                                  value={item.amount}
                                  onChange={(val) => {
                                    const updated = [...receiptItems];
                                    updated[itemIdx].amount = val;
                                    setReceiptItems(updated);
                                  }}
                                  className="h-9 text-right bg-background/50 border-border/50 text-xs font-mono font-bold"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (receiptItems.length > 1) {
                                    setReceiptItems(prev => prev.filter(i => i.id !== item.id));
                                  }
                                }}
                                className="h-9 w-9 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Checklist of participants for this specific item */}
                            <div className="space-y-1.5 pl-1">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quem divide esse item?</div>
                              <div className="flex flex-wrap gap-2">
                                {splitMembers.map((member) => {
                                  const match = item.sharedBy.find(s => s.id === member.id);
                                  const isChecked = match ? match.weight > 0 : false;
                                  return (
                                    <button
                                      key={member.id}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...receiptItems];
                                        const currentShared = [...updated[itemIdx].sharedBy];
                                        const existingIndex = currentShared.findIndex(s => s.id === member.id);
                                        
                                        if (existingIndex >= 0) {
                                          currentShared[existingIndex].weight = currentShared[existingIndex].weight > 0 ? 0 : 1;
                                        } else {
                                          currentShared.push({ id: member.id, name: member.name, weight: 1 });
                                        }
                                        updated[itemIdx].sharedBy = currentShared;
                                        setReceiptItems(updated);
                                      }}
                                      className={cn(
                                        "text-[10px] px-2.5 py-1 rounded-full border transition-all font-semibold",
                                        isChecked 
                                          ? "bg-primary/20 border-primary text-primary-foreground font-bold shadow-soft" 
                                          : "bg-background/20 border-border/40 text-muted-foreground hover:text-foreground"
                                      )}
                                    >
                                      {member.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReceiptItems(prev => [...prev, { id: Date.now(), name: "", amount: 0, sharedBy: [] }])}
                        className="w-full h-9 justify-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/40 hover:border-border/80 bg-background/20 rounded-xl"
                      >
                        + Adicionar Produto
                      </Button>
                    </div>
                  )}

                  {(splitMode === "percentage" || splitMode === "exact") && (
                    <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/40">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {splitMode === "percentage" ? "Total Alocado:" : "Valor Restante:"}
                      </span>
                      <span className={cn("text-sm font-black", splitError ? "text-rose-400" : "text-emerald-400")}>
                        {splitMode === "percentage" ? `${totalPercentage}% / 100%` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingExact)}
                      </span>
                    </div>
                  )}

                  {splitMode !== "itemized" && (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                      {splitMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-background/40 hover:bg-background/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              id={`member-${member.id}`}
                              checked={member.active}
                              onCheckedChange={(checked) => {
                                setSplitMembers(prev => prev.map(m => m.id === member.id ? { ...m, active: !!checked } : m));
                              }}
                              className="h-5 w-5 rounded-md"
                            />
                            <Label htmlFor={`member-${member.id}`} className="text-sm font-semibold cursor-pointer">
                              {member.name}
                            </Label>
                          </div>
                          {member.active && splitMode === "equally" && (
                            <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(equalAmount)}
                            </span>
                          )}
                          {member.active && splitMode === "percentage" && (
                            <div className="flex items-center gap-1 w-24">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={member.percentage || ""}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSplitMembers(prev => prev.map(m => m.id === member.id ? { ...m, percentage: val } : m));
                                }}
                                className="h-9 text-right bg-background border-border/50 text-sm font-mono font-bold"
                              />
                              <span className="text-xs text-muted-foreground font-bold">%</span>
                            </div>
                          )}
                          {member.active && splitMode === "exact" && (
                            <div className="w-32">
                              <CurrencyInput 
                                value={member.exactValue || 0}
                                onChange={(val) => {
                                  setSplitMembers(prev => prev.map(m => m.id === member.id ? { ...m, exactValue: val } : m));
                                }}
                                className="h-9 text-right bg-background border-border/50 text-sm font-mono font-bold"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Debtor Creation Controls */}
                  <div className="pt-2 border-t border-border/20 mt-2">
                    {isAddingPerson ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <Input
                          placeholder="Nome da pessoa..."
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          className="h-9 text-xs bg-background/50 border-border/50"
                          disabled={isCreatingDebtor}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateAndAddPerson();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateAndAddPerson}
                          disabled={isCreatingDebtor}
                          className="h-9 px-3 text-xs"
                        >
                          {isCreatingDebtor ? "..." : "Adicionar"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsAddingPerson(false);
                            setNewPersonName("");
                          }}
                          disabled={isCreatingDebtor}
                          className="h-9 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingPerson(true)}
                        className="w-full h-9 justify-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/40 hover:border-border/80 bg-background/20 rounded-xl"
                      >
                        + Adicionar Pessoa no Rateio
                      </Button>
                    )}
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

          <DialogFooter className="flex-col gap-2 sm:gap-2">
            <Button type="submit" className="w-full gradient-primary font-bold h-11" disabled={!!splitError}>
              {splitError || (isEdit ? "Salvar Alterações" : "Salvar Transação")}
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