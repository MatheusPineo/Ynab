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
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { Loader2 } from "lucide-react";

interface CreateAccountModalProps {
  trigger: React.ReactNode;
}

export const CreateAccountModal = ({ trigger }: CreateAccountModalProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [bankDomain, setBankDomain] = useState("");
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [accountType, setAccountType] = useState("checking");
  const [excludeFromTotals, setExcludeFromTotals] = useState(false);
  const [color, setColor] = useState("#1E293B");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addNode } = useAccountStore();

  const resetForm = () => {
    setName("");
    setBankDomain("");
    setBalance(0);
    setCurrency("EUR");
    setAccountType("checking");
    setExcludeFromTotals(false);
    setColor("#1E293B");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addNode("root", {
        name: name.trim(),
        balance,
        currency: currency as any,
        account_type: accountType as any,
        exclude_from_totals: excludeFromTotals,
        bank_domain: bankDomain.trim(),
        color: color || null,
      });
      resetForm();
      setOpen(false);
    } catch {
      // Error toast is already shown by the store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] glass border-border/60 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Nova Conta</DialogTitle>
          <p className="text-xs text-muted-foreground">Crie uma nova conta bancária para acompanhar seu saldo e transações.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="create_name">Nome da Conta</Label>
            <Input 
              id="create_name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank, Tesouro Direto, Revolut..." 
              required 
              className="bg-background/50" 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create_bank_domain">Website / Domínio do Banco</Label>
            <Input 
              id="create_bank_domain" 
              value={bankDomain}
              onChange={(e) => setBankDomain(e.target.value)}
              placeholder="Ex: nubank.com.br" 
              className="bg-background/50" 
            />
            <p className="text-[10px] text-muted-foreground">O ícone do banco será carregado automaticamente a partir deste domínio.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create_balance">Saldo Inicial</Label>
            <CurrencyInput id="create_balance" value={balance} onChange={setBalance} className="bg-background/50 text-left" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create_currency">Moeda</Label>
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
              <Label htmlFor="create_account_type">Tipo de Conta</Label>
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
            <Label htmlFor="create_color" className="flex items-center gap-1.5">
              Cor do Cartão
              <HelpTooltip content="Escolha uma cor personalizada para o background do card desta conta no Centro de Controle." />
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  id="create_color"
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
              id="create_exclude_from_totals"
              type="checkbox"
              checked={excludeFromTotals}
              onChange={(e) => setExcludeFromTotals(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-border/60 text-primary focus:ring-primary bg-background/50 cursor-pointer accent-primary shrink-0"
            />
            <div className="space-y-0.5 min-w-0">
              <Label htmlFor="create_exclude_from_totals" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5 select-none">
                Conta de Acompanhamento (Fora do Orçamento)
                <HelpTooltip content="Oculta o saldo desta conta do orçamento disponível e dos totais do dashboard." />
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gradient-primary rounded-xl">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
