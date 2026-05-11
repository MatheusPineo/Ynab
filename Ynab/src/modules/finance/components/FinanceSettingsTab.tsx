import { useState, useMemo } from "react";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useDebtStore } from "@/modules/finance/store/useDebtStore";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/shared/lib/currency-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { 
  Database, 
  LayoutGrid,
  Trash2,
  Download,
  FileEdit,
  Trash,
  Plus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/shared/components/ui/dialog";

// Aba de Gerenciamento de Dados
export const FinanceDataTab = () => {
  const { accessToken } = useAuthStore();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const { 
    fetchAccounts, 
    fetchTransactions, 
    fetchCategoryGroups, 
    fetchGoals, 
    fetchDistributionTemplates 
  } = useAccountStore();
  
  const { fetchDebts } = useDebtStore();

  const handleResetData = async () => {
    if (resetConfirmation !== "EXCLUIR") {
      toast.error("Por favor, digite EXCLUIR para confirmar.");
      return;
    }

    setIsResetting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8002/api";
      const response = await fetch(`${baseUrl}/auth/profile/reset-data/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!response.ok) throw new Error("Falha ao zerar dados");

      toast.success("Todos os dados financeiros foram excluídos com sucesso!");
      
      // Atualiza todas as stores locais para refletir o banco vazio
      await Promise.all([
        fetchAccounts(),
        fetchTransactions(),
        fetchCategoryGroups(),
        fetchGoals(),
        fetchDistributionTemplates(),
        fetchDebts()
      ]);

      setIsResetModalOpen(false);
      setResetConfirmation("");
    } catch (error: any) {
      toast.error(error.message || "Falha ao zerar dados.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm p-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> Armazenamento
            </h3>
            <p className="text-sm text-muted-foreground">Controle como seus dados são armazenados localmente.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-bold">Backup de Segurança</p>
                <p className="text-xs text-muted-foreground text-pretty">Baixe um arquivo JSON com todos os seus dados para backup manual.</p>
              </div>
              <Button variant="outline" className="w-full rounded-xl gap-2 h-10">
                Exportar JSON
              </Button>
            </div>

            <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 transition-all space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-rose-500" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-rose-400">Zona de Perigo: Zerar Dados</p>
                <p className="text-xs text-muted-foreground text-pretty">Exclua permanentemente todas as suas transações, contas e categorias para começar do zero.</p>
              </div>
              <Button 
                onClick={() => setIsResetModalOpen(true)}
                className="w-full rounded-xl gap-2 h-10 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 border border-rose-500/20 font-bold transition-all animate-pulse-subtle"
              >
                <Trash2 className="h-4 w-4" /> Zerar Minha Conta
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de Confirmação para Zerar Dados */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="rounded-3xl border-rose-500/20 bg-card/95 backdrop-blur-xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="h-6 w-6" /> Zerar Todos os Dados?
            </DialogTitle>
            <DialogDescription className="text-pretty text-sm">
              Esta ação é irreversível. Todos os seus registros financeiros serão apagados de forma permanente de nossos servidores. Seu usuário e perfil continuarão ativos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">
              Para confirmar, digite a palavra <span className="font-black text-rose-500 tracking-wider">EXCLUIR</span> no campo abaixo:
            </p>
            <Input 
              placeholder="EXCLUIR"
              value={resetConfirmation}
              onChange={(e) => setResetConfirmation(e.target.value)}
              className="text-center font-bold tracking-widest text-lg h-11 bg-background/50 rounded-xl border-rose-500/20 focus:border-rose-500 focus:ring-rose-500"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="ghost" 
              onClick={() => { setIsResetModalOpen(false); setResetConfirmation(""); }}
              className="rounded-xl"
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleResetData}
              disabled={isResetting || resetConfirmation !== "EXCLUIR"}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 rounded-xl font-bold shadow-sm h-10 gap-1.5"
            >
              {isResetting ? "Excluindo..." : "Excluir Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Aba de Modelos de Distribuição
export const FinanceTemplatesTab = () => {
  const { 
    distributionTemplates, 
    deleteDistributionTemplate, 
    saveDistributionTemplate,
    getAccountName,
    tree 
  } = useAccountStore();

  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingRows, setEditingRows] = useState<any[]>([]);
  const [editingName, setEditingName] = useState("");

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

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setEditingName(template.name);
    setEditingRows(template.items.map((it: any) => ({
      account: String(it.account),
      percentage: it.percentage ? Number(it.percentage) : 0,
      fixed_amount: it.fixed_amount ? Number(it.fixed_amount) : 0
    })));
    setIsEditingTemplate(true);
  };

  const handleEditingRowChange = (index: number, field: string, value: any) => {
    const newRows = [...editingRows];
    const row = { ...newRows[index] };
    if (field === "account") {
      row.account = value;
    } else if (field === "percentage") {
      row.percentage = parseFloat(value) || 0;
    }
    newRows[index] = row;
    setEditingRows(newRows);
  };

  const saveEditedTemplate = async () => {
    if (!editingName.trim()) return;
    const validRows = editingRows.filter(r => r.account);
    await saveDistributionTemplate({
      id: editingTemplate.id,
      name: editingName,
      items: validRows.map(r => ({
        account: Number(r.account),
        percentage: Number((r.percentage || 0).toFixed(2)),
        fixed_amount: null
      }))
    });
    setIsEditingTemplate(false);
  };

  return (
    <>
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 font-bold">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Modelos de Distribuição
          </CardTitle>
          <CardDescription>Visualize, edite ou exclua suas regras de divisão salvas.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid gap-4">
            {distributionTemplates.length === 0 ? (
              <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/40">
                <p className="text-muted-foreground italic">Nenhum modelo salvo ainda.</p>
              </div>
            ) : (
              distributionTemplates.map(template => (
                <div key={template.id} className="flex flex-col gap-4 p-5 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/30 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground text-lg">{template.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        Criado em: {template.created_at ? new Date(template.created_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-rose-400 hover:bg-rose-400/10 rounded-xl"
                        onClick={() => {
                          if (confirm(`Excluir o modelo "${template.name}"?`)) {
                            deleteDistributionTemplate(template.id);
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
                    {template.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-background/40 border border-border/20 rounded-lg px-3 py-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground">{getAccountName(item.account)}:</span>
                        <span className="text-xs font-black text-primary">
                          {item.percentage ? `${item.percentage}%` : formatMoney(item.fixed_amount, "BRL")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição de Modelo */}
      <Dialog open={isEditingTemplate} onOpenChange={setIsEditingTemplate}>
        <DialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Modelo</DialogTitle>
            <DialogDescription>
              Altere o nome e as regras de distribuição deste modelo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1 space-y-6">
            <div className="space-y-2 p-1">
              <Label>Nome do Modelo</Label>
              <Input 
                value={editingName} 
                onChange={(e) => setEditingName(e.target.value)}
                className="bg-background/50 h-11"
                placeholder="Ex: Salário Mensal"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Regras de Destino</Label>
                <div className="text-[10px] font-black px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                  TOTAL: {editingRows.reduce((acc, r) => acc + (r.percentage || 0), 0).toFixed(2)}% 
                  ({(100 - editingRows.reduce((acc, r) => acc + (r.percentage || 0), 0)).toFixed(2)}% restantes)
                </div>
              </div>
              <div className="space-y-3">
                {editingRows.map((row, idx) => (
                  <div key={idx} className="flex items-end gap-2 p-3 rounded-xl bg-muted/10 border border-border/40">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold">Conta de Destino</Label>
                      <Select value={row.account} onValueChange={(v) => handleEditingRowChange(idx, "account", v)}>
                        <SelectTrigger className="h-9 bg-background/50">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          {accountsFlat.map(a => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-bold">Porcentagem (%)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        className="h-9 bg-background/50" 
                        value={row.percentage || ""} 
                        onChange={(e) => handleEditingRowChange(idx, "percentage", e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-rose-400 hover:bg-rose-400/10"
                      onClick={() => setEditingRows(editingRows.filter((_, i) => i !== idx))}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed rounded-xl h-10 text-primary border-primary/30 hover:bg-primary/5"
                  onClick={() => setEditingRows([...editingRows, { account: "", percentage: 0, fixed_amount: 0 }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Destino
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/20 gap-2">
            <Button variant="ghost" onClick={() => setIsEditingTemplate(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={saveEditedTemplate}
              className="gradient-primary px-8 rounded-xl font-bold shadow-glow"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
