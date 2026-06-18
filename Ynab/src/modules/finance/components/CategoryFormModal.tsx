import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { toast } from "sonner";
import { Loader2, FolderPlus, Edit2 } from "lucide-react";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  type: "group" | "category";
  initialName?: string;
  targetId?: string; // groupId if create category, or cat/groupId if edit
}

export const CategoryFormModal = ({ open, onOpenChange, mode, type, initialName = "", targetId }: CategoryFormModalProps) => {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addCategory, addCategoryGroup, updateCategory } = useAccountStore();

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        if (type === "group") {
          await addCategoryGroup(name.trim());
          toast.success("Grupo criado com sucesso!");
        } else {
          if (!targetId) throw new Error("ID do grupo pai no fornecido");
          await addCategory(targetId, name.trim());
          toast.success("Categoria criada com sucesso!");
        }
      } else {
        if (!targetId) throw new Error("ID do alvo no fornecido");
        await updateCategory(targetId, { name: name.trim() });
        toast.success(`${type === 'group' ? 'Grupo' : 'Categoria'} atualizado com sucesso!`);
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGroup = type === "group";
  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass border-border/60">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              {isCreate ? <FolderPlus className="h-5 w-5 text-primary" /> : <Edit2 className="h-5 w-5 text-primary" />}
              {isCreate ? `Novo ${isGroup ? 'Grupo' : 'Envelope'}` : `Editar ${isGroup ? 'Grupo' : 'Envelope'}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isGroup ? "Ex: Moradia" : "Ex: Aluguel"}
                className="bg-background/50 text-sm"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting} className="gradient-primary rounded-xl font-bold">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreate ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
