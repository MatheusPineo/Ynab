import { useState } from "react";
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
  
  // Estados controlados para os seletores novos
  const [type, setType] = useState<string>(transaction ? (transaction.is_income ? "income" : "expense") : "expense");
  const [accountId, setAccountId] = useState<string>(transaction?.account ? String(transaction.account) : (initialAccountId || ""));
  const [useCategory, setUseCategory] = useState(transaction?.category ? true : false);
  const [categoryId, setCategoryId] = useState<string>(transaction?.category ? String(transaction.category) : "none");
  const [status, setStatus] = useState<string>(transaction?.status || "realized");
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>(transaction?.recurrence_interval || "monthly");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");

  const { tree, categoryGroups } = useAccountStore();
  const { addTransaction, updateTransaction, transferTransaction } = useTransactions();
  
  const isEdit = !!transaction;

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
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input 
              id="description" 
              name="description" 
              defaultValue={transaction?.description}
              placeholder="Ex: Mercado, Uber..." 
              required 
              className="bg-background/50" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor</Label>
              <Input 
                id="amount" 
                name="amount" 
                type="number" 
                step="0.01" 
                defaultValue={transaction ? Math.abs(transaction.amount) : ""}
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
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger className="bg-background/50 border-border/60">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  {allAccounts.map(acc => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      <span className="whitespace-pre">{acc.displayName || acc.name}</span> ({acc.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isTransfer && (
              <div className="grid gap-2 animate-in slide-in-from-right-2">
                <Label htmlFor="to_account">Para Conta (Destino)</Label>
                <Select value={toAccountId} onValueChange={setToAccountId} required>
                  <SelectTrigger className="bg-background/50 border-border/60">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border/60">
                    {allAccounts.filter(acc => String(acc.id) !== accountId).map(acc => (
                      <SelectItem key={acc.id} value={String(acc.id)}>
                        <span className="whitespace-pre">{acc.displayName || acc.name}</span> ({acc.currency})
                      </SelectItem>
                    ))}
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
