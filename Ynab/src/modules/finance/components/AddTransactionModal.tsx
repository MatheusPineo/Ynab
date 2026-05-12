import { useState, useEffect } from "react";
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
import { Label } from "@/shared/components/ui/label";
import { Plus, TrendingDown, TrendingUp, ArrowLeftRight, CheckCircle2, Clock } from "lucide-react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useTransactions } from "@/shared/hooks/useTransactions";
import { type Transaction } from "@/types";

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
      setAmount(transaction ? String(Math.abs(transaction.amount)) : "");
      setType(transaction ? (transaction.is_income ? "income" : "expense") : "expense");
      setAccountId(transaction?.account ? String(transaction.account) : (initialAccountId || ""));
      setUseCategory(transaction?.category ? true : false);
      setCategoryId(transaction?.category ? String(transaction.category) : "none");
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
  const [toAmount, setToAmount] = useState<string>("");

  // Estados para o preenchimento automático (autocomplete) baseado no histórico
  const [description, setDescription] = useState<string>(transaction?.description || "");
  const [amount, setAmount] = useState<string>(transaction ? String(Math.abs(transaction.amount)) : "");
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    
    const term = description.toLowerCase();
    
    const matching = transactions.filter(t => 
      t.description && 
      t.description.toLowerCase().includes(term) &&
      !t.transfer_group
    );
    
    const uniqueMap = new Map<string, Transaction>();
    
    // Pegar as ocorrências mais recentes (fim do array para o início)
    [...matching].reverse().forEach(t => {
      const descKey = t.description.trim();
      if (!uniqueMap.has(descKey)) {
        uniqueMap.set(descKey, t);
      }
    });
    
    return Array.from(uniqueMap.values()).slice(0, 5);
  };

  const suggestions = getSuggestions();

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

  const filteredFromAccounts = allAccounts.filter(acc => 
    acc.name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const filteredToAccounts = allAccounts
    .filter(acc => String(acc.id) !== accountId)
    .filter(acc => acc.name.toLowerCase().includes(toAccountSearch.toLowerCase()));

  const fromAccount = allAccounts.find(a => String(a.id) === accountId);
  const toAccount = allAccounts.find(a => String(a.id) === toAccountId);
  const isTransfer = type === "transfer";
  const showLiquidValue = isTransfer && fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const amountValue = parseFloat(formData.get("amount") as string);
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
        to_amount: showLiquidValue ? parseFloat(toAmount) : amountValue,
        description: formData.get("description") as string,
        date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      });
    } else if (isEdit && transaction) {
      await updateTransaction.mutateAsync({ id: transaction.id, updates: transactionData });
    } else {
      await addTransaction.mutateAsync(transactionData as any);
    }

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
                {suggestions.map((sug) => {
                  const sAcc = allAccounts.find(a => String(a.id) === String(sug.account));
                  return (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => {
                        setDescription(sug.description);
                        setAmount(String(Math.abs(sug.amount)));
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
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-primary/10 text-foreground transition-colors flex flex-col gap-1 cursor-pointer"
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
              <Input 
                id="amount" 
                name="amount" 
                type="number" 
                step="0.01" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                required 
                className="bg-background/50" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background/50 border-border/60">
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
                <Input 
                  id="to_amount" 
                  name="to_amount" 
                  type="number" 
                  step="0.01" 
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="Valor final na conta de destino" 
                  required 
                  className="bg-emerald-500/10 border-emerald-500/30 focus-visible:ring-emerald-500" 
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
                <SelectTrigger className="bg-background/50 border-border/60">
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
            <div className="grid gap-2">
              <Label htmlFor="account">{isTransfer ? "De Conta (Origem)" : "Conta"}</Label>
              {allAccounts.length > 4 && (
                <Input 
                  type="text"
                  placeholder="🔍 Filtrar..." 
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="h-8.5 text-xs bg-background/40 border-border/50 placeholder:text-muted-foreground/60 rounded-xl focus-visible:ring-primary/50"
                />
              )}
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger className="bg-background/50 border-border/60">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  {filteredFromAccounts.length === 0 ? (
                    <div className="py-2.5 px-3 text-xs text-muted-foreground text-center select-none">Nenhuma conta encontrada</div>
                  ) : (
                    filteredFromAccounts.map(acc => (
                      <SelectItem key={acc.id} value={String(acc.id)}>
                        <span className="whitespace-pre">{acc.displayName || acc.name}</span> ({acc.currency})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {isTransfer && (
              <div className="grid gap-2 animate-in slide-in-from-right-2">
                <Label htmlFor="to_account">Para Conta (Destino)</Label>
                {allAccounts.length > 4 && (
                  <Input 
                    type="text"
                    placeholder="🔍 Filtrar..." 
                    value={toAccountSearch}
                    onChange={(e) => setToAccountSearch(e.target.value)}
                    className="h-8.5 text-xs bg-background/40 border-border/50 placeholder:text-muted-foreground/60 rounded-xl focus-visible:ring-primary/50"
                  />
                )}
                <Select value={toAccountId} onValueChange={setToAccountId} required>
                  <SelectTrigger className="bg-background/50 border-border/60">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border/60">
                    {filteredToAccounts.length === 0 ? (
                      <div className="py-2.5 px-3 text-xs text-muted-foreground text-center select-none">Nenhuma conta encontrada</div>
                    ) : (
                      filteredToAccounts.map(acc => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          <span className="whitespace-pre">{acc.displayName || acc.name}</span> ({acc.currency})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!isTransfer && (
            <div className="flex flex-col gap-4 p-4 rounded-lg border border-border/50 bg-background/30">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="use_category" 
                  checked={useCategory}
                  onChange={(e) => setUseCategory(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="use_category" className="font-medium cursor-pointer">Vincular a uma categoria?</Label>
              </div>

              {useCategory && (
                <div className="grid gap-2 animate-in slide-in-from-top-2">
                  <Label htmlFor="category">Categoria de Orçamento</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="bg-background/50 border-border/60">
                      <SelectValue placeholder="Sem categoria" />
                    </SelectTrigger>
                    <SelectContent className="glass border-border/60">
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categoryGroups.map(group => (
                        <SelectGroup key={group.id}>
                          <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground opacity-70">
                            {group.name}
                          </SelectLabel>
                          {(group.children || []).map(cat => (
                            <SelectItem key={cat.id} value={String(cat.id)} className="pl-6">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
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
    </Dialog>
  );
};
