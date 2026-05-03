import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAccountStore } from "@/store/useAccountStore";
import { useTransactions } from "@/hooks/useTransactions";
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
  const [categoryId, setCategoryId] = useState<string>(transaction?.category ? String(transaction.category) : "none");
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>(transaction?.recurrence_interval || "monthly");

  const { tree, categoryGroups } = useAccountStore();
  const { addTransaction, updateTransaction } = useTransactions();
  
  const isEdit = !!transaction;

  const getLeafAccounts = (nodes: any[]): any[] => {
    let leaves: any[] = [];
    if (!nodes) return leaves;
    
    nodes.forEach(node => {
      const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
      if (hasChildren) {
        leaves = [...leaves, ...getLeafAccounts(node.children)];
      } else {
        leaves.push(node);
      }
    });
    return leaves;
  };
  
  const leafAccounts = getLeafAccounts(tree);

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
      category: categoryId === "none" ? null : categoryId,
      is_recurring: isRecurring,
      recurrence_interval: isRecurring ? recurrenceInterval : undefined,
    };

    if (isEdit && transaction) {
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
                  <SelectItem value="expense">Despesa (-)</SelectItem>
                  <SelectItem value="income">Receita (+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid gap-2">
            <Label htmlFor="account">Conta</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger className="bg-background/50 border-border/60">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                {leafAccounts.map(acc => (
                  <SelectItem key={acc.id} value={String(acc.id)}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
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
