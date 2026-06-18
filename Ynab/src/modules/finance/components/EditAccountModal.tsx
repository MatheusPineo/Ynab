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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { toast } from "sonner";
import { type AccountNode } from "@/types";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { Loader2 } from "lucide-react";

interface EditAccountModalProps {
  account: AccountNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditAccountModal = ({ account, open, onOpenChange }: EditAccountModalProps) => {
  const [name, setName] = useState(account.name);
  const [bankDomain, setBankDomain] = useState(account.bank_domain || "");
  const [currency, setCurrency] = useState(account.currency || "EUR");
  const [accountType, setAccountType] = useState(account.account_type || "checking");
  const [excludeFromTotals, setExcludeFromTotals] = useState(account.exclude_from_totals || false);
  const [color, setColor] = useState(account.color || "#1E293B");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateNode } = useAccountStore();

  // Reset form when account changes or modal opens
  useEffect(() => {
    if (open) {
      setName(account.name);
      setBankDomain(account.bank_domain || "");
      setCurrency(account.currency || "EUR");
      setAccountType(account.account_type || "checking");
      setExcludeFromTotals(account.exclude_from_totals || false);
      setColor(account.color || "#1E293B");
    }
  }, [account, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("O nome da conta é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateNode(account.id, {
        name: name.trim(),
        bank_domain: bankDomain.trim(),
        currency: currency as any,
        account_type: accountType as any,
        exclude_from_totals: excludeFromTotals,
        color: color || null,
      });
      onOpenChange(false);
    } catch {
      // Error toast is already shown by the store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] glass border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Editar Conta</DialogTitle>
          <p className="text-xs text-muted-foreground">Altere as informações da conta &quot;{account.name}&quot;.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit_name">Nome da Conta</Label>
            <Input 
              id="edit_name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Nubank, Tesouro Direto..." 
              required 
              className="bg-background/50" 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit_bank_domain">Website / Domínio do Banco</Label>
            <Input 
              id="edit_bank_domain" 
              value={bankDomain} 
              onChange={(e) => setBankDomain(e.target.value)} 
              placeholder="Ex: nubank.com.br" 
              className="bg-background/50" 
            />
            <p className="text-[10px] text-muted-foreground">Usado para exibir o ícone/logotipo do banco no card.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_currency">Moeda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-background/50 border-border/60 rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_account_type">Tipo de Conta</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger className="bg-background/50 border-border/60 rounded-xl">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit_color" className="flex items-center gap-1.5">
              Cor do Cartão
              <HelpTooltip content="Escolha uma cor personalizada para o background do card desta conta no Centro de Controle." />
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  id="edit_color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 rounded-lg cursor-pointer border-2 border-border/60 bg-transparent p-0.5 transition-all hover:border-primary/60 hover:scale-105"
                />
              </div>
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#1E293B"
                maxLength={7}
                className="flex-1 bg-background/50 font-mono text-sm"
              />
              <div
                className="h-10 w-20 rounded-xl border border-white/10 shadow-inner shrink-0"
                style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}bf 100%)` }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-muted/20 border border-border/40 px-3.5 py-3 rounded-xl">
            <input
              id="edit_exclude_from_totals"
              type="checkbox"
              checked={excludeFromTotals}
              onChange={(e) => setExcludeFromTotals(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-border/60 text-primary focus:ring-primary bg-background/50 cursor-pointer accent-primary shrink-0"
            />
            <div className="space-y-0.5 min-w-0">
              <Label htmlFor="edit_exclude_from_totals" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5 select-none">
                Conta de Acompanhamento (Fora do Orçamento)
                <HelpTooltip content="Oculta o saldo desta conta do orçamento disponível e dos totais do dashboard." />
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gradient-primary rounded-xl">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
