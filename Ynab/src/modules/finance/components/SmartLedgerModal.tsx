import { useState, useEffect } from "react";
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
import { useWealthStore } from "../store/useWealthStore";
import { useAccountStore } from "../store/useAccountStore";
import { groupWealthHoldings, distributeProportionally, AccountNode, MacroCategoryNode, UnitaryAssetNode } from "../store/wealth-utils";
import { Landmark, TrendingUp, DollarSign, ChevronRight, ChevronDown, Save, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/shared/lib/currency-utils";
import { authenticatedFetch } from "@/shared/lib/api";

interface Props {
  trigger?: React.ReactNode;
}

export function SmartLedgerModal({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const { summary, activities, fetchSummary } = useWealthStore();
  const { tree: accountTree, fetchAccounts } = useAccountStore();
  
  // Árvore editável local para UI (mecanismo descendente e ascendente)
  const [editableTree, setEditableTree] = useState<AccountNode[]>([]);
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [expandedMacros, setExpandedMacros] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mapeamento de id -> name de contas reais do YNAB
  const accountsMap = accountTree.map(acc => ({
    id: Number(acc.id),
    name: acc.name
  }));

  // Carregar e montar a árvore ao abrir o modal
  useEffect(() => {
    if (open) {
      fetchAccounts();
      if (summary) {
        const grouped = groupWealthHoldings(summary.holdings, activities, accountsMap);
        setEditableTree(grouped);
        
        // Expandir por padrão todas as contas e macros que têm ativos
        const initialAccs: Record<string, boolean> = {};
        const initialMacros: Record<string, boolean> = {};
        grouped.forEach((acc) => {
          const accKey = String(acc.account_id);
          initialAccs[accKey] = true;
          acc.macroCategories.forEach((macro) => {
            const macroKey = `${accKey}-${macro.name}`;
            initialMacros[macroKey] = true;
          });
        });
        setExpandedAccounts(initialAccs);
        setExpandedMacros(initialMacros);
      }
    }
  }, [open, summary, activities, accountTree.length]);

  const toggleAccount = (accId: string) => {
    setExpandedAccounts(prev => ({ ...prev, [accId]: !prev[accId] }));
  };

  const toggleMacro = (macroKey: string) => {
    setExpandedMacros(prev => ({ ...prev, [macroKey]: !prev[macroKey] }));
  };

  // --- LÓGICA DE INTERAÇÃO (TOP-DOWN & BOTTOM-UP) ---

  // 1. Top-Down: Usuário edita o saldo da Conta
  const handleAccountChange = (accountId: number | null, newBalance: number) => {
    const nextTree = editableTree.map((acc) => {
      if (acc.account_id !== accountId) return acc;

      // Obter todos os ativos da conta
      const allAssets: UnitaryAssetNode[] = [];
      acc.macroCategories.forEach((m) => allAssets.push(...m.assets));

      if (allAssets.length === 0) return { ...acc, net_value: newBalance };

      // Distribuir proporcionalmente
      const distributedUpdates = distributeProportionally(allAssets, newBalance);
      const updatesMap = new Map(distributedUpdates.map(u => [u.asset_id, u.new_balance]));

      // Reconstrói a árvore recalculando macros e ativos
      const updatedMacros = acc.macroCategories.map((m) => {
        let macroSum = 0;
        const updatedAssets = m.assets.map((asset) => {
          const val = updatesMap.get(asset.asset_id) ?? asset.net_value;
          macroSum += val;
          return { ...asset, net_value: val };
        });
        return {
          ...m,
          net_value: Number(macroSum.toFixed(2)),
          assets: updatedAssets
        };
      });

      return {
        ...acc,
        net_value: Number(newBalance.toFixed(2)),
        macroCategories: updatedMacros
      };
    });

    setEditableTree(nextTree);
  };

  // 2. Top-Down: Usuário edita o saldo de uma Macro Categoria
  const handleMacroChange = (accountId: number | null, macroName: string, newBalance: number) => {
    const nextTree = editableTree.map((acc) => {
      if (acc.account_id !== accountId) return acc;

      let accountSum = 0;
      const updatedMacros = acc.macroCategories.map((m) => {
        if (m.name !== macroName) {
          accountSum += m.net_value;
          return m;
        }

        if (m.assets.length === 0) {
          accountSum += newBalance;
          return { ...m, net_value: newBalance };
        }

        const distributedUpdates = distributeProportionally(m.assets, newBalance);
        const updatesMap = new Map(distributedUpdates.map(u => [u.asset_id, u.new_balance]));

        const updatedAssets = m.assets.map((asset) => {
          const val = updatesMap.get(asset.asset_id) ?? asset.net_value;
          return { ...asset, net_value: val };
        });

        accountSum += newBalance;
        return {
          ...m,
          net_value: Number(newBalance.toFixed(2)),
          assets: updatedAssets
        };
      });

      return {
        ...acc,
        net_value: Number(accountSum.toFixed(2)),
        macroCategories: updatedMacros
      };
    });

    setEditableTree(nextTree);
  };

  // 3. Bottom-Up: Usuário edita o saldo de um Ativo Unitário diretamente
  const handleAssetChange = (accountId: number | null, macroName: string, assetId: number, newBalance: number) => {
    const nextTree = editableTree.map((acc) => {
      if (acc.account_id !== accountId) return acc;

      let accountSum = 0;
      const updatedMacros = acc.macroCategories.map((m) => {
        if (m.name !== macroName) {
          accountSum += m.net_value;
          return m;
        }

        let macroSum = 0;
        const updatedAssets = m.assets.map((asset) => {
          if (asset.asset_id !== assetId) {
            macroSum += asset.net_value;
            return asset;
          }
          macroSum += newBalance;
          return { ...asset, net_value: newBalance };
        });

        accountSum += macroSum;
        return {
          ...m,
          net_value: Number(macroSum.toFixed(2)),
          assets: updatedAssets
        };
      });

      return {
        ...acc,
        net_value: Number(accountSum.toFixed(2)),
        macroCategories: updatedMacros
      };
    });

    setEditableTree(nextTree);
  };

  // --- SUBMISSÃO ---
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Coleta todos os ativos e seus saldos finais na árvore editável
      const updates: { asset_id: number; new_balance: number }[] = [];
      editableTree.forEach((acc) => {
        acc.macroCategories.forEach((m) => {
          m.assets.forEach((asset) => {
            updates.push({
              asset_id: asset.asset_id,
              new_balance: asset.net_value
            });
          });
        });
      });

      const response = await authenticatedFetch("/wealth/batch-update/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });

      if (response.ok) {
        toast.success("Livro-razão e saldos de investimentos atualizados com sucesso!");
        await fetchSummary();
        setOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData?.detail || "Erro desconhecido ao processar atualização em lote.");
      }
    } catch (error: any) {
      toast.error(error.message || "Falha ao sincronizar o Smart Ledger com o backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl font-semibold">
            <Edit3 className="h-4 w-4" /> Ajustar Livro-Razão (Smart Ledger)
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="glass border-border/60 w-[94vw] sm:max-w-3xl rounded-3xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[92vh]">
        <DialogHeader className="pb-3 border-b border-border/30">
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-gradient-mixed flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" /> Cascading Smart Ledger
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Gerenciamento reativo de investimentos. Atualize o saldo total de uma conta ou categoria macro para redistribuir proporcionalmente, ou altere ativos individuais para somar em cascata.
          </p>
        </DialogHeader>

        {/* Árvore de Contas / Categorias / Ativos */}
        <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 max-h-[60vh]">
          {editableTree.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Nenhum ativo custodiado encontrado. Adicione um lançamento de investimento para começar.
            </div>
          ) : (
            editableTree.map((acc) => {
              const accKey = String(acc.account_id);
              const isAccExpanded = expandedAccounts[accKey];

              return (
                <div key={accKey} className="border border-border/40 rounded-2xl overflow-hidden bg-background/10 backdrop-blur-md">
                  {/* CONTA (TOP-LEVEL) */}
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 border-b border-border/10">
                    <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleAccount(accKey)}>
                      {isAccExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm sm:text-base font-black text-foreground">{acc.account_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-xs text-muted-foreground uppercase font-black tracking-wider">Saldo Conta</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">R$</span>
                        <Input 
                          type="number"
                          step="0.01"
                          value={acc.net_value === 0 ? "" : acc.net_value}
                          placeholder="0.00"
                          onChange={(e) => handleAccountChange(acc.account_id, parseFloat(e.target.value) || 0)}
                          className="w-[120px] sm:w-[150px] pl-8 text-right font-bold text-xs sm:text-sm bg-background/50 h-8 rounded-lg border-border/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* MACROS (LEVEL 2) */}
                  {isAccExpanded && (
                    <div className="divide-y divide-border/10 bg-background/5">
                      {acc.macroCategories.map((macro) => {
                        const macroKey = `${accKey}-${macro.name}`;
                        const isMacroExpanded = expandedMacros[macroKey];

                        return (
                          <div key={macro.name} className="flex flex-col">
                            {/* LINHA MACRO CATEGORIA */}
                            <div className="flex items-center justify-between pl-6 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-3 bg-muted/10">
                              <div className="flex items-center gap-1.5 cursor-pointer flex-1" onClick={() => toggleMacro(macroKey)}>
                                {isMacroExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/80" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/80" />}
                                <span className="text-xs sm:text-sm font-semibold text-foreground/90">{macro.name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="hidden sm:inline text-[10px] text-muted-foreground/70 uppercase font-black tracking-wider">Total Categoria</span>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">R$</span>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    value={macro.net_value === 0 ? "" : macro.net_value}
                                    placeholder="0.00"
                                    onChange={(e) => handleMacroChange(acc.account_id, macro.name, parseFloat(e.target.value) || 0)}
                                    className="w-[100px] sm:w-[130px] pl-7 text-right font-semibold text-xs bg-background/50 h-7 rounded-md border-border/30"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* ATIVOS (DEEPEST LEVEL) */}
                            {isMacroExpanded && (
                              <div className="divide-y divide-border/5 bg-background/5">
                                {macro.assets.map((asset) => (
                                  <div key={asset.asset_id} className="flex items-center justify-between pl-12 sm:pl-16 pr-3 sm:pr-4 py-2 bg-background/10 hover:bg-muted/5 transition-colors">
                                    <div className="flex flex-col flex-1 truncate pr-2">
                                      <span className="text-xs font-bold text-foreground/80 font-mono">{asset.ticker}</span>
                                      <span className="text-[10px] text-muted-foreground truncate max-w-[180px] sm:max-w-xs">{asset.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="hidden sm:inline text-[9px] text-muted-foreground/50 font-bold font-mono">
                                        PM {formatMoney(asset.average_cost, asset.currency)}
                                      </span>
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground">R$</span>
                                        <Input 
                                          type="number"
                                          step="0.01"
                                          value={asset.net_value === 0 ? "" : asset.net_value}
                                          placeholder="0.00"
                                          onChange={(e) => handleAssetChange(acc.account_id, macro.name, asset.asset_id, parseFloat(e.target.value) || 0)}
                                          className="w-[90px] sm:w-[120px] pl-6 text-right font-medium text-xs bg-background/50 h-6.5 rounded-md border-border/20"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-col sm:flex-row gap-3 items-center sm:justify-between border-t border-border/30 pt-4 mt-2 shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>As atualizações refletirão como transações YIELD de ajuste.</span>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              className="rounded-xl px-6 text-xs sm:text-sm h-10 w-1/2 sm:w-auto hover:bg-muted/10"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting || editableTree.length === 0} 
              className="gradient-primary h-10 text-xs sm:text-sm rounded-xl font-bold px-5 w-1/2 sm:w-auto shrink-0 gap-1.5"
            >
              {isSubmitting ? (
                <>Sincronizando...</>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Salvar Atualizações
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
