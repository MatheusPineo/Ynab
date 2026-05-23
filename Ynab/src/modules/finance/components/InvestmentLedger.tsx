import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/shared/components/ui/accordion";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Search, 
  TrendingUp, 
  TrendingDown,
  Info,
  Briefcase
} from 'lucide-react';
import { formatMoney } from "@/shared/lib/currency-utils";
import { useWealthStore, InvestmentActivity, InvestmentAsset } from "../store/useWealthStore";
import { format } from "date-fns";

// Mapeamento visual para os tipos de investimento
const ASSET_TYPE_LABELS: Record<string, string> = {
  'FIXED_INCOME': 'Renda Fixa',
  'TREASURY': 'Tesouro Direto',
  'STOCK': 'Ações',
  'FII': 'Fundos Imobiliários',
  'ETF': 'ETFs',
  'CRYPTO': 'Criptomoedas',
  'BOND': 'Títulos / CDB',
  'MUTUAL_FUND': 'Fundos de Investimento',
  'OTHER': 'Outros'
};

export const InvestmentLedger: React.FC = () => {
  const { activities, assets, deleteActivity } = useWealthStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Agrupar atividades pelo tipo de ativo
  const groupedActivities = useMemo(() => {
    const groups: Record<string, { label: string; items: InvestmentActivity[] }> = {};
    
    // Filtrar primeiro
    const filtered = activities.filter(act => {
      const search = searchTerm.toLowerCase();
      const ticker = (act.asset_ticker || '').toLowerCase();
      const name = (act.asset_name || '').toLowerCase();
      return ticker.includes(search) || name.includes(search);
    });

    filtered.forEach(activity => {
      // Encontrar o ativo relacionado para pegar o tipo e vencimento
      const relatedAsset = assets.find(a => a.id === activity.asset);
      
      // Determinar o grupo baseado na nova taxonomia ou fallback
      const groupName = relatedAsset?.asset_category || ASSET_TYPE_LABELS[relatedAsset?.asset_type || 'OTHER'] || 'Outros';
      
      if (!groups[groupName]) {
        groups[groupName] = {
          label: groupName,
          items: []
        };
      }
      
      groups[groupName].items.push(activity);
    });

    return groups;
  }, [activities, assets, searchTerm]);

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este lançamento? O seu saldo e rentabilidade serão recalculados.")) {
      await deleteActivity(id);
    }
  };

  const [editingActivity, setEditingActivity] = useState<InvestmentActivity | null>(null);
  const [editForm, setEditForm] = useState({ quantity: 0, unit_price: 0, date: '' });

  const handleEdit = (activity: InvestmentActivity) => {
    setEditingActivity(activity);
    setEditForm({
      quantity: activity.quantity,
      unit_price: activity.unit_price,
      date: new Date(activity.date).toISOString().split('T')[0]
    });
  };

  const submitEdit = async () => {
    if (!editingActivity) return;
    try {
      // Assuming useWealthStore has an updateActivity method or we can implement it
      // For now we will emulate it or call the actual api
      const res = await fetch(`/api/wealth/activities/${editingActivity.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(editForm)
      });
      if(res.ok) {
        alert("Lançamento atualizado com sucesso!");
        setEditingActivity(null);
        window.location.reload(); // Quick refresh to update state
      } else {
        alert("Erro ao atualizar lançamento.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full space-y-4">
      {Object.keys(groupedActivities).length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card border rounded-lg">
          {searchTerm ? 'Nenhum ativo encontrado para essa busca.' : 'Nenhum lançamento registrado no histórico.'}
        </div>
      ) : (
        <Accordion 
          type="multiple" 
          defaultValue={Object.keys(groupedActivities)}
          className="space-y-4"
        >
          {Object.entries(groupedActivities).map(([typeKey, group]) => (
            <AccordionItem 
              key={typeKey} 
              value={typeKey} 
              className="bg-card border rounded-lg overflow-hidden shadow-sm px-0"
            >
              <div className="flex items-center justify-between px-6 py-2 border-b">
                <AccordionTrigger className="hover:no-underline py-4 text-xl font-bold flex-1 border-none !p-0">
                  {group.label}
                </AccordionTrigger>
                <div className="relative w-64 mr-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar ativos" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 bg-muted/30 border-muted-foreground/20 rounded-full"
                    onClick={(e) => e.stopPropagation()} // Evita fechar o accordion ao clicar
                  />
                </div>
              </div>
              
              <AccordionContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow className="border-b">
                        <TableHead className="font-medium text-muted-foreground whitespace-nowrap pl-6">Investimento</TableHead>
                        <TableHead className="font-medium text-muted-foreground whitespace-nowrap">Tipo de investimento</TableHead>
                        <TableHead className="font-medium text-muted-foreground whitespace-nowrap">Tipo de ordem</TableHead>
                        <TableHead className="font-medium text-muted-foreground whitespace-nowrap">Vencimento</TableHead>
                        <TableHead className="font-medium text-muted-foreground whitespace-nowrap text-right">Quantidade</TableHead>
                        <TableHead className="font-medium text-muted-foreground whitespace-nowrap text-right">Preço unitário</TableHead>
                        <TableHead className="font-medium text-muted-foreground whitespace-nowrap text-right">Total</TableHead>
                        <TableHead className="font-medium text-muted-foreground whitespace-nowrap">Data do lançamento</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((item) => {
                        const relatedAsset = assets.find(a => a.id === item.asset);
                        const isBuy = item.activity_type === 'BUY';
                        const isSell = item.activity_type === 'SELL';
                        const total = item.quantity * item.unit_price;
                        
                        // Formatar vencimento se existir
                        let dueDateStr = '-';
                        if (relatedAsset?.due_date) {
                          try {
                            dueDateStr = format(new Date(relatedAsset.due_date), 'dd/MM/yyyy');
                          } catch(e) {
                            dueDateStr = relatedAsset.due_date;
                          }
                        }
                        
                        return (
                          <TableRow key={item.id} className="hover:bg-muted/10 group">
                            <TableCell className="font-medium pl-6 py-4">{item.asset_ticker || item.asset_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-muted/50 text-muted-foreground hover:bg-muted/50 rounded-sm font-normal whitespace-nowrap">
                                <Briefcase className="mr-1.5 h-3 w-3" />
                                {ASSET_TYPE_LABELS[relatedAsset?.asset_type || 'OTHER'] || relatedAsset?.asset_type || 'Outros'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {isBuy ? (
                                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                                ) : isSell ? (
                                  <TrendingDown className="h-4 w-4 text-rose-500" />
                                ) : (
                                  <Info className="h-4 w-4 text-blue-500" />
                                )}
                                <span className={isBuy ? "text-emerald-600 dark:text-emerald-400 font-medium" : isSell ? "text-rose-600 dark:text-rose-400 font-medium" : "text-blue-600 dark:text-blue-400 font-medium"}>
                                  {isBuy ? 'Compra' : isSell ? 'Venda' : item.activity_type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{dueDateStr}</TableCell>
                            <TableCell className="text-right">
                              <span className="flex items-center justify-end gap-1">
                                {Number(item.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{formatMoney(item.unit_price, 'BRL')}</TableCell>
                            <TableCell className="text-right font-medium">{formatMoney(total, 'BRL')}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(item.date), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-center pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Editar Lançamento</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(item.id)} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Excluir lançamento</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Edit Modal */}
      {editingActivity && (
        <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Lançamento: {editingActivity.asset_ticker}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input 
                  type="number" 
                  step="0.00000001" 
                  value={editForm.quantity} 
                  onChange={e => setEditForm({...editForm, quantity: parseFloat(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Unitário (R$)</Label>
                <CurrencyInput 
                  value={editForm.unit_price} 
                  onChange={val => setEditForm({...editForm, unit_price: val})} 
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Lançamento</Label>
                <Input 
                  type="date" 
                  value={editForm.date} 
                  onChange={e => setEditForm({...editForm, date: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingActivity(null)}>Cancelar</Button>
              <Button onClick={submitEdit}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
