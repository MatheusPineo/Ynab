import { useState, useMemo } from "react";
import { useAccountStore, DistributionTemplate, DistributionTemplateItem } from "@/modules/finance/store/useAccountStore";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";
import { 
  Plus, 
  Trash, 
  ArrowDown, 
  Percent, 
  DollarSign 
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/shared/lib/currency-utils";

interface TemplateBuilderFormProps {
  template: DistributionTemplate | null;
  onSave: () => void;
  onCancel: () => void;
}

interface LocalRow {
  id?: string;
  destinationType: "account" | "category";
  account: string;
  category: string;
  type: "fixed" | "percentage";
  value: number;
}

export const TemplateBuilderForm = ({ template, onSave, onCancel }: TemplateBuilderFormProps) => {
  const { 
    tree, 
    categoryGroups, 
    saveDistributionTemplate 
  } = useAccountStore();

  const [name, setName] = useState(template?.name || "");
  const [triggerPayee, setTriggerPayee] = useState(template?.trigger_payee || "");
  const [fallbackCategory, setFallbackCategory] = useState<string>(
    template?.fallback_category ? String(template.fallback_category) : "none"
  );

  // Mapear itens salvos para estado local do formulário
  const [rows, setRows] = useState<LocalRow[]>(() => {
    if (template && template.items && template.items.length > 0) {
      return template.items.map((it: any) => {
        const isFixed = it.fixed_amount !== null && it.fixed_amount !== undefined;
        return {
          id: it.id,
          destinationType: it.category ? "category" : "account",
          account: it.account ? String(it.account) : "",
          category: it.category ? String(it.category) : "",
          type: isFixed ? "fixed" : "percentage",
          value: isFixed ? Number(it.fixed_amount) : (it.percentage ? Number(it.percentage) : 0)
        };
      });
    }
    return [{ destinationType: "category", account: "", category: "", type: "percentage", value: 0 }];
  });

  const [simulatedAmount, setSimulatedAmount] = useState<number>(0);

  // Aplanar contas para o select
  const accountsFlat = useMemo(() => {
    const list: any[] = [];
    const walk = (nodes: any[]) => {
      nodes.forEach(n => {
        list.push(n);
        if (n.children) walk(n.children);
      });
    };
    walk(tree);
    return list;
  }, [tree]);

  // Aplanar categorias para o select
  const categoriesFlat = useMemo(() => {
    const list: any[] = [];
    categoryGroups.forEach(group => {
      if (group.children) {
        group.children.forEach(cat => {
          list.push({ ...cat, groupName: group.name });
        });
      }
    });
    return list;
  }, [categoryGroups]);

  // Simulador reativo de Cascade Logic
  const simulationResults = useMemo(() => {
    const totalPercentages = rows
      .filter(r => r.type === "percentage")
      .reduce((acc, r) => acc + r.value, 0);
    const isValid = totalPercentages <= 100;

    if (simulatedAmount <= 0) {
      return { allocations: [], leftover: 0, isValid, totalPercentages };
    }

    let remainder = simulatedAmount;
    const allocations: { label: string; amount: number; type: "fixed" | "percentage" }[] = [];

    // 1. Valores Fixos
    rows.forEach(row => {
      if (row.type === "fixed") {
        const destName = row.destinationType === "category"
          ? categoriesFlat.find(c => String(c.id) === row.category)?.name || "Categoria não selecionada"
          : accountsFlat.find(a => String(a.id) === row.account)?.name || "Conta não selecionada";
        
        const allocated = Math.min(row.value, remainder);
        allocations.push({
          label: destName,
          amount: allocated,
          type: "fixed"
        });
        remainder -= allocated;
      }
    });

    // 2. Percentuais em cascata sequencial
    let percentRemainder = remainder;
    rows.forEach(row => {
      if (row.type === "percentage") {
        const destName = row.destinationType === "category"
          ? categoriesFlat.find(c => String(c.id) === row.category)?.name || "Categoria não selecionada"
          : accountsFlat.find(a => String(a.id) === row.account)?.name || "Conta não selecionada";
        
        const allocated = (row.value / 100) * percentRemainder;
        const finalAllocated = Math.min(allocated, percentRemainder);
        allocations.push({
          label: destName,
          amount: finalAllocated,
          type: "percentage"
        });
        percentRemainder -= finalAllocated;
      }
    });

    return {
      allocations,
      leftover: percentRemainder,
      isValid,
      totalPercentages
    };
  }, [simulatedAmount, rows, categoriesFlat, accountsFlat]);

  const handleAddRow = () => {
    setRows([...rows, { destinationType: "category", account: "", category: "", type: "percentage", value: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof LocalRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    // Limpar o campo oposto se mudar o destinationType
    if (field === "destinationType") {
      if (value === "category") newRows[index].account = "";
      if (value === "account") newRows[index].category = "";
    }
    setRows(newRows);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("O nome do modelo é obrigatório.");
      return;
    }

    const validRows = rows.filter(r => (r.destinationType === "category" ? r.category : r.account));
    if (validRows.length === 0) {
      toast.error("Adicione pelo menos uma linha de distribuição válida.");
      return;
    }

    const formattedItems = validRows.map(r => ({
      id: r.id,
      account: r.destinationType === "account" ? Number(r.account) : null,
      category: r.destinationType === "category" ? Number(r.category) : null,
      percentage: r.type === "percentage" ? Number(r.value.toFixed(2)) : null,
      fixed_amount: r.type === "fixed" ? Number(r.value.toFixed(2)) : null
    }));

    await saveDistributionTemplate({
      id: template?.id,
      name,
      trigger_payee: triggerPayee || null,
      fallback_category: fallbackCategory === "none" ? null : Number(fallbackCategory),
      items: formattedItems as any[]
    });

    onSave();
  };

  return (
    <div className="space-y-6">
      {/* Campos Superiores */}
      <div className="grid gap-6 sm:grid-cols-2 bg-muted/10 p-5 rounded-2xl border border-border/40">
        <div className="sm:col-span-2 space-y-2">
          <Label className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Nome da Regra</Label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Salário Split Egberto"
            className="bg-background/50 h-12 px-4 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Gatilho de Pagador (Opcional)</Label>
          <Input 
            value={triggerPayee} 
            onChange={(e) => setTriggerPayee(e.target.value)}
            placeholder="Ex: EGBERTO CORP"
            className="bg-background/50 h-12 px-4 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Categoria de Sobra (Fallback)</Label>
          <Select value={fallbackCategory} onValueChange={setFallbackCategory}>
            <SelectTrigger className="h-12 px-4 bg-background/50 rounded-xl">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="glass">
              <SelectItem value="none">Deixar no RTA (Sem Fallback)</SelectItem>
              {categoriesFlat.map(cat => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.groupName} → {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linhas de Cascata Dinâmicas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="font-black text-sm text-foreground">Distribuição em Cascata</Label>
            <p className="text-[10px] text-muted-foreground max-w-sm">
              As regras são processadas de cima para baixo. Valores fixos rodam primeiro; percentuais aplicam sobre o saldo restante.
            </p>
          </div>
          <Button 
            onClick={handleAddRow}
            size="sm"
            variant="outline"
            className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 h-8 font-bold text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Destino
          </Button>
        </div>

        <div className="space-y-2 relative pr-1">
          {rows.map((row, idx) => (
            <div key={idx} className="flex flex-col">
              {idx > 0 && (
                <div className="flex justify-center my-6 text-muted-foreground/40">
                  <ArrowDown className="h-4 w-4 animate-pulse" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end p-5 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/20 transition-all">
                {/* Tipo de Destino: Conta ou Categoria */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Destino</Label>
                  <Select 
                    value={row.destinationType} 
                    onValueChange={(v: "account" | "category") => handleRowChange(idx, "destinationType", v)}
                  >
                    <SelectTrigger className="h-11 px-4 bg-background/50 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="category">Categoria</SelectItem>
                      <SelectItem value="account">Conta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seletor do Destino */}
                <div className="md:col-span-4 space-y-2">
                  <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">
                    {row.destinationType === "category" ? "Categoria" : "Conta"}
                  </Label>
                  {row.destinationType === "category" ? (
                    <Select 
                      value={row.category} 
                      onValueChange={(v) => handleRowChange(idx, "category", v)}
                    >
                      <SelectTrigger className="h-11 px-4 bg-background/50 rounded-xl">
                        <SelectValue placeholder="Selecione a categoria..." />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        {categoriesFlat.map(cat => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.groupName} → {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select 
                      value={row.account} 
                      onValueChange={(v) => handleRowChange(idx, "account", v)}
                    >
                      <SelectTrigger className="h-11 px-4 bg-background/50 rounded-xl">
                        <SelectValue placeholder="Selecione a conta..." />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        {accountsFlat.map(acc => (
                          <SelectItem key={acc.id} value={String(acc.id)}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Tipo de Lógica: Fixo vs Percentual */}
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Modo de Alocação</Label>
                  <div className="grid grid-cols-2 rounded-xl p-0.5 bg-background/50 border border-border/40 h-11">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRowChange(idx, "type", "fixed")}
                      className={`h-full rounded-lg text-[10px] font-bold px-0 ${
                        row.type === "fixed" 
                          ? "bg-primary text-primary-foreground shadow animate-in fade-in zoom-in-95 duration-100" 
                          : "text-muted-foreground"
                      }`}
                    >
                      <DollarSign className="h-3 w-3 mr-0.5" /> Fixo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRowChange(idx, "type", "percentage")}
                      className={`h-full rounded-lg text-[10px] font-bold px-0 ${
                        row.type === "percentage" 
                          ? "bg-primary text-primary-foreground shadow animate-in fade-in zoom-in-95 duration-100" 
                          : "text-muted-foreground"
                      }`}
                    >
                      <Percent className="h-3 w-3 mr-0.5" /> Porcent.
                    </Button>
                  </div>
                </div>

                {/* Valor */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Valor / %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={row.value || ""}
                    onChange={(e) => handleRowChange(idx, "value", parseFloat(e.target.value) || 0)}
                    placeholder={row.type === "fixed" ? "0,00" : "0%"}
                    className="h-11 px-4 bg-background/50 rounded-xl"
                  />
                </div>

                {/* Ações */}
                <div className="md:col-span-1 flex justify-end pb-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(idx)}
                    className="h-11 w-11 text-rose-400 hover:bg-rose-400/10 rounded-xl"
                    disabled={rows.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção de Simulação de Regra */}
      <div className="bg-muted/10 p-5 rounded-2xl border border-border/40 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-black text-sm text-foreground">Simular Regra</Label>
          {!simulationResults.isValid && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Erro: Porcentagens somam {simulationResults.totalPercentages}% (Máx 100%)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Simular recebimento de</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">€</span>
              <Input
                type="number"
                value={simulatedAmount || ""}
                onChange={(e) => setSimulatedAmount(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="pl-7 h-9 bg-background/50 rounded-xl"
              />
            </div>
          </div>
        </div>

        {simulatedAmount > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/10">
            <Label className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Resultado da Simulação</Label>
            <div className="grid gap-2">
              {simulationResults.allocations.map((alloc, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-background/40 border border-border/20">
                  <span className="text-muted-foreground font-medium">{alloc.label}</span>
                  <span className="font-black text-primary">
                    {formatMoney(alloc.amount, "EUR")}
                  </span>
                </div>
              ))}
              
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <span className="font-bold text-primary">
                  {fallbackCategory !== "none" 
                    ? `Sobra para Fallback (${categoriesFlat.find(c => String(c.id) === fallbackCategory)?.name || "Fallback"})`
                    : "Sobra não atribuída (Pronto para Alocar / RTA)"}
                </span>
                <span className="font-black text-primary">
                  {formatMoney(simulationResults.leftover, "EUR")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botões de Ação do Form */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/20">
        <Button variant="ghost" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!simulationResults.isValid}
          className="gradient-primary px-8 rounded-xl font-bold shadow-glow"
        >
          {template ? "Salvar Modelo" : "Criar Modelo"}
        </Button>
      </div>
    </div>
  );
};
