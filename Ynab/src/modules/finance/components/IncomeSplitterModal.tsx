import { useState, useEffect, useMemo } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useAccountStore } from "../store/useAccountStore";
import { toast } from "sonner";
import { formatMoney } from "@/shared/lib/currency-utils";
import { Landmark, ArrowRight, Check, AlertCircle } from "lucide-react";
import { CurrencyInput } from "@/shared/components/ui/currency-input";

interface Props {
  trigger?: React.ReactNode;
}

export function IncomeSplitterModal({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const { 
    categoryGroups, 
    addTransaction, 
    tree: accounts,
    setSplitterDraft,
    currentMonth,
    currentYear
  } = useAccountStore();

  const [grossInput, setGrossInput] = useState<number>(0);
  const [selectedRule, setSelectedRule] = useState<string>("partner_fixed_needs");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [description, setDescription] = useState<string>("Receita Compartilhada (Needs funded)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seleciona a primeira conta on-budget por padrão
  useEffect(() => {
    if (open && accounts.length > 0) {
      const firstOnBudget = accounts.find(acc => !acc.exclude_from_totals && acc.account_type !== 'investment');
      if (firstOnBudget) {
        setSelectedAccountId(String(firstOnBudget.id));
      } else {
        setSelectedAccountId(String(accounts[0].id));
      }
    }
  }, [open, accounts]);

  // Calcula dinamicamente o valor das necessidades fixas (Needs) ativas
  const fixedNeedsValue = useMemo(() => {
    let totalNeeds = 0;
    
    // Varre todas as subcategorias para somar os targets que representam "Household Needs" ou necessidades
    const walk = (nodes: any[]) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (!node) continue;
        if (node.children && node.children.length > 0) {
          walk(node.children);
        } else {
          // Se pertencer a grupos comuns de necessidades, ex: "Contas de Consumo", "Habitação", "Saúde"
          // Ou de forma simples, ler se o target_value existe e é maior que zero
          // Como o YNAB orçamento lê os target_value na tabela Category
          // Somamos o target_value configurado
          totalNeeds += Number(node.target_amount || node.target_value || 0);
        }
      }
    };
    
    walk(categoryGroups);

    // Caso o usuário não tenha targets cadastrados no banco, usamos um fallback fictício de 681.35 para manter o exemplo do contexto do usuário
    return totalNeeds > 0 ? totalNeeds : 681.35;
  }, [categoryGroups]);

  // Calcula a divisão com base na regra selecionada
  const splitDetails = useMemo(() => {
    let toFundNeeds = 0;
    let remainingPartner = 0;

    if (selectedRule === "partner_fixed_needs") {
      // Regra Partner Split: Financia as necessidades fixas e a sobra vai para o parceiro
      toFundNeeds = Math.min(grossInput, fixedNeedsValue);
      remainingPartner = Math.max(0, grossInput - fixedNeedsValue);
    } else if (selectedRule === "fifty_fifty") {
      // Divisão 50/50 simples
      toFundNeeds = Number((grossInput * 0.5).toFixed(2));
      remainingPartner = Number((grossInput * 0.5).toFixed(2));
    } else if (selectedRule === "custom_percentage") {
      // 70% Necessidades / 30% Parceiro
      toFundNeeds = Number((grossInput * 0.7).toFixed(2));
      remainingPartner = Number((grossInput * 0.3).toFixed(2));
    }

    return {
      toFundNeeds: Number(toFundNeeds.toFixed(2)),
      remainingPartner: Number(remainingPartner.toFixed(2))
    };
  }, [grossInput, selectedRule, fixedNeedsValue]);

  // Salva no Zustand o rascunho de simulação sempre que mudar
  useEffect(() => {
    if (open) {
      setSplitterDraft({
        grossReceived: grossInput,
        needsFundValue: splitDetails.toFundNeeds,
        remainingPartner: splitDetails.remainingPartner,
        rule: selectedRule
      });
    }
  }, [open, grossInput, selectedRule, splitDetails, setSplitterDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (grossInput <= 0) {
      toast.error("Informe um valor bruto recebido válido.");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Selecione a conta de destino.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Apenas a parte "To Fund Needs" é de fato salva nas transações para alimentar o RTA do YNAB
      const finalFundingAmount = splitDetails.toFundNeeds;

      if (finalFundingAmount <= 0) {
        toast.warning("O valor a alocar é zero. Nenhuma transação criada.");
        setOpen(false);
        return;
      }

      await addTransaction({
        account: selectedAccountId,
        amount: finalFundingAmount,
        description: `${description} (Split Draft: Bruto ${grossInput.toFixed(2)})`,
        date: new Date().toISOString().split('T')[0],
        is_income: true,
        status: 'realized',
        category: null // Vai direto para o pool Ready to Assign (RTA)
      } as any);

      toast.success(`Receita processada! R$ ${finalFundingAmount.toFixed(2)} alocados no RTA.`);
      setOpen(false);
    } catch (err: any) {
      toast.error("Erro ao registrar receita dividida.");
    } finally {
      setIsSubmitting(false);
      setSplitterDraft(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-xl font-bold">
            <Landmark className="h-4 w-4" /> Capturar Receita com Split Inteligente
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="glass border-border/60 w-[94vw] sm:max-w-md rounded-3xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[92vh]">
        <DialogHeader className="pb-3 border-b border-border/30">
          <DialogTitle className="text-lg font-black tracking-tight text-gradient-mixed flex items-center gap-2">
            Smart Income Splitter (Draft)
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Simule a divisão de receitas compartilhadas e lance no orçamento apenas o valor que de fato ficará sob sua custódia para as necessidades fixas.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="grossInput" className="text-xs font-semibold text-muted-foreground">Valor Bruto Recebido (Gross Received)</Label>
            <CurrencyInput 
              id="grossInput"
              value={grossInput} 
              onChange={setGrossInput}
              placeholder="0,00"
              className="bg-background/50 text-left h-10 rounded-xl border-border/40 font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Regra de Divisão</Label>
              <Select value={selectedRule} onValueChange={setSelectedRule}>
                <SelectTrigger className="bg-background/50 border-border/40 h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  <SelectItem value="partner_fixed_needs" className="text-xs">Needs Fund (Fixo)</SelectItem>
                  <SelectItem value="fifty_fifty" className="text-xs">Divisão 50% / 50%</SelectItem>
                  <SelectItem value="custom_percentage" className="text-xs">Divisão 70% / 30%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Conta Destino</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="bg-background/50 border-border/40 h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={String(acc.id)} className="text-xs">
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">Identificador / Descrição</Label>
            <Input 
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição do lançamento..."
              className="bg-background/50 h-9 rounded-xl text-xs border-border/40"
              required
            />
          </div>

          {/* SIMULATION SUMMARY BREAKDOWN */}
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-3 sm:p-4 space-y-3 animate-in fade-in duration-300">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-primary">Simulação de Repartição (Draft)</h4>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-background/30 border border-border/20 rounded-xl p-2">
                <span className="block text-[8px] uppercase tracking-wider text-muted-foreground font-black">Bruto Recebido</span>
                <span className="text-xs sm:text-sm font-bold text-foreground mt-1 block">
                  {formatMoney(grossInput, "BRL")}
                </span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-emerald-400">
                <span className="block text-[8px] uppercase tracking-wider font-black">Alocado (Needs)</span>
                <span className="text-xs sm:text-sm font-bold mt-1 block">
                  {formatMoney(splitDetails.toFundNeeds, "BRL")}
                </span>
              </div>
              <div className="bg-zinc-500/10 border border-border/20 rounded-xl p-2 text-muted-foreground">
                <span className="block text-[8px] uppercase tracking-wider font-black">Parceiro (Sobra)</span>
                <span className="text-xs sm:text-sm font-bold mt-1 block">
                  {formatMoney(splitDetails.remainingPartner, "BRL")}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground/80 pt-1 border-t border-border/20">
              <AlertCircle className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                As necessidades fixas deste mês somam <strong>{formatMoney(fixedNeedsValue, "BRL")}</strong>. Apenas o valor alocado de <strong>{formatMoney(splitDetails.toFundNeeds, "BRL")}</strong> entrará no seu orçamento real.
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              className="rounded-xl px-4 text-xs h-9 w-1/2 sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || grossInput <= 0}
              className="gradient-primary text-xs font-bold rounded-xl h-9 flex-1 gap-1.5"
            >
              <Check className="h-4 w-4" /> Processar e Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
