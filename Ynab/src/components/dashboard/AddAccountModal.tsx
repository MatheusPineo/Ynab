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
import { toast } from "sonner";
import { type AccountNode } from "@/data/mockData";

interface Props {
  parentAccount: AccountNode;
  children?: React.ReactNode;
}

export const AddAccountModal = ({ parentAccount, children }: Props) => {
  const [open, setOpen] = useState(false);
  const { addNode } = useAccountStore();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const balance = parseFloat(formData.get("balance") as string) || 0;

    addNode(parentAccount.id, {
      name: formData.get("name") as string,
      balance: balance,
      base: balance, // Default target to same as initial balance
    });

    toast.success(`Sub-conta criada em "${parentAccount.name}"`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/60">
        <DialogHeader>
          <DialogTitle>Nova Sub-conta em {parentAccount.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input id="name" name="name" placeholder="Ex: Mercado, Reserva..." required className="bg-background/50" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="balance">Saldo Inicial</Label>
            <Input id="balance" name="balance" type="number" step="0.01" placeholder="0.00" className="bg-background/50" />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full gradient-primary">Criar Conta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
