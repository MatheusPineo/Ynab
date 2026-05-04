import { useState, useMemo, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccountStore, DistributionTemplateItem, DistributionTemplate } from "@/store/useAccountStore";
import { AccountNode } from "@/types";
import { formatMoney } from "@/lib/currency-utils";
import { Split, Plus, Trash, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DistributionModalProps {
  initialSourceAccount?: string;
  initialAmount?: string;
  sourceTransactionId?: string;
  trigger?: React.ReactNode;
}

export const DistributionModal = ({ initialSourceAccount, initialAmount, sourceTransactionId, trigger }: DistributionModalProps) => {
  const [open, setOpen] = useState(false);
  const { tree, distributionTemplates, fetchDistributionTemplates, executeBulkTransfer, saveDistributionTemplate } = useAccountStore();
  
  const [sourceAccount, setSourceAccount] = useState<string>(initialSourceAccount || "");
  const [totalAmount, setTotalAmount] = useState<string>(initialAmount || "");
  
  const [rows, setRows] = useState<DistributionTemplateItem[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");

  useEffect(() => {
    if (open) {
      fetchDistributionTemplates();
      setSourceAccount(initialSourceAccount || "");
      setTotalAmount(initialAmount || "");
      setRows([{ account: "", percentage: 0, fixed_amount: 0 }]);
      setTemplateName("");
      setSelectedTemplate("none");
    }
  }, [open, initialSourceAccount, initialAmount, fetchDistributionTemplates]);

  // Flatten accounts for dropdown
  const accountsFlat = useMemo(() => {
    const list: AccountNode[] = [];
    const walk = (nodes: AccountNode[]) => {
      nodes.forEach(n => {
        list.push(n);
        if (n.children) walk(n.children);
      });
    };
    walk(tree);
    return list;
  }, [tree]);

  const accSource = accountsFlat.find(a => String(a.id) === sourceAccount);
  const parsedTotal = parseFloat(totalAmount) || 0;

  // Recalculate values based on inputs
  const handleRowChange = (index: number, field: keyof DistributionTemplateItem, value: string) => {
    const newRows = [...rows];
    const row = { ...newRows[index] }; // Clone row to be safe

    if (field === "account") {
      row.account = value;
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

  // If total amount changes, recalculate fixed amounts based on percentages
  useEffect(() => {
    if (parsedTotal > 0) {
      const newRows = rows.map(r => ({
        ...r,
        fixed_amount: r.percentage ? (parsedTotal * (r.percentage / 100)) : r.fixed_amount,
        percentage: !r.percentage && r.fixed_amount ? (r.fixed_amount / parsedTotal) * 100 : r.percentage
      }));
      // Avoid infinite loop by checking if values actually changed
      const changed = newRows.some((r, i) => r.fixed_amount !== rows[i].fixed_amount);
      if (changed) setRows(newRows);
    }
  }, [totalAmount]);

  const addRow = () => {
    setRows([...rows, { account: "", percentage: 0, fixed_amount: 0 }]);
  };

  const removeRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const loadTemplate = (id: string) => {
    setSelectedTemplate(id);
    if (id === "none") return;
    
    const t = distributionTemplates.find(t => String(t.id) === String(id));
    if (t) {
      setRows(t.items.map(item => ({
        account: String(item.account),
        percentage: item.percentage ? Number(item.percentage) : 0,
        fixed_amount: item.fixed_amount ? Number(item.fixed_amount) : 0
      })));
      setTemplateName(t.name);
    }
  };

  const totalAllocated = rows.reduce((acc, r) => acc + (r.fixed_amount || 0), 0);
  const totalPercentage = rows.reduce((acc, r) => acc + (r.percentage || 0), 0);
  const isComplete = Math.abs(totalAllocated - parsedTotal) < 0.05 && parsedTotal > 0 && sourceAccount;

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    const validRows = rows.filter(r => r.account);
    if (validRows.length === 0) {
      toast.error("Adicione pelo menos um destino com conta selecionada.");
      return;
    }
    await saveDistributionTemplate({
      id: selectedTemplate !== "none" ? selectedTemplate : undefined,
      name: templateName,
      items: validRows.map(r => ({
        account: Number(r.account),
        percentage: typeof r.percentage === 'number' ? Number(r.percentage.toFixed(2)) : null,
        fixed_amount: typeof r.fixed_amount === 'number' ? Number(r.fixed_amount.toFixed(2)) : null
      }))
    });
  };

  const handleExecute = async () => {
    const validRows = rows.filter(r => r.account);
    if (validRows.length === 0) return;

    try {
      await executeBulkTransfer({
        from_account: sourceAccount,
        total_amount: parsedTotal,
        date: new Date().toISOString().split('T')[0],
        distributions: validRows.map(r => ({
          to_account: r.account,
          amount: Number((r.fixed_amount || 0).toFixed(2))
        })).filter(r => r.amount > 0 && r.to_account),
        source_transaction: sourceTransactionId
      });
      setOpen(false);
    } catch (e) {
      // Error handled in store
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-2">
            <Split className="h-4 w-4" /> Distribuir Saldo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass border-border/60 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Distribuição de Receita</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Conta de Origem (Ex: Onde caiu o salário)</Label>
              <Select value={sourceAccount} onValueChange={setSourceAccount}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Selecione a conta..." />
                </SelectTrigger>
                <SelectContent>
                  {accountsFlat.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name} ({formatMoney(a.balance, a.currency)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Total a Distribuir</Label>
              <Input 
                type="number" 
                placeholder="Ex: 1400.00" 
                value={totalAmount} 
                onChange={e => setTotalAmount(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 pt-4">
            <Label className="text-sm font-semibold">Regras de Divisão</Label>
            <div className="flex items-center gap-2">
              <Select value={selectedTemplate} onValueChange={loadTemplate}>
                <SelectTrigger className="w-[200px] h-8 text-xs bg-background/50">
                  <SelectValue placeholder="Carregar Modelo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {distributionTemplates.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2 py-2">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Destino</Label>
                  <Select value={row.account} onValueChange={(v) => handleRowChange(idx, "account", v)}>
                    <SelectTrigger className="h-9 bg-background/50">
                      <SelectValue placeholder="Conta destino..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accountsFlat.filter(a => String(a.id) !== sourceAccount).map(a => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs text-muted-foreground">%</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    className="h-9 bg-background/50" 
                    value={row.percentage || ""} 
                    onChange={(e) => handleRowChange(idx, "percentage", e.target.value)}
                  />
                </div>
                <div className="w-32 space-y-1">
                  <Label className="text-xs text-muted-foreground">Valor ({accSource?.currency || "R$"})</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    className="h-9 bg-background/50" 
                    value={row.fixed_amount || ""} 
                    onChange={(e) => handleRowChange(idx, "fixed_amount", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0" onClick={() => removeRow(idx)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-9 text-primary hover:text-primary hover:bg-primary/10 shrink-0 p-0" 
                    title="Alocar restante"
                    onClick={() => allocateRemaining(idx)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={addRow} className="w-fit">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Destino
          </Button>

          {/* Resumo */}
          <div className="rounded-xl bg-muted/20 p-4 border border-border/40">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Alocado:</span>
              <span className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatMoney(totalAllocated, (accSource?.currency || "BRL") as any)} ({totalPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-muted-foreground">Restante:</span>
              <span className="font-bold">
                {formatMoney(Math.max(0, parsedTotal - totalAllocated), (accSource?.currency || "BRL") as any)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Nome do Modelo..." 
              value={templateName} 
              onChange={e => setTemplateName(e.target.value)}
              className="w-[150px] h-9 text-sm bg-background/50"
            />
            <Button variant="outline" size="sm" onClick={handleSaveTemplate} disabled={!templateName || rows.length === 0} className="h-9">
              <Save className="h-4 w-4 mr-2" /> Salvar Modelo
            </Button>
          </div>
          <Button onClick={handleExecute} disabled={!isComplete} className="gradient-primary">
            Executar Distribuição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
