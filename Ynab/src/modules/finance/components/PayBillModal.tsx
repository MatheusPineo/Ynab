import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog";
import { GlobalAccountSelector } from "@/shared/components/ui/global-account-selector";

export function PayBillModal({ isOpen, onClose, onConfirm, billName, totalAmount }: any) {
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar {billName}</DialogTitle>
          <DialogDescription>
            Isso irá descontar o valor de todas as subcontas vinculadas às compras. 
            Selecione de qual conta corrente o dinheiro sairá para pagar a fatura de R$ {totalAmount}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Conta de Pagamento</label>
            <GlobalAccountSelector 
              value={selectedAccount} 
              onChange={setSelectedAccount} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm(selectedAccount)} disabled={!selectedAccount}>Confirmar Pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
