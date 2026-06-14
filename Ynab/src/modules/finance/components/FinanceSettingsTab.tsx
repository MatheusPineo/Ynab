import { useState, useMemo } from "react";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { useDebtStore } from "@/modules/finance/store/useDebtStore";
import { TemplateBuilderForm } from "./TemplateBuilderForm";
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
  Plus,
  Users,
  Archive,
  ArchiveRestore
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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
    tree,
    transactions,
    categoryGroups,
    goals,
    distributionTemplates,
    fetchAccounts, 
    fetchTransactions, 
    fetchCategoryGroups, 
    fetchGoals, 
    fetchDistributionTemplates 
  } = useAccountStore();
  
  const { debts, fetchDebts } = useDebtStore();

  const handleExportJSON = () => {
    try {
      const backupData = {
        exported_at: new Date().toISOString(),
        accounts: tree,
        transactions: transactions,
        categoryGroups: categoryGroups,
        goals: goals,
        debts: debts,
        distributionTemplates: distributionTemplates
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vault_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Backup JSON exportado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao exportar dados em JSON: " + error.message);
    }
  };

  const handleExportCSV = () => {
    try {
      if (!transactions || transactions.length === 0) {
        toast.error("Nenhuma transação disponível para exportar no período atual.");
        return;
      }

      // Cabeçalho do CSV
      const headers = ["ID", "Data", "Descricao", "Valor", "Tipo", "Status", "Conta", "Categoria"];
      
      // Mapeia cada transação para uma linha do CSV
      const rows = transactions.map(t => {
        const accountName = useAccountStore.getState().getAccountName(t.account);
        const categoryName = useAccountStore.getState().getCategoryName(t.category);
        const type = t.is_income ? "Receita" : "Despesa";
        const status = t.status === "realized" ? "Realizada" : "Pendente";
        
        // Escapa caracteres especiais para formato CSV seguro
        const escapeCSV = (str: any) => {
          if (str === null || str === undefined) return "";
          const s = String(str);
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        };

        return [
          t.id,
          t.date,
          escapeCSV(t.description),
          t.amount,
          type,
          status,
          escapeCSV(accountName),
          escapeCSV(categoryName)
        ];
      });

      // Junta cabeçalhos e linhas usando ponto e vírgula ou vírgula
      const csvContent = [headers, ...rows]
        .map(e => e.join(","))
        .join("\n");

      // Força encoding UTF-8 com BOM para garantir que o Excel abra caracteres especiais corretamente
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vault_finance_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Planilha de Transações CSV exportada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao exportar dados em CSV: " + error.message);
    }
  };

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
            <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold">Backup & Exportação</p>
                  <p className="text-xs text-muted-foreground text-pretty">Baixe todos os seus dados para backup manual ou controle em planilha.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button 
                  onClick={handleExportJSON}
                  variant="outline" 
                  className="flex-1 rounded-xl gap-2 h-10 hover:bg-primary/5 hover:text-primary transition-colors font-semibold"
                >
                  JSON Backup
                </Button>
                <Button 
                  onClick={handleExportCSV}
                  variant="outline" 
                  className="flex-1 rounded-xl gap-2 h-10 hover:bg-primary/5 hover:text-primary transition-colors font-semibold"
                >
                  CSV Planilha
                </Button>
              </div>
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
    toggleTemplateActive,
    toggleTemplateArchived,
    getAccountName,
  } = useAccountStore();

  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const activeTemplates = useMemo(() => {
    return distributionTemplates.filter(t => !t.is_archived);
  }, [distributionTemplates]);

  const archivedTemplates = useMemo(() => {
    return distributionTemplates.filter(t => t.is_archived);
  }, [distributionTemplates]);

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsEditingTemplate(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsEditingTemplate(true);
  };

  const renderTemplateCard = (template: any, isArchivedTab: boolean) => (
    <div key={template.id} className="flex flex-col gap-4 p-5 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/30 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground text-lg">{template.name}</h4>
            {template.trigger_payee && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Gatilho: {template.trigger_payee}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
            Criado em: {template.created_at ? new Date(template.created_at).toLocaleDateString() : "—"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isArchivedTab && (
            <div className="flex items-center gap-2 border border-border/40 rounded-xl px-3 py-1 bg-background/50">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {template.is_active ? "Ativo" : "Inativo"}
              </span>
              <Switch 
                checked={template.is_active ?? true} 
                onCheckedChange={() => toggleTemplateActive(template.id, template.is_active ?? true)}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isArchivedTab ? (
              <>
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
                  className="h-9 w-9 text-amber-500 hover:bg-amber-500/10 rounded-xl"
                  onClick={() => toggleTemplateArchived(template.id, template.is_archived ?? false)}
                  title="Arquivar"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-emerald-500 hover:bg-emerald-500/10 rounded-xl"
                  onClick={() => toggleTemplateArchived(template.id, template.is_archived ?? false)}
                  title="Desarquivar"
                >
                  <ArchiveRestore className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-rose-400 hover:bg-rose-400/10 rounded-xl"
                  onClick={() => {
                    if (confirm(`Excluir permanentemente o modelo "${template.name}"?`)) {
                      deleteDistributionTemplate(template.id);
                    }
                  }}
                  title="Excluir"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
        {template.items.map((item: any, idx: number) => {
          const targetName = item.category ? `Gaveta: ${getAccountName(item.category)}` : getAccountName(item.account);
          return (
            <div key={idx} className="flex items-center gap-2 bg-background/40 border border-border/20 rounded-lg px-3 py-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <span className="text-[10px] font-bold text-muted-foreground">{targetName}:</span>
              <span className="text-xs font-black text-primary">
                {item.percentage ? `${item.percentage}%` : formatMoney(item.fixed_amount, "BRL")}
              </span>
            </div>
          );
        })}
        {template.fallback_category && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
            <span className="text-[10px] font-bold text-primary">Fallback → {getAccountName(template.fallback_category)}:</span>
            <span className="text-xs font-black text-primary">Sobra</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <LayoutGrid className="h-5 w-5 text-primary" />
              Modelos de Distribuição
            </CardTitle>
            <CardDescription>Visualize, edite ou exclua suas regras de divisão salvas.</CardDescription>
          </div>
          <Button 
            onClick={handleCreateTemplate}
            className="gradient-primary rounded-xl font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-1" /> Criar Modelo
          </Button>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[320px] mb-6 rounded-2xl p-1 bg-muted/20 border border-border/30">
              <TabsTrigger value="active" className="rounded-xl font-bold text-xs py-2">Minhas Regras</TabsTrigger>
              <TabsTrigger value="archived" className="rounded-xl font-bold text-xs py-2">Arquivadas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              <div className="grid gap-4">
                {activeTemplates.length === 0 ? (
                  <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/40">
                    <p className="text-muted-foreground italic">Nenhuma regra ativa salva ainda.</p>
                  </div>
                ) : (
                  activeTemplates.map(template => renderTemplateCard(template, false))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="archived">
              <div className="grid gap-4">
                {archivedTemplates.length === 0 ? (
                  <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/40">
                    <p className="text-muted-foreground italic">Nenhuma regra arquivada.</p>
                  </div>
                ) : (
                  archivedTemplates.map(template => renderTemplateCard(template, true))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição de Modelo */}
      <Dialog open={isEditingTemplate} onOpenChange={setIsEditingTemplate}>
        <DialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingTemplate ? "Editar Modelo" : "Criar Modelo"}
            </DialogTitle>
            <DialogDescription>
              Configure o nome, gatilhos, fallback e as regras de distribuição em cascata.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1">
            <TemplateBuilderForm 
              template={editingTemplate}
              onSave={() => setIsEditingTemplate(false)}
              onCancel={() => setIsEditingTemplate(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const FinanceSplitRulesTab = () => {
  const { splitRules, deleteSplitRule, createSplitRule, updateSplitRule } = useDebtStore();
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleItems, setRuleItems] = useState<any[]>([]);

  const handleOpenModal = (rule: any = null) => {
    if (rule) { setEditingRule(rule); setRuleName(rule.name); setRuleItems(rule.items.map((i: any) => ({ debtor_name: i.debtor_name || i.debtor || "", percentage: i.percentage || 0 }))); }
    else { setEditingRule(null); setRuleName(""); setRuleItems([{ debtor_name: "", percentage: 50 }]); }
    setIsEditingModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!ruleName.trim()) return toast.error("Name required.");
    const validItems = ruleItems.filter(i => i.debtor_name.trim() !== "");
    if (validItems.length === 0) return toast.error("Add at least one debtor.");
    const payload = { name: ruleName, items: validItems.map(i => ({ debtor_name: i.debtor_name, debtor: i.debtor_name, percentage: Number(i.percentage) })) };
    if (editingRule) await updateSplitRule(editingRule.id, payload); else await createSplitRule(payload);
    setIsEditingModalOpen(false);
  };

  return (
    <Card className="rounded-3xl border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1"><CardTitle className="text-lg flex items-center gap-2 font-bold"><Users className="h-5 w-5 text-primary" />Regras de Rateio Automático</CardTitle></div>
        <Button onClick={() => handleOpenModal()} className="gradient-primary rounded-xl font-bold"><Plus className="h-4 w-4 mr-2" /> Nova Regra</Button>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="grid gap-4">
          {splitRules.length === 0 ? (<div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border/40"><p className="text-muted-foreground italic">Nenhuma regra.</p></div>) : (
            splitRules.map(rule => (
              <div key={rule.id} className="flex flex-col gap-4 p-5 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/30">
                <div className="flex items-center justify-between"><h4 className="font-bold text-lg">{rule.name}</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(rule)} className="text-primary hover:bg-primary/10 rounded-xl"><FileEdit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("Excluir?")) deleteSplitRule(rule.id); }} className="text-rose-400 hover:bg-rose-400/10 rounded-xl"><Trash className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border/20 pt-2">
                  {rule.items.map((item: any, idx: number) => (<div key={idx} className="flex items-center gap-2 bg-background/40 border border-border/20 rounded-lg px-3 py-1.5"><span className="text-[10px] font-bold text-muted-foreground">{item.debtor_name || item.debtor}:</span><span className="text-xs font-black text-primary">{item.percentage}%</span></div>))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <Dialog open={isEditingModalOpen} onOpenChange={setIsEditingModalOpen}>
        <DialogContent className="rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl sm:max-w-xl">
          <DialogHeader><DialogTitle className="text-2xl font-bold">{editingRule ? "Editar" : "Nova Regra"}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-2"><Label>Nome</Label><Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="h-11 bg-background/50" /></div>
            <div className="space-y-3"><Label>Participantes</Label>
              {ruleItems.map((row, idx) => (
                <div key={idx} className="flex items-end gap-2 p-3 rounded-xl bg-muted/10 border border-border/40">
                  <div className="flex-1 space-y-1"><Label className="text-[10px]">Nome</Label><Input value={row.debtor_name} onChange={(e) => { const n = [...ruleItems]; n[idx].debtor_name = e.target.value; setRuleItems(n); }} className="h-9 bg-background/50" /></div>
                  <div className="w-28 space-y-1"><Label className="text-[10px]">%</Label><Input type="number" value={row.percentage} onChange={(e) => { const n = [...ruleItems]; n[idx].percentage = e.target.value; setRuleItems(n); }} className="h-9 bg-background/50" /></div>
                  <Button variant="ghost" size="icon" onClick={() => setRuleItems(ruleItems.filter((_, i) => i !== idx))} className="text-rose-400 hover:bg-rose-500/10 h-9 w-9"><Trash className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => setRuleItems([...ruleItems, { debtor_name: "", percentage: 50 }])} className="w-full border-dashed text-primary border-primary/30"><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setIsEditingModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveRule} className="gradient-primary">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
