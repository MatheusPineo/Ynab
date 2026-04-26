import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAccountStore } from "@/store/useAccountStore";
import { type Transaction } from "@/types";

interface Props {
  children?: React.ReactNode;
  transaction?: Transaction; // If provided, we are in Edit mode
  onClose?: () => void;
}

export const AddTransactionModal = ({ children, transaction, onClose }: Props) => {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const { tree, categoryGroups, addTransaction, updateTransaction } = useAccountStore();
  
  const isEdit = !!transaction;

  const getLeafAccounts = (nodes: any[]): any[] => {
    let leaves: any[] = [];
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
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
    const type = formData.get("type") as string;
    const is_income = type === "income";

    const transactionData = {
      account: formData.get("account") as string, // O backend espera o ID da conta no campo 'account'
      description: formData.get("description") as string,
      amount: amountValue,
      is_income: is_income,
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
      category: formData.get("category") as string || null,
      is_recurring: isRecurring,
      recurrence_interval: isRecurring ? (formData.get("recurrence_interval") as string) : undefined,
    };

    if (isEdit && transaction) {
      await updateTransaction(transaction.id, transactionData);
    } else {
      await addTransaction(transactionData as any);
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
              <select 
                id="type" 
                name="type" 
                defaultValue={transaction ? (transaction.is_income ? "income" : "expense") : "expense"}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="expense">Despesa (-)</option>
                <option value="income">Receita (+)</option>
              </select>
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
            <select 
              id="account" 
              name="account" 
              required 
              defaultValue={transaction?.account}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="" disabled>Selecione uma conta</option>
              {leafAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoria de Orçamento</Label>
            <select 
              id="category" 
              name="category" 
              defaultValue={transaction?.category || ""}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">Sem categoria</option>
              {categoryGroups.map(group => (
                <optgroup key={group.id} label={group.name}>
                  {(group.children || []).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
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
                  <select 
                    id="recurrence_interval" 
                    name="recurrence_interval" 
                    defaultValue="monthly"
                    className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                    <option value="yearly">Anualmente</option>
                  </select>
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
