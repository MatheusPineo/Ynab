import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { toast } from "sonner";
import { type AccountNode } from "@/types";
import { Loader2, AlertTriangle } from "lucide-react";
import { formatMoney } from "@/shared/lib/currency-utils";

interface DeleteAccountDialogProps {
  account: AccountNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ account, open, onOpenChange }: DeleteAccountDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteNode } = useAccountStore();

  const childCount = account.children?.length || 0;
  const canConfirm = confirmText === account.name;

  const handleDelete = async () => {
    if (!canConfirm) return;

    setIsDeleting(true);
    try {
      await deleteNode(account.id);
      toast.success(`Conta "${account.name}" excluída com sucesso.`);
      setConfirmText("");
      onOpenChange(false);
    } catch {
      // Error toast is already shown by the store
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText("");
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[460px] glass border-border/60">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-rose-400">
              Excluir Conta
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Você está prestes a excluir permanentemente a conta <strong className="text-foreground">&quot;{account.name}&quot;</strong>.
              </p>
              
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 space-y-1.5">
                <p className="text-rose-400 font-semibold text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Esta ação é irreversível!
                </p>
                <ul className="text-xs space-y-1 text-rose-300/80 list-disc pl-4">
                  <li>Todas as <strong>transações</strong> desta conta serão removidas</li>
                  {childCount > 0 && (
                    <li>As <strong>{childCount} sub-conta(s)</strong> vinculadas também serão excluídas</li>
                  )}
                  <li>O saldo de <strong>{formatMoney(account.balance || 0, account.currency)}</strong> será perdido</li>
                </ul>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  Para confirmar, digite o nome da conta: <strong className="text-foreground font-mono">{account.name}</strong>
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={account.name}
                  className="bg-background/50 font-mono text-sm"
                  autoFocus
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="rounded-xl" disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canConfirm || isDeleting}
            className="rounded-xl bg-rose-600 hover:bg-rose-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Excluindo...
              </>
            ) : (
              "Excluir Permanentemente"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
