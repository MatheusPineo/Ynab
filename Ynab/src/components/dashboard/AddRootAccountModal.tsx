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

export const AddRootAccountModal = () => {
  const [open, setOpen] = useState(false);
  const { addNode } = useAccountStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const balance = parseFloat(formData.get("balance") as string) || 0;

    await addNode("root", { // Passa "root" como parentId para criar uma conta raiz
      name: formData.get("name") as string,
      balance: balance,
    });

    toast.success(`Conta raiz "${formData.get("name") as string}" criada!`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/60">
        <DialogHeader>
          <DialogTitle>Nova Conta Raiz</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input id="name" name="name" placeholder="Ex: Conta Corrente, Poupança..." required className="bg-background/50" />
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
