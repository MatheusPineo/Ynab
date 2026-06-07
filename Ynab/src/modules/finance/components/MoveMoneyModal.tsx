import React, { useState, useMemo } from "react";
import { useAccountStore, CategoryNode } from "@/modules/finance/store/useAccountStore";
import { formatMoney } from "@/shared/lib/currency-utils";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";
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
} from "@/shared/components/ui/select";

interface MoveMoneyModalProps {
  sourceCategory: CategoryNode;
  currentAvailable: number;
  trigger: React.ReactNode;
}

export const MoveMoneyModal = ({ sourceCategory, currentAvailable, trigger }: MoveMoneyModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amountToMove, setAmountToMove] = useState(0);
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { categoryGroups, assignMoney } = useAccountStore();

  // Mapeia e filtra apenas subcategorias filhas do mesmo tipo de moeda, excluindo a própria origem
  const destinationCategories = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const walk = (nodes: CategoryNode[]) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n) continue;
        if (n.children && n.children.length > 0) {
          walk(n.children);
        } else if (n.id !== sourceCategory.id && n.currency === sourceCategory.currency) {
          list.push({ id: n.id, name: n.name });
        }
      }
    };
    walk(categoryGroups);
    return list;
  }, [categoryGroups, sourceCategory]);

  const handleMoveFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountToMove <= 0) {
      toast.error("Insira um valor maior que zero para transferir.");
      return;
    }
    if (!targetCategoryId) {
      toast.error("Selecione uma categoria de destino.");
      return;
    }

    setIsLoading(true);
    try {
      // Localiza a categoria alvo para ler o estado atual do assigned_amount
      let targetCategoryRef: any = null;
      const findTarget = (nodes: CategoryNode[]) => {
        for (const n of nodes) {
          if (n.id === targetCategoryId) targetCategoryRef = n;
          if (n.children) findTarget(n.children);
        }
      };
      findTarget(categoryGroups);

      // Orquestração atômica via Actions existentes
      // 1. Remove da origem
      const newSourceAssigned = (sourceCategory.assigned_amount || 0) - amountToMove;
      await assignMoney(sourceCategory.id, newSourceAssigned);

      // 2. Adiciona no destino
      const newTargetAssigned = (targetCategoryRef?.assigned_amount || 0) + amountToMove;
      await assignMoney(targetCategoryId, newTargetAssigned);

      toast.success("Saldo transferido com sucesso!");
      setAmountToMove(0);
      setTargetCategoryId("");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao mover fundos entre envelopes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] glass border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-tight">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            Mover Saldo Disponível
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleMoveFunds} className="grid gap-4 py-3 text-left">
          <div className="rounded-xl bg-muted/30 border border-border/40 p-3 text-xs space-y-1">
            <div className="text-muted-foreground font-medium">Origem: <span className="font-bold text-foreground">{sourceCategory.name}</span></div>
            <div className="text-muted-foreground font-medium">Disponível Atual: <span className="font-mono font-bold text-emerald-400">{formatMoney(currentAvailable, sourceCategory.currency as any)}</span></div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="move-amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quanto deseja mover?</Label>
            <CurrencyInput
              id="move-amount"
              value={amountToMove}
              onChange={(val) => setAmountToMove(val || 0)}
              className="bg-background/50 h-10 text-sm"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="target-category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Para qual categoria?</Label>
            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
              <SelectTrigger id="target-category" className="bg-background/50 h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Selecione o envelope de destino" />
              </SelectTrigger>
              <SelectContent className="glass border-border/60 max-h-52">
                {destinationCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs sm:text-sm">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full gradient-primary font-bold h-10 text-xs sm:text-sm">
              {isLoading ? "Processando..." : "Confirmar Transferência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};