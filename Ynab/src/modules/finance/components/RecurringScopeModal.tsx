import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle, CalendarClock, CalendarDays, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: "edit" | "delete";
  onConfirm: (scope: "single" | "future" | "all") => void;
}

export const RecurringScopeModal = ({ open, onOpenChange, actionType, onConfirm }: Props) => {
  const isDelete = actionType === "delete";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {isDelete ? "Excluir transação recorrente" : "Editar transação recorrente"}
          </DialogTitle>
          <DialogDescription>
            Esta transação faz parte de uma série recorrente. Como você deseja {isDelete ? "excluir" : "editar"}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-start p-4 h-auto border-border/60 hover:bg-primary/5 text-left gap-1"
            onClick={() => onConfirm("single")}
          >
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Apenas esta
            </div>
            <div className="text-xs text-muted-foreground pl-6 whitespace-normal">
              {isDelete 
                ? "Apenas esta ocorrência será removida. As futuras continuarão sendo geradas." 
                : "Apenas esta ocorrência será alterada. As futuras manterão os dados originais."}
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-start p-4 h-auto border-border/60 hover:bg-primary/5 text-left gap-1"
            onClick={() => onConfirm("future")}
          >
            <div className="flex items-center gap-2 font-semibold">
              <CalendarClock className="h-4 w-4 text-primary" />
              Esta e as futuras
            </div>
            <div className="text-xs text-muted-foreground pl-6 whitespace-normal">
              {isDelete 
                ? "Esta ocorrência e todas as futuras serão canceladas. O histórico anterior será mantido." 
                : "Esta ocorrência e todas as futuras serão alteradas. O histórico anterior não será afetado."}
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-start p-4 h-auto border-border/60 hover:bg-primary/5 text-left gap-1"
            onClick={() => onConfirm("all")}
          >
            <div className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              Todas
            </div>
            <div className="text-xs text-muted-foreground pl-6 whitespace-normal">
              {isDelete 
                ? "Todas as ocorrências, passadas e futuras, serão completamente removidas." 
                : "Todas as ocorrências, passadas e futuras, serão atualizadas para refletir estas mudanças."}
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
