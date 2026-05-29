import { useState, useMemo, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/shared/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Label } from "@/shared/components/ui/label";
import { useAccountStore, DistributionTemplate, CategoryNode } from "@/modules/finance/store/useAccountStore";
import { formatMoney } from "@/shared/lib/currency-utils";
import { Split, Plus, Trash, Save } from "lucide-react";
import { toast } from "sonner";


interface EnvelopeRow {
  category: string;
  percentage: number;
  fixed_amount: number;
}

interface DistributionModalProps {
  initialSourceAccount?: string;
  initialAmount?: string;
  sourceTransactionId?: string;
  trigger?: React.ReactNode;
}

export const DistributionModal = ({ initialSourceAccount, initialAmount, sourceTransactionId, trigger }: DistributionModalProps) => {
  const [open, setOpen] = useState(false);
  const { 
    categoryGroups,
    distributionTemplates,
    fetchDistributionTemplates,
    saveDistributionTemplate,
    assignMoney,
    currentMonth,
    currentYear,
    fetchCategoryGroups,
    keepInAccount,
  } = useAccountStore();
  
  const [totalAmount, setTotalAmount] = useState<string>(initialAmount || "");
  const [rows, setRows] = useState<EnvelopeRow[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");

  useEffect(() => {
    if (open) {
      fetchDistributionTemplates();
      setTotalAmount(initialAmount || "");
      setRows([{ category: "", percentage: 0, fixed_amount: 0 }]);
      setTemplateName("");
      setSelectedTemplate("none");
    }
  }, [open, initialAmount, fetchDistributionTemplates]);

  // Flatten all leaf categories for selector
  const leafCategories = useMemo(() => {
    const leaves: { id: string; name: string; groupName: string }[] = [];
    const walk = (nodes: CategoryNode[], parentName = "") => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n) continue;
        if (n.children && n.children.length > 0) {
          walk(n.children, n.name);
        } else {
          leaves.push({ id: n.id, name: n.name, groupName: parentName });
        }
      }
    };
    walk(categoryGroups);
    return leaves;
  }, [categoryGroups]);

  const parsedTotal = parseFloat(totalAmount) || 0;

  const handleRowChange = (index: number, field: keyof EnvelopeRow, value: string) => {
    const newRows = [...rows];
    const row = { ...newRows[index] };

    if (field === "category") {
      row.category = value;
    } else if (field === "percentage") {
      const p = value === "" ? 0 : parseFloat(value);
      row.percentage = isNaN(p) ? 0 : p;
      row.fixed_amount = parsedTotal > 0 ? (parsedTotal * (row.percentage / 100)) : 0;
    } else if (field === "fixed_amount") {
      const amt = value === "" ? 0 : parseFloat(value);
      row.fixed_amount = isNaN(amt) ? 0 : amt;
      row.percentage = parsedTotal > 0 ? (row.fixed_amount / parsedTotal) * 100 : 0;
    }
    
    newRows[index] = row;
    setRows(newRows);
  };

  const allocateRemaining = (index: number) => {
    const allocatedOthers = rows.reduce((acc, r, i) => i === index ? acc : acc + (r.fixed_amount || 0), 0);
    const remaining = Math.max(0, parsedTotal - allocatedOthers);
    handleRowChange(index, "fixed_amount", remaining.toString());
  };

  // Recalculate when total changes
  useEffect(() => {
    if (parsedTotal > 0) {
      const newRows = rows.map(r => ({
        ...r,
        fixed_amount: r.percentage ? (parsedTotal * (r.percentage / 100)) : r.fixed_amount,
        percentage: !r.percentage && r.fixed_amount ? (r.fixed_amount / parsedTotal) * 100 : r.percentage
      }));
      const changed = newRows.some((r, i) => r.fixed_amount !== rows[i].fixed_amount);
      if (changed) setRows(newRows);
    }
  }, [totalAmount]);

  const addRow = () => {
    setRows([...rows, { category: "", percentage: 0, fixed_amount: 0 }]);
  };

  const removeRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const loadTemplate = (id: string) => {
    setSelectedTemplate(id);
    if (id === "none") return;
    
    const t = distributionTemplates.find(t => String(t.id) === String(id));
    if (t) {
      // Map old account-based templates to category rows as best effort
      setRows(t.items.map(item => ({
        category: String(item.account),
        percentage: item.percentage ? Number(item.percentage) : 0,
        fixed_amount: item.fixed_amount ? Number(item.fixed_amount) : 0
      })));
      setTemplateName(t.name);
    }
  };

  const totalAllocated = rows.reduce((acc, r) => acc + (r.fixed_amount || 0), 0);
  const totalPercentage = rows.reduce((acc, r) => acc + (r.percentage || 0), 0);
  const isComplete = Math.abs(totalAllocated - parsedTotal) < 0.05 && parsedTotal > 0;

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    const validRows = rows.filter(r => r.category);
    if (validRows.length === 0) {
      toast.error("Adicione pelo menos um destino com categoria selecionada.");
      return;
    }
    await saveDistributionTemplate({
      id: selectedTemplate !== "none" ? selectedTemplate : undefined,
      name: templateName,
      items: validRows.map(r => ({
        account: Number(r.category),
        percentage: typeof r.percentage === 'number' ? Number(r.percentage.toFixed(2)) : null,
        fixed_amount: typeof r.fixed_amount === 'number' ? Number(r.fixed_amount.toFixed(2)) : null
      }))
    });
  };

  const handleExecute = async () => {
    const validRows = rows.filter(r => r.category && (r.fixed_amount || 0) > 0);
    if (validRows.length === 0) return;

    try {
      // Distribute to envelopes: update MonthlyBudget for each category
      for (const row of validRows) {
        // Get current assigned amount for this category
        const findCat = (nodes: CategoryNode[]): CategoryNode | undefined => {
          for (const n of nodes) {
            if (String(n.id) === String(row.category)) return n;
            if (n.children) {
              const found = findCat(n.children);
              if (found) return found;
            }
          }
        };
        const cat = findCat(categoryGroups);
        const currentAssigned = cat?.assigned_amount || 0;
        const newAmount = currentAssigned + Number(row.fixed_amount.toFixed(2));
        
        await assignMoney(row.category, newAmount);
      }

      // Mark the source transaction as distributed if applicable
      if (sourceTransactionId) {
        await keepInAccount(sourceTransactionId);
      }

      await fetchCategoryGroups();
      toast.success("Receita distribuída para os envelopes!");
      setOpen(false);
    } catch (e) {
      // Error handled in store
    }
  };

  const getCategoryName = (id: string) => {
    const cat = leafCategories.find(c => c.id === id);
    return cat ? `${cat.groupName} → ${cat.name}` : "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-2">
            <Split className="h-4 w-4" /> Distribuir para Envelopes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass border-border/60 w-[94vw] sm:max-w-2xl rounded-2xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[92vh]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl font-bold">Distribuição para Envelopes</DialogTitle>
          <p className="text-xs text-muted-foreground">Distribua a receita diretamente para os seus envelopes de orçamento (categorias).</p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-5">
          {/* Total Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-semibold text-muted-foreground">Valor Total a Distribuir</Label>
            <CurrencyInput 
              placeholder="Ex: 1400.00" 
              value={parseFloat(totalAmount) || 0} 
              onChange={(val) => setTotalAmount(String(val))}
              className="bg-background/50 h-10 rounded-xl text-xs sm:text-sm border-border/40 text-left"
            />
          </div>

          {/* Templates */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-4">
            <Label className="text-xs sm:text-sm font-bold text-foreground">Regras de Divisão (Modelos)</Label>
            <Select value={selectedTemplate} onValueChange={loadTemplate}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs bg-background/50 rounded-xl border-border/40">
                <SelectValue placeholder="Carregar Modelo..." />
              </SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="none" className="text-xs">Nenhum</SelectItem>
                {distributionTemplates.map(t => (
                  <SelectItem key={t.id} value={String(t.id)} className="text-xs">{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Envelope Rows */}
          <div className="space-y-3 max-h-[36vh] sm:max-h-[42vh] overflow-y-auto pr-1 py-1">
            {rows.length > 0 && (
              <div className="hidden sm:flex items-center gap-3 px-1 text-xs font-semibold text-muted-foreground">
                <div className="flex-1">Categoria (Envelope)</div>
                <div className="w-24 text-right">Porcentagem (%)</div>
                <div className="w-32 text-right">Valor (€)</div>
                <div className="w-16 text-center">Ações</div>
              </div>
            )}

            {rows.map((row, idx) => (
              <div key={idx} className="animate-in fade-in duration-200">
                {/* Desktop layout */}
                <div className="hidden sm:flex items-center gap-3 p-1">
                  <div className="flex-1">
                    <Select value={row.category} onValueChange={(v) => handleRowChange(idx, "category", v)}>
                      <SelectTrigger className="h-9 text-xs bg-background/50 rounded-xl border-border/40">
                        <SelectValue placeholder="Selecione a categoria..." />
                      </SelectTrigger>
                      <SelectContent className="glass border-border/60 max-h-60 overflow-y-auto">
                        {leafCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs">
                            <span className="text-muted-foreground/60">{cat.groupName} →</span> {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="%"
                      className="h-9 bg-background/50 text-right rounded-xl text-xs border-border/40" 
                      value={row.percentage || ""} 
                      onChange={(e) => handleRowChange(idx, "percentage", e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <CurrencyInput
                      placeholder="Valor"
                      className="h-9 bg-background/50 text-right rounded-xl text-xs border-border/40" 
                      value={row.fixed_amount || 0} 
                      onChange={(val) => handleRowChange(idx, "fixed_amount", String(val))}
                    />
                  </div>
                  <div className="w-16 flex items-center justify-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full" 
                      onClick={() => removeRow(idx)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full" 
                      title="Alocar restante"
                      onClick={() => allocateRemaining(idx)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="flex sm:hidden flex-col gap-3 p-3 rounded-xl border border-border/40 bg-background/25">
                  <div className="flex items-center justify-between border-b border-border/10 pb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Envelope #{idx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-[10px] text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 gap-1 rounded-lg px-2" 
                        onClick={() => allocateRemaining(idx)}
                      >
                        <Plus className="h-3 w-3" /> Alocar Restante
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-full" 
                        onClick={() => removeRow(idx)}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 col-span-full">
                    <Label className="text-[9px] text-muted-foreground uppercase font-black">Categoria (Envelope)</Label>
                    <Select value={row.category} onValueChange={(v) => handleRowChange(idx, "category", v)}>
                      <SelectTrigger className="h-9 text-xs bg-background/50 rounded-lg border-border/40">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="glass border-border/60 max-h-60 overflow-y-auto">
                        {leafCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs">
                            <span className="text-muted-foreground/60">{cat.groupName} →</span> {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground uppercase font-black">Porcentagem (%)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Ex: 50"
                        className="h-9 bg-background/50 text-right rounded-lg text-xs border-border/40" 
                        value={row.percentage || ""} 
                        onChange={(e) => handleRowChange(idx, "percentage", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground uppercase font-black">Valor (€)</Label>
                      <CurrencyInput
                        placeholder="Ex: 150.00"
                        className="h-9 bg-background/50 text-right rounded-lg text-xs border-border/40" 
                        value={row.fixed_amount || 0} 
                        onChange={(val) => handleRowChange(idx, "fixed_amount", String(val))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={addRow} className="w-fit text-primary hover:text-primary hover:bg-primary/10 rounded-xl px-3 h-9 text-xs">
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar Envelope
          </Button>

          {/* Summary */}
          <div className="rounded-xl bg-muted/20 p-3 sm:p-4 border border-border/40 space-y-1.5">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">Total Alocado:</span>
              <span className={`font-black ${isComplete ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatMoney(totalAllocated, "EUR")} ({totalPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium">Restante Disponível:</span>
              <span className="font-black text-foreground">
                {formatMoney(Math.max(0, parsedTotal - totalAllocated), "EUR")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-between border-t border-border/40 pt-4 mt-2 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input 
              placeholder="Nome do Modelo..." 
              value={templateName} 
              onChange={e => setTemplateName(e.target.value)}
              className="flex-1 sm:w-[160px] h-9 text-xs sm:text-sm bg-background/50 rounded-xl border-border/40"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveTemplate} 
              disabled={!templateName || rows.length === 0} 
              className="h-9 text-xs rounded-xl border-border/60 hover:bg-muted/10 shrink-0"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar Modelo
            </Button>
          </div>
          <Button 
            onClick={handleExecute} 
            disabled={!isComplete} 
            className="gradient-primary h-10 text-xs sm:text-sm rounded-xl font-bold px-5 py-2 w-full sm:w-auto shrink-0"
          >
            Distribuir para Envelopes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
