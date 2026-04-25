import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccountStore } from "@/store/useAccountStore";
import { AccountNode } from "@/types";
import { toast } from "sonner";
import { AddAccountModal } from "./AddAccountModal";

interface AccountActionsProps {
  account: AccountNode;
}

export const AccountActions = ({ account }: AccountActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(account.name);
  const [editedBalance, setEditedBalance] = useState(account.balance);
  const { updateNode, deleteNode } = useAccountStore();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateNode(account.id, { name: editedName, balance: editedBalance });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${account.name}" e todas as suas sub-contas e transações?`)) {
      await deleteNode(account.id);
      toast.success(`Conta "${account.name}" excluída.`);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDelete} className="text-red-500">
            <Trash className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AddAccountModal parentAccount={account}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent DropdownMenu closing */}
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Sub-conta
            </DropdownMenuItem>
          </AddAccountModal>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-border/60">
          <DialogHeader>
            <DialogTitle>Editar Conta: {account.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="balance">Saldo Atual</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={editedBalance}
                onChange={(e) => setEditedBalance(parseFloat(e.target.value) || 0)}
                className="bg-background/50"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full gradient-primary">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};