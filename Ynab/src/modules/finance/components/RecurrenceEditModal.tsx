import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangle, CalendarRange, CheckSquare } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scope: "single" | "future") => void;
}

export const RecurrenceEditModal = ({ open, onOpenChange, onConfirm }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] glass border-border/60 p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
            <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
            <span>Ajustar Transação Recorrente</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-2">
            Você alterou o valor de uma transação agendada/recorrente. Como deseja salvar esta alteração?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-5">
          <button
            type="button"
            className="flex flex-col items-start p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-primary/5 hover:border-primary/40 text-left gap-1 transition-all"
            onClick={() => onConfirm("single")}
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <CheckSquare className="h-4.5 w-4.5 text-primary" />
              Aplicar apenas a esta transação (Opção A)
            </div>
            <div className="text-xs text-muted-foreground pl-6.5 leading-relaxed">
              Aplica o novo valor e a regra de rateio APENAS para esta transação específica deste mês. As recorrências futuras não serão alteradas.
            </div>
          </button>

          <button
            type="button"
            className="flex flex-col items-start p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-primary/5 hover:border-primary/40 text-left gap-1 transition-all"
            onClick={() => onConfirm("future")}
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <CalendarRange className="h-4.5 w-4.5 text-emerald-500" />
              Atualizar modelo para os meses futuros (Opção B)
            </div>
            <div className="text-xs text-muted-foreground pl-6.5 leading-relaxed">
              Atualiza o modelo recorrente principal. Todos os lançamentos dos meses futuros seguirão este novo valor e regra de rateio.
            </div>
          </button>
        </div>

        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl text-xs font-semibold">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
