import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccountStore, CategoryGroup, CategoryNode, selectMacroDistribution } from "@/modules/finance/store/useAccountStore";
import { useShallow } from "zustand/shallow";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { useCurrencyStore, type Currency } from "@/modules/finance/store/useCurrencyStore";
import { formatMoney } from "@/shared/lib/currency-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { CurrencyInput } from "@/shared/components/ui/currency-input";
import { Progress } from "@/shared/components/ui/progress";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { Wallet, Plus, FolderPlus, GripVertical, MoreHorizontal, Edit, Trash, ChevronLeft, ChevronRight, Shield, ArrowDownToLine, Eraser, ChevronDown, Target, MoreVertical, Landmark, RefreshCw, ArrowRightLeft, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/shared/components/ui/dropdown-menu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DistributionModal } from "@/modules/finance/components/DistributionModal";
import { MoveMoneyModal } from "@/modules/finance/components/MoveMoneyModal";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { IncomeSplitterModal } from "@/modules/finance/components/IncomeSplitterModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

// --- Month Selector Component ---

const MonthSelector = ({ isCompact }: { isCompact?: boolean }) => {
  const { currentMonth, currentYear, setCurrentPeriod } = useAccountStore();
  
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handlePrev = () => {
    if (currentMonth === 1) {
      setCurrentPeriod(12, currentYear - 1);
    } else {
      setCurrentPeriod(currentMonth - 1, currentYear);
    }
  };

  const handleNext = () => {
    if (currentMonth === 12) {
      setCurrentPeriod(1, currentYear + 1);
    } else {
      setCurrentPeriod(currentMonth + 1, currentYear);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 sm:gap-3 bg-muted/20 border border-border/40 shadow-sm transition-all",
      isCompact ? "px-1.5 py-0.5 rounded-xl" : "px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl"
    )}>
      <Button variant="ghost" size="icon" className={cn("rounded-full transition-all", isCompact ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8")} onClick={handlePrev} data-testid="prev-month">
        <ChevronLeft className={cn("transition-all", isCompact ? "h-3 w-3" : "h-3.5 w-3.5 sm:h-4 sm:w-4")} />
      </Button>
      <div className={cn("flex flex-col items-center transition-all", isCompact ? "min-w-[80px]" : "min-w-[100px] sm:min-w-[120px]")}>
        <span className={cn("font-bold text-foreground leading-none transition-all", isCompact ? "text-[11px]" : "text-xs sm:text-sm")}>
          {monthNames[currentMonth - 1]}
        </span>
        <span className={cn("uppercase tracking-widest text-muted-foreground font-black transition-all", isCompact ? "text-[8px] mt-0.5" : "text-[9px] sm:text-[10px] mt-0.5 sm:mt-1")}>
          {currentYear}
        </span>
      </div>
      <Button variant="ghost" size="icon" className={cn("rounded-full transition-all", isCompact ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8")} onClick={handleNext} data-testid="next-month">
        <ChevronRight className={cn("transition-all", isCompact ? "h-3 w-3" : "h-3.5 w-3.5 sm:h-4 sm:w-4")} />
      </Button>
    </div>
  );
};

// --- Category Actions Component ---

// --- Category Actions Component ---

interface CategoryActionsProps {
  category: CategoryNode;
  isGroup?: boolean;
}

const CategoryActions = ({ category, isGroup }: CategoryActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [macroAllocation, setMacroAllocation] = useState<'NEEDS' | 'WANTS' | 'SAVINGS' | 'NONE'>(category.macro_allocation || 'NONE');
  const [editedCurrency, setEditedCurrency] = useState<'EUR' | 'BRL'>(category.currency as any || 'EUR');
  const [editedParent, setEditedParent] = useState<string | null>(category.parent);
  
  const { updateCategory, deleteCategory, categoryGroups } = useAccountStore();

  useEffect(() => {
    if (isEditDialogOpen) {
      setEditedName(category.name);
      setMacroAllocation(category.macro_allocation || 'NONE');
      setEditedCurrency(category.currency as any || 'EUR');
      setEditedParent(category.parent);
    }
  }, [isEditDialogOpen, category]);

  const availableGroupsForCurrency = useMemo(() => {
    const rawGroups = Array.isArray(categoryGroups) ? categoryGroups : [];
    return rawGroups.filter(g => g && !g.parent && g.currency === editedCurrency && g.id !== category.id);
  }, [categoryGroups, editedCurrency, category.id]);

  useEffect(() => {
    if (!isGroup) {
      const parentIsCompatible = availableGroupsForCurrency.some(g => g.id === editedParent);
      if (!parentIsCompatible) {
        if (availableGroupsForCurrency.length > 0) {
          setEditedParent(availableGroupsForCurrency[0].id);
        } else {
          setEditedParent(null);
        }
      }
    }
  }, [editedCurrency, availableGroupsForCurrency, isGroup, editedParent]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCategory(category.id, { 
      name: editedName, 
      macro_allocation: macroAllocation,
      currency: editedCurrency,
      parent: isGroup ? null : editedParent
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async () => {
    const type = isGroup ? "grupo" : "categoria";
    if (window.confirm(`Tem certeza que deseja excluir o ${type} "${category.name}"?`)) {
      await deleteCategory(category.id);
    }
  };

  // Calcula o saldo disponível da categoria para alimentar o modal de transferência
  const available = category.available_amount ?? ((category.assigned_amount || 0) - (category.spent_amount || 0));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          
          {/* Opção de transferência adicionada dentro do menu de ações */}
          {!isGroup && (
            <MoveMoneyModal
              sourceCategory={category}
              currentAvailable={available}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <ArrowRightLeft className="mr-2 h-4 w-4 text-muted-foreground" />
                  Transferir Saldo
                </DropdownMenuItem>
              }
            />
          )}

          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsEditDialogOpen(true); }}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDelete} className="text-red-500">
            <Trash className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-border/60">
          <DialogHeader>
            <DialogTitle>Editar {isGroup ? "Grupo" : "Categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select
                value={editedCurrency}
                onValueChange={(val: any) => setEditedCurrency(val)}
              >
                <SelectTrigger id="currency" className="bg-background/50">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isGroup && (
              <div className="grid gap-2">
                <Label htmlFor="parentGroup">Grupo da Categoria</Label>
                <Select
                  value={editedParent || "none"}
                  onValueChange={(val) => setEditedParent(val === "none" ? null : val)}
                >
                  <SelectTrigger id="parentGroup" className="bg-background/50">
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border/60">
                    <SelectItem value="none">Nenhum (Grupo Raiz)</SelectItem>
                    {availableGroupsForCurrency.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="macro">Classificação 50/30/20</Label>
              <Select
                value={macroAllocation}
                onValueChange={(val: any) => setMacroAllocation(val)}
              >
                <SelectTrigger id="macro" className="bg-background/50">
                  <SelectValue placeholder="Selecione um pilar" />
                </SelectTrigger>
                <SelectContent className="glass border-border/60">
                  <SelectItem value="NONE">Não Rastrear</SelectItem>
                  <SelectItem value="NEEDS">Necessidade (50%)</SelectItem>
                  <SelectItem value="WANTS">Desejo (30%)</SelectItem>
                  <SelectItem value="SAVINGS">Poupança (20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full gradient-primary">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// --- Sortable Item Component ---

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  isGroup?: boolean;
}

const SortableItem = ({ id, children, isGroup }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isGroup ? "mb-10" : "")}>
      <div className="flex items-center gap-2 group">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/30 hover:text-primary/50 transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

const Budget = () => {
  const {
    categoryGroups,
    tree,
    fetchCategoryGroups,
    assignMoney,
    addCategoryGroup,
    addCategory,
    setCategoryGroups,
    transactions,
    currentMonth,
    currentYear,
    fetchTransactions,
    fetchAccounts,
    getAccount,
    getAccountName,
    keepInAccount,
    autoShield,
    surplusSweep,
    monthEndCascade,
    autoAssignFunds,
  } = useAccountStore();
  
  const { user } = useAuthStore();
  const macroDist = useAccountStore(useShallow(selectMacroDistribution));
  
  const targetNeeds = user?.needsTargetPct ?? 50;
  const targetWants = user?.wantsTargetPct ?? 30;
  const targetSavings = user?.savingsTargetPct ?? 20;
  
  const [currency, setCurrency] = useState<'EUR' | 'BRL'>('EUR');
  const [newGroupName, setNewGroupName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [rebalancing, setRebalancing] = useState<string | null>(null);
  const [isPendingIncomesModalOpen, setIsPendingIncomesModalOpen] = useState(false);
  const [groupCurrency, setGroupCurrency] = useState<'EUR' | 'BRL'>('EUR');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (groupId: string) => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchCategoryGroups();
    fetchTransactions();
    fetchAccounts();
  }, [fetchCategoryGroups, fetchTransactions, fetchAccounts]);

  const currentIncomes = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];
    return txs.filter(t => {
      if (!t || !t.date || typeof t.date !== "string") return false;
      const parts = t.date.split('-');
      if (parts.length < 2) return false;
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      return t.is_income && !t.transfer_group && month === currentMonth && year === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const distributedIncomes = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];
    const incomes = txs.filter(t => 
      t && t.is_income && t.transfer_group && typeof t.description === "string" && !t.description.includes("Recebido de Distribuição")
    );
    
    return incomes.map(income => {
      const acc = getAccount(income.account);
      const currency = acc?.currency || "EUR";
      const destinations = txs.filter(t => t && t.transfer_group === income.transfer_group && t.is_income && t.id !== income.id);
      const isKept = destinations.length === 0;

      return {
        ...income,
        currency,
        isKept,
        details: isKept 
          ? [{ account: income.account, amount: income.amount, name: `Mantido em: ${acc?.name || "Conta"}` }]
          : destinations.map(d => ({ account: d.account, amount: d.amount, name: getAccountName(d.account) }))
      };
    }).sort((a, b) => {
      if (!a.date || !b.date || typeof a.date !== "string" || typeof b.date !== "string") return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions, getAccount, getAccountName]);

  const leafCategories = useMemo(() => {
    const leaves: { id: string; name: string }[] = [];
    const walk = (nodes: CategoryNode[]) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n) continue;
        if (n.children && n.children.length > 0) {
          walk(n.children);
        } else {
          leaves.push({ id: n.id, name: n.name });
        }
      }
    };
    walk(categoryGroups);
    return leaves;
  }, [categoryGroups]);

  const handleAutoShield = async () => {
    setRebalancing('shield');
    try { await autoShield(); } finally { setRebalancing(null); }
  };

  const handleSurplusSweep = async () => {
    setRebalancing('sweep');
    try { await surplusSweep(); } finally { setRebalancing(null); }
  };

  const handleCascade = async (targetId: string) => {
    setRebalancing('cascade');
    try { await monthEndCascade(targetId); } finally { setRebalancing(null); }
  };

  const activeGroups = useMemo(() => {
    const raw = (Array.isArray(categoryGroups) ? categoryGroups : [])
      .filter(g => g && g.id && (typeof g.id === "string" || typeof g.id === "number") && typeof g.name === "string" && g.name.trim().toUpperCase() !== "TESTE");
    const seen = new Set();
    return raw.filter(g => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }, [categoryGroups]);

  const isBrlGroup = (g: CategoryNode) => g.currency === 'BRL' || (Array.isArray(g.children) && g.children.length > 0 && g.children.some(c => c.currency === 'BRL'));
  
  const eurGroups = useMemo(() => activeGroups.filter(g => !isBrlGroup(g)), [activeGroups]);
  const brlGroups = useMemo(() => activeGroups.filter(g => isBrlGroup(g)), [activeGroups]);

  const accountTotals = useMemo(() => {
    const totals = { EUR: 0, BRL: 0 };
    const walk = (nodes: any[]) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (!node) continue;
        if (!node.exclude_from_totals && node.account_type !== 'investment' && node.account_type !== 'LOAN_GIVEN') {
          const currency = node.currency || 'EUR';
          if (currency === 'EUR') {
            totals.EUR += Number(node.balance) || 0;
          } else if (currency === 'BRL') {
            totals.BRL += Number(node.balance) || 0;
          }
        }
        if (Array.isArray(node.children)) walk(node.children);
      }
    };
    walk(tree);
    return totals;
  }, [tree]);

  const categoryAvailableTotals = useMemo(() => {
    const totals = { EUR: 0, BRL: 0 };
    const walk = (nodes: CategoryNode[]) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (!node) continue;
        if (node.children && node.children.length > 0) {
          walk(node.children);
        } else {
          const currency = node.currency || 'EUR';
          const available = node.available_amount ?? ((node.assigned_amount || 0) - (node.spent_amount || 0));
          if (currency === 'EUR') {
            totals.EUR += available;
          } else if (currency === 'BRL') {
            totals.BRL += available;
          }
        }
      }
    };
    walk(categoryGroups);
    return totals;
  }, [categoryGroups]);

  const rtaEUR = useMemo(() => accountTotals.EUR - categoryAvailableTotals.EUR, [accountTotals.EUR, categoryAvailableTotals.EUR]);
  const rtaBRL = useMemo(() => accountTotals.BRL - categoryAvailableTotals.BRL, [accountTotals.BRL, categoryAvailableTotals.BRL]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await addCategoryGroup(newGroupName, groupCurrency);
    setNewGroupName("");
    setIsGroupDialogOpen(false);
  };

  const handleAddCategory = async (groupId: string, currency: 'EUR' | 'BRL') => {
    if (!newCatName.trim()) return;
    await addCategory(groupId, newCatName, currency);
    setNewCatName("");
  };

  const renderBudgetBoard = (groups: CategoryNode[], boardCurrency: 'EUR' | 'BRL') => {
    return (
      <div className="flex flex-col gap-6 bg-card/10 border border-border/40 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h2 className="text-base font-black uppercase tracking-wider text-primary">
            Quadro de Orçamento — {boardCurrency} ({boardCurrency === 'BRL' ? 'R$' : '€'})
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setGroupCurrency(boardCurrency);
              setIsGroupDialogOpen(true);
            }}
            className="rounded-xl border-primary/20 hover:bg-primary/10 hover:text-primary h-8 gap-1.5 font-bold"
          >
            <FolderPlus className="h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/60 rounded-2xl bg-card/25 gap-2">
            <span className="text-xs text-muted-foreground">Nenhum grupo de categorias cadastrado em {boardCurrency}.</span>
          </div>
        ) : (
          <div className="space-y-4 pb-12">
            <div className="hidden sm:flex items-center justify-end pr-4 pl-7 text-[10px] uppercase font-black tracking-wider text-muted-foreground gap-2 sm:gap-6 mb-2">
              <div className="w-[120px] text-right shrink-0">Separei</div>
              <div className="w-[90px] text-right shrink-0">Gastei</div>
              <div className="w-[100px] text-right shrink-0">Sobrou</div>
            </div>

            {groups.map((group, idx) => {
              const isExpanded = expandedGroups[group.id] !== false; // Default to true
              const groupAssigned = group.children?.reduce((acc, cat) => acc + Number(cat.assigned_amount || 0), 0) || 0;
              const groupSpent = group.children?.reduce((acc, cat) => acc + Number(cat.spent_amount || 0), 0) || 0;
              const groupAvailable = groupAssigned - groupSpent;

              return (
                <motion.div 
                  key={group.id} 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-card border border-border/40 rounded-3xl overflow-hidden hover:border-border/60 transition-colors"
                >
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/40 border border-border/40">
                        <Landmark className="h-4 w-4 text-foreground/80" />
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-semibold text-base sm:text-lg text-foreground tracking-tight">{group.name}</h3>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button data-testid="add-category-button" className="h-5 w-5 rounded-md bg-muted/40 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center">
                              <Plus className="h-3 w-3" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="glass border-border/60">
                            <DialogHeader><DialogTitle>Nova Categoria em "{group.name}"</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="catName">Nome da Categoria</Label>
                                <Input id="catName" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Ex: Cinema..." className="bg-background/50" />
                              </div>
                              <DialogFooter>
                                <Button onClick={() => handleAddCategory(group.id, boardCurrency)} className="gradient-primary w-full">Adicionar Categoria</Button>
                              </DialogFooter>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <CategoryActions category={group} isGroup />
                      </div>
                    </div>
                    
                    <div className="hidden sm:flex items-center justify-end gap-2 sm:gap-6 text-sm shrink-0">
                      <span className="w-[120px] text-right font-medium text-muted-foreground truncate shrink-0">{formatMoney(groupAssigned, boardCurrency)}</span>
                      <span className="w-[90px] text-right font-medium text-muted-foreground truncate shrink-0">{formatMoney(groupSpent, boardCurrency)}</span>
                      <span className={cn("w-[100px] text-right font-bold truncate shrink-0", groupAvailable > 0 ? "text-emerald-500" : groupAvailable < 0 ? "text-rose-500" : "text-muted-foreground")}>
                        {formatMoney(groupAvailable, boardCurrency)}
                      </span>
                    </div>

                    <div className={cn("sm:hidden w-[100px] text-right font-semibold text-sm truncate", groupAvailable > 0 ? "text-emerald-500" : groupAvailable < 0 ? "text-rose-500" : "text-muted-foreground")}>
                      {formatMoney(groupAvailable, boardCurrency)}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden border-t border-border/40"
                      >
                        <div className="flex flex-col bg-background/50">
                          <SortableContext items={(group.children || []).map(c => c.id)} strategy={verticalListSortingStrategy}>
                            {(group.children || []).map(cat => (
                              <SortableCategoryRow key={cat.id} cat={cat} assignMoney={assignMoney} />
                            ))}
                          </SortableContext>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
        <Dialog open={isGroupDialogOpen && groupCurrency === boardCurrency} onOpenChange={(open) => !open && setIsGroupDialogOpen(false)}>
          <DialogContent className="glass border-border/60">
            <DialogHeader><DialogTitle>Novo Grupo de Categorias ({boardCurrency})</DialogTitle></DialogHeader>
            <form onSubmit={handleAddGroup} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor={`groupName-${boardCurrency}`}>Nome do Grupo</Label>
                <Input id={`groupName-${boardCurrency}`} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Contas de Consumo..." className="bg-background/50" required />
              </div>
              <DialogFooter><Button type="submit" className="gradient-primary w-full">Adicionar Grupo</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section className="w-full sticky top-0 z-40 overflow-hidden rounded-2xl border border-border/40 p-3 sm:py-2.5 sm:px-5 bg-background/80 backdrop-blur-xl mb-4 shadow-lg">
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Esquerda: Título + RTA Badge */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground hidden sm:block">Orçamento</h1>
            
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-300",
              (currency === 'EUR' ? rtaEUR : rtaBRL) === 0
                ? "bg-muted/10 border-border/40 text-muted-foreground"
                : (currency === 'EUR' ? rtaEUR : rtaBRL) > 0
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            )}>
              <span className="text-[10px] uppercase font-black tracking-wider opacity-80">Pronto para Alocar:</span>
              <motion.span
                key={`${currency}-${currency === 'EUR' ? rtaEUR : rtaBRL}`}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base sm:text-lg font-black tracking-tight tabular-nums"
              >
                {formatMoney(currency === 'EUR' ? rtaEUR : rtaBRL, currency)}
              </motion.span>
              {(currency === 'EUR' ? rtaEUR : rtaBRL) === 0 && (
                <Check className="text-emerald-400 shrink-0 h-3.5 w-3.5" />
              )}
            </div>
          </div>

          {/* Centro/Direita: Tabs de Moeda, MonthSelector e Ações */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 flex-wrap md:flex-nowrap">
            <Tabs value={currency} onValueChange={(v) => setCurrency(v as 'EUR' | 'BRL')} className="shrink-0">
              <TabsList className="rounded-xl bg-muted/40 p-0.5 h-8">
                <TabsTrigger value="EUR" className="rounded-lg font-bold data-[state=active]:bg-background px-3 text-xs">
                  EUR
                </TabsTrigger>
                <TabsTrigger value="BRL" className="rounded-lg font-bold data-[state=active]:bg-background px-3 text-xs">
                  BRL
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 shrink-0">
              <MonthSelector />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted/20 border border-border/40 h-8 w-8 sm:h-9 sm:w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-border/60 w-56">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-black opacity-70">Ações do Orçamento</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <IncomeSplitterModal trigger={
                      <div className="w-full flex items-center gap-2 cursor-pointer px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/5 rounded-md">
                        <Landmark className="h-4 w-4 shrink-0 text-emerald-400" /><span>Capturar Receita</span>
                      </div>
                    } />
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={autoAssignFunds} className="cursor-pointer gap-2 text-xs font-medium"><Target className="h-4 w-4 text-sky-400" /><span>Financiar Metas</span></DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleAutoShield()} className="cursor-pointer gap-2 text-xs font-medium"><Shield className="h-4 w-4 text-amber-400" /><span>Cobrir Rombos</span></DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleSurplusSweep()} className="cursor-pointer gap-2 text-xs font-medium"><ArrowDownToLine className="h-4 w-4 text-sky-400" /><span>Recolher Sobras</span></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer gap-2 text-xs font-medium"><Eraser className="h-4 w-4 text-violet-400" /><span>Limpar Mês (Cascata)</span></DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="glass border-border/60 max-h-60 overflow-y-auto w-48">
                        {leafCategories.map(cat => (
                          <DropdownMenuItem key={cat.id} onSelect={() => handleCascade(cat.id)} className="cursor-pointer text-xs">{cat.name}</DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {currentIncomes.length > 0 && (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-2 animate-in fade-in duration-300 mt-2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground text-xs">Você tem {currentIncomes.length} receitas pendentes.</span>
            </div>
            <Button size="sm" onClick={() => setIsPendingIncomesModalOpen(true)} className="gradient-primary font-bold rounded-lg shrink-0 h-7 text-xs px-3">Ver Lançamentos</Button>
          </div>
        )}
      </section>

      {distributedIncomes.length > 0 && (
        <section className="rounded-2xl sm:rounded-3xl bg-card/40 border border-border/60 overflow-hidden shadow-sm transition-all duration-300">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 bg-muted/10 hover:bg-muted/20 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={cn("h-4 w-4 text-primary shrink-0", showHistory && "animate-spin-slow")} />
              <h3 className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-bold">
                Histórico de Receitas Processadas
              </h3>
            </div>
            <motion.div animate={{ rotate: showHistory ? 0 : -90 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="border-t border-border/40"
              >
                <div className="p-3 sm:p-6 bg-background/10 space-y-4">
                  <div className="block sm:hidden space-y-2">
                    {distributedIncomes.map(income => (
                      <div key={income.id} className="bg-background/25 border border-border/40 rounded-xl p-2.5 space-y-2 hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs sm:text-sm text-foreground">{income.description || "Receita"}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mt-0.5">{income.date}</span>
                          </div>
                          <span className="font-black text-xs sm:text-sm text-primary shrink-0">{formatMoney(income.amount, income.currency as any)}</span>
                        </div>
                        <div className="pt-2 border-t border-border/20">
                          <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Destino</div>
                          <div className="flex flex-wrap gap-1">
                            {income.details.map((d, i) => (
                              <div key={i} className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 text-[9px]">
                                <span className="font-bold text-muted-foreground/80 uppercase text-[7px]">{d.name}:</span>
                                <span className="font-black text-primary">{formatMoney(d.amount, income.currency as any)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block rounded-2xl border border-border/40 bg-background/20 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow className="hover:bg-transparent border-border/40">
                          <TableHead className="text-xs uppercase tracking-tighter font-bold text-foreground/70">Origem / Data</TableHead>
                          <TableHead className="text-xs uppercase tracking-tighter font-bold text-foreground/70">Valor Total</TableHead>
                          <TableHead className="text-xs uppercase tracking-tighter font-bold text-foreground/70">Destino</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {distributedIncomes.map(income => (
                          <TableRow key={income.id} className="border-border/40 hover:bg-primary/5 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-foreground">{income.description || "Receita"}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">{income.date}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-black text-sm text-primary">{formatMoney(income.amount, income.currency as any)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {income.details.map((d, i) => (
                                  <div key={i} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.name}:</span>
                                    <span className="text-xs font-black text-primary">{formatMoney(d.amount, income.currency as any)}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currency === 'EUR' ? renderBudgetBoard(eurGroups, 'EUR') : renderBudgetBoard(brlGroups, 'BRL')}
      </div>

      <section className="rounded-2xl sm:rounded-3xl bg-card/30 border border-border/40 p-4 sm:p-6 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs sm:text-sm uppercase tracking-widest text-primary font-bold">Acompanhamento Regra 50/30/20</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Necessidades (Needs)", current: macroDist.needsPct, target: targetNeeds, amount: macroDist.needsAssigned, color: macroDist.needsPct > targetNeeds + 5 ? "bg-rose-500" : macroDist.needsPct > targetNeeds ? "bg-amber-500" : "bg-emerald-500", textColor: macroDist.needsPct > targetNeeds + 5 ? "text-rose-400" : macroDist.needsPct > targetNeeds ? "text-amber-400" : "text-emerald-400", bgColor: macroDist.needsPct > targetNeeds + 5 ? "bg-rose-500/10 border-rose-500/20" : macroDist.needsPct > targetNeeds ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Desejos (Wants)", current: macroDist.wantsPct, target: targetWants, amount: macroDist.wantsAssigned, color: macroDist.wantsPct > targetWants + 5 ? "bg-rose-500" : macroDist.wantsPct > targetWants ? "bg-amber-500" : "bg-emerald-500", textColor: macroDist.wantsPct > targetWants + 5 ? "text-rose-400" : macroDist.wantsPct > targetWants ? "text-amber-400" : "text-emerald-400", bgColor: macroDist.wantsPct > targetWants + 5 ? "bg-rose-500/10 border-rose-500/20" : macroDist.wantsPct > targetWants ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Poupança (Savings)", current: macroDist.savingsPct, target: targetSavings, amount: macroDist.savingsAssigned, color: macroDist.savingsPct > targetSavings + 5 ? "bg-rose-500" : macroDist.savingsPct > targetSavings ? "bg-amber-500" : "bg-emerald-500", textColor: macroDist.savingsPct > targetSavings + 5 ? "text-rose-400" : macroDist.savingsPct > targetSavings ? "text-amber-400" : "text-emerald-400", bgColor: macroDist.savingsPct > targetSavings + 5 ? "bg-rose-500/10 border-rose-500/20" : macroDist.savingsPct > targetSavings ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20" }
          ].map((item, idx) => (
            <div key={idx} className={cn("p-4 rounded-xl border flex flex-col gap-2 transition-all duration-300 hover:scale-[1.01]", item.bgColor)}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">{item.label}</span>
                <span className={cn("text-xs font-black", item.textColor)}>{item.current.toFixed(1)}% <span className="text-[10px] text-muted-foreground/60 font-normal">/ {item.target}%</span></span>
              </div>
              <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-500 rounded-full", item.color)} style={{ width: `${Math.min(item.current, 100)}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 mt-1">
                <span>Alocado: {formatMoney(item.amount, "EUR")}</span>
                <span>Renda: {formatMoney(macroDist.totalIncome, "EUR")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={isPendingIncomesModalOpen} onOpenChange={setIsPendingIncomesModalOpen}>
        <DialogContent className="glass border-border/60 w-[94vw] sm:max-w-md rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/30">
            <DialogTitle className="text-lg font-black tracking-tight text-gradient-mixed">Receitas Recebidas</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Distribua ou mantenha essas receitas no orçamento.</p>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {currentIncomes.map(income => {
              const acc = getAccount(income.account);
              return (
                <div key={income.id} className="flex flex-col gap-2.5 bg-background/40 rounded-xl p-2.5 border border-primary/10 hover:border-primary/30 transition-all group">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-sm text-foreground">{income.description || "Receita"}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Recebido em: {acc?.name || "Conta"} • {income.date}</div>
                    </div>
                    <div className="text-base font-black text-primary shrink-0">{formatMoney(income.amount, (acc?.currency || "EUR") as any)}</div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/20">
                    <Button variant="outline" size="sm" className="rounded-lg border-primary/20 hover:bg-primary/10 hover:text-primary h-7 text-[10px] px-2.5" onClick={() => { keepInAccount(income.id); if (currentIncomes.length <= 1) setIsPendingIncomesModalOpen(false); }}>Manter</Button>
                    <DistributionModal initialSourceAccount={String(income.account)} initialAmount={String(income.amount)} sourceTransactionId={income.id} trigger={<Button size="sm" onClick={() => currentIncomes.length <= 1 && setIsPendingIncomesModalOpen(false)} className="gradient-primary rounded-lg h-7 text-[10px] px-3">Distribuir</Button>} />
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      <div className="h-20" />
    </div>
  );
};

// --- Sortable Category Row Component (Optimized State Layout) ---

const SortableCategoryRow = ({ cat, assignMoney }: { cat: CategoryNode, assignMoney: any }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [localValue, setLocalValue] = useState<string | number>(cat.assigned_amount || 0);

  useEffect(() => {
    setLocalValue(cat.assigned_amount || 0);
  }, [cat.assigned_amount]);

  const available = cat.available_amount ?? ((cat.assigned_amount || 0) - (cat.spent_amount || 0));

  const handleSave = async () => {
    const numericVal = Number(localValue) || 0;
    if (numericVal !== Number(cat.assigned_amount)) {
      await assignMoney(cat.id, numericVal);
      setLocalValue(numericVal);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-background hover:bg-muted/10 border-b border-border/30 transition-colors group gap-3 sm:gap-0">
      {/* LEFT SIDE (Drag + Name + Progress) */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors shrink-0">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{cat.name}</p>
          {(() => {
            const pct = cat.assigned_amount > 0 ? Math.min(100, (cat.spent_amount / cat.assigned_amount) * 100) : 0;
            return (
              <Progress
                value={pct}
                className={cn(
                  "h-1.5 mt-2 bg-muted/30 w-24 sm:w-32",
                  pct >= 100 && "[&>div]:bg-rose-500",
                  pct < 100 && pct >= 80 && "[&>div]:bg-amber-500",
                  pct < 80 && "[&>div]:bg-emerald-500"
                )}
              />
            );
          })()}
        </div>
        <CategoryActions category={cat} />
      </div>

      {/* RIGHT SIDE (3 Columns: Separei, Gastei, Sobrou) */}
      <div className="flex flex-row items-center justify-between sm:justify-end gap-2 sm:gap-6 w-full sm:w-auto shrink-0">
        {/* SEPAREI */}
        <div className="flex flex-col items-start sm:items-end w-auto sm:w-[120px]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 sm:hidden">Separei</span>
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{cat.currency === "EUR" ? "€" : "R$"}</span>
            <Input
              type="number" step="0.01"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
              className={cn(
                "w-full h-9 pl-7 pr-2 text-right font-semibold bg-transparent border-border/40 hover:bg-muted/20 focus:bg-background focus:border-primary/50 transition-all rounded-xl",
                Number(localValue) !== Number(cat.assigned_amount) && "text-primary bg-primary/5"
              )}
            />
          </div>
        </div>

        {/* GASTEI */}
        <div className="flex flex-col items-end w-auto sm:w-[90px]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 sm:hidden">Gastei</span>
          <span className="text-sm font-medium text-muted-foreground truncate">{formatMoney(cat.spent_amount || 0, cat.currency as any || "EUR")}</span>
        </div>

        {/* SOBROU */}
        <div className="flex flex-col items-end w-auto sm:w-[100px]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 sm:hidden">Sobrou</span>
          <span className={cn(
            "text-base font-black tracking-tight truncate",
            available > 0 ? "text-emerald-500" : available < 0 ? "text-rose-500" : "text-muted-foreground/40"
          )}>
            {formatMoney(available, cat.currency as any || "EUR")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Budget;