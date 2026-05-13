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
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Plus, CreditCard, Landmark } from "lucide-react";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { authenticatedFetch } from "@/shared/lib/api";
import { toast } from "sonner";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";

export const AddRootAccountModal = () => {
  const [open, setOpen] = useState(false);
  const [accountType, setAccountType] = useState<"checking" | "credit_card">("checking");
  const [excludeFromTotals, setExcludeFromTotals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNode, fetchAccounts } = useAccountStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);

    try {
      if (accountType === "credit_card") {
        // Criar Cartão de Crédito e Conta YNAB via endpoint dedicado
        const payload = {
          name: formData.get("name") as string,
          credit_limit: parseFloat(formData.get("credit_limit") as string) || 0,
          closing_day: parseInt(formData.get("closing_day") as string, 10) || 20,
          due_day: parseInt(formData.get("due_day") as string, 10) || 28,
          currency: formData.get("currency") as string,
        };

        const response = await authenticatedFetch("/credit-cards/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Erro ao cadastrar cartão de crédito");

        toast.success(`💳 Cartão de Crédito "${payload.name}" cadastrado com sucesso!`);
        await fetchAccounts();
      } else {
        // Criar Conta Raiz Normal
        const balance = parseFloat(formData.get("balance") as string) || 0;
        const ceilingInput = formData.get("ceiling") as string;
        const ceiling = ceilingInput ? parseFloat(ceilingInput) : null;

        await addNode("root", {
          name: formData.get("name") as string,
          balance: balance,
          currency: formData.get("currency") as any,
          ceiling: ceiling,
          exclude_from_totals: excludeFromTotals,
        });

        toast.success(`🏦 Conta "${formData.get("name") as string}" criada!`);
      }

      setExcludeFromTotals(false);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary rounded-xl font-bold px-4 h-10 shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] glass border-border/60 rounded-3xl p-6 shadow-glow overflow-hidden">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-foreground">Cadastrar Nova Conta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2 relative">
          <div className="grid gap-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Tipo da Conta</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType("checking")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  accountType === "checking"
                    ? "bg-primary/10 border-primary text-primary shadow-soft"
                    : "bg-muted/15 border-border/40 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <Landmark className="h-4 w-4" /> Corrente / Poupança
              </button>
              <button
                type="button"
                onClick={() => setAccountType("credit_card")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  accountType === "credit_card"
                    ? "bg-primary/10 border-primary text-primary shadow-soft"
                    : "bg-muted/15 border-border/40 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <CreditCard className="h-4 w-4" /> Cartão de Crédito
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Nome da Conta / Cartão</Label>
            <Input id="name" name="name" placeholder={accountType === "checking" ? "Ex: Conta Corrente, Investimentos..." : "Ex: Nubank Ultravioleta, Itaú Black..."} required className="bg-muted/15 border-border/40 rounded-xl h-11 text-sm font-medium" />
          </div>

          {accountType === "checking" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="balance" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Saldo Inicial</Label>
                <Input id="balance" name="balance" type="number" step="0.01" placeholder="0.00" className="bg-muted/15 border-border/40 rounded-xl h-11 font-mono font-bold text-sm" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ceiling" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Teto (Limite Opcional)</Label>
                <Input id="ceiling" name="ceiling" type="number" step="0.01" placeholder="Ex: 1000.00" className="bg-muted/15 border-border/40 rounded-xl h-11 font-mono text-sm" />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="credit_limit" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Limite Total do Cartão</Label>
                <Input id="credit_limit" name="credit_limit" type="number" step="0.01" min="0.01" placeholder="Ex: 15000.00" required className="bg-muted/15 border-border/40 rounded-xl h-11 font-mono font-bold text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="closing_day" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Dia de Fechamento</Label>
                  <Input id="closing_day" name="closing_day" type="number" min="1" max="31" defaultValue="20" required className="bg-muted/15 border-border/40 rounded-xl h-11 font-mono text-sm" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due_day" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Dia de Vencimento</Label>
                  <Input id="due_day" name="due_day" type="number" min="1" max="31" defaultValue="28" required className="bg-muted/15 border-border/40 rounded-xl h-11 font-mono text-sm" />
                </div>
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="currency" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Moeda</Label>
            <Select name="currency" defaultValue="BRL">
              <SelectTrigger className="bg-muted/15 border-border/40 rounded-xl h-11 text-sm font-medium">
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="USD">Dólar ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accountType === "checking" && (
            <div className="flex items-center space-x-3 bg-muted/20 border border-border/40 px-3.5 py-3 rounded-xl mt-1">
              <input
                id="root_exclude_from_totals"
                type="checkbox"
                checked={excludeFromTotals}
                onChange={(e) => setExcludeFromTotals(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-border/60 text-primary focus:ring-primary bg-background/50 cursor-pointer accent-primary shrink-0"
              />
              <div className="space-y-0.5 min-w-0">
                <Label htmlFor="root_exclude_from_totals" className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5 select-none">
                  Desconsiderar nos Totais
                  <HelpTooltip content="Oculta o saldo desta conta dos somatórios de Net Worth e do dashboard global." />
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border/20 mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-border/60 text-xs font-bold">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="gradient-primary rounded-xl font-bold text-xs shadow-glow">
              {isSubmitting ? "Cadastrando..." : "Confirmar Cadastro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRootAccountModal;
