import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Plus } from "lucide-react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { toast } from "sonner";
import { type AccountNode } from "@/types";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";

interface Props {
  parentAccount: AccountNode;
  children?: React.ReactNode;
}

export const AddAccountModal = ({ parentAccount, children }: Props) => {
  const [open, setOpen] = useState(false);
  const [excludeFromTotals, setExcludeFromTotals] = useState(false);
  const [balance, setBalance] = useState(0);
  const [color, setColor] = useState("#1E293B");
  const { addNode } = useAccountStore();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    addNode(parentAccount?.id || "root", {
      name: formData.get("name") as string,
      balance: balance,
      base: balance, // Default target to same as initial balance
      currency: formData.get("currency") as any,
      exclude_from_totals: excludeFromTotals,
      bank_domain: (formData.get("bank_domain") as string) || "",
      color: color || null,
    });

    toast.success(`Sub-conta criada em "${parentAccount?.name || 'Conta'}"`);
    setExcludeFromTotals(false);
    setBalance(0);
    setColor("#1E293B");
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
      <DialogContent className="sm:max-w-[425px] glass border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Sub-conta em {parentAccount?.name || 'Conta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input id="name" name="name" placeholder="Ex: Mercado, Reserva..." required className="bg-background/50" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bank_domain">Website / Domínio do Banco</Label>
            <Input id="bank_domain" name="bank_domain" placeholder="Ex: nubank.com.br" className="bg-background/50" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="balance">Saldo Inicial</Label>
            <CurrencyInput id="balance" value={balance} onChange={setBalance} className="bg-background/50 text-left" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select name="currency" defaultValue={parentAccount?.currency || "EUR"}>
              <SelectTrigger className="bg-background/50 border-border/60 rounded-xl">
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sub_color" className="flex items-center gap-1.5">
              Cor do Cartão
              <HelpTooltip content="Cor personalizada para o background do card desta conta." />
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="sub_color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-10 rounded-lg cursor-pointer border-2 border-border/60 bg-transparent p-0.5 transition-all hover:border-primary/60 hover:scale-105"
              />
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

          <div className="flex items-center space-x-3 py-1 bg-muted/20 border border-border/40 px-3.5 py-3 rounded-xl">
            <input
              id="sub_exclude_from_totals"
              type="checkbox"
              checked={excludeFromTotals}
              onChange={(e) => setExcludeFromTotals(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-border/60 text-primary focus:ring-primary bg-background/50 cursor-pointer accent-primary shrink-0"
            />
            <div className="space-y-0.5 min-w-0">
              <Label htmlFor="sub_exclude_from_totals" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5 select-none">
                Conta de Acompanhamento (Fora do Orçamento)
                <HelpTooltip content="Oculta o saldo desta conta do orçamento disponível." />
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full gradient-primary">Criar Conta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
