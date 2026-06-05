import { useMemo, useState, useEffect } from "react";
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
import { Wallet, Plus, FolderPlus, GripVertical, MoreHorizontal, Edit, Trash, ChevronLeft, ChevronRight, Shield, ArrowDownToLine, Eraser, ChevronDown, Target, MoreVertical, Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
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
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { IncomeSplitterModal } from "@/modules/finance/components/IncomeSplitterModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

// --- Month Selector Component ---

const MonthSelector = () => {
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
    <div className="flex items-center gap-2 sm:gap-4 bg-muted/20 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-border/40 shadow-sm">
      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" onClick={handlePrev} data-testid="prev-month">
        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
      <div className="flex flex-col items-center min-w-[100px] sm:min-w-[120px]">
        <span className="text-xs sm:text-sm font-bold text-foreground leading-none">
          {monthNames[currentMonth - 1]}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-black mt-0.5 sm:mt-1">
          {currentYear}
        </span>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" onClick={handleNext} data-testid="next-month">
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
};

// --- Category Actions Component ---

interface CategoryActionsProps {
  category: CategoryNode;
  isGroup?: boolean;
}

const CategoryActions = ({ category, isGroup }: CategoryActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [macroAllocation, setMacroAllocation] = useState<'NEEDS' | 'WANTS' | 'SAVINGS' | 'NONE'>(category.macro_allocation || 'NONE');
  const { updateCategory, deleteCategory } = useAccountStore();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCategory(category.id, { name: editedName, macro_allocation: macroAllocation });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async () => {
    const type = isGroup ? "grupo" : "categoria";
    if (window.confirm(`Tem certeza que deseja excluir o ${type} "${category.name}"?`)) {
      await deleteCategory(category.id);
    }
  };

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
    readyToAssignBalance,
    fetchCategoryGroups,
    assignMoney,
    autoAssign,
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
    totalsByCurrency,
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
  
  const { convert } = useCurrencyStore();
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [cascadeOpen, setCascadeOpen] = useState(false);
  const [rebalancing, setRebalancing] = useState<string | null>(null);
  const [isPendingIncomesModalOpen, setIsPendingIncomesModalOpen] = useState(false);

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
      const isCorrectPeriod = month === currentMonth && year === currentYear;
      return t.is_income && !t.transfer_group && isCorrectPeriod;
    });
  }, [transactions, currentMonth, currentYear]);

  const distributedIncomes = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];
    
    // 1. Filtrar transações que são receitas e têm transfer_group (já processadas)
    // Excluindo as que são fruto de distribuição (para não duplicar na lista de origens)
    const incomes = txs.filter(t => 
      t &&
      t.is_income && 
      t.transfer_group && 
      typeof t.description === "string" &&
      !t.description.includes("Recebido de Distribuição")
    );
    
    return incomes.map(income => {
      const acc = getAccount(income.account);
      const currency = acc?.currency || "EUR";

      // 2. Encontrar as transações de destino que compartilham o mesmo grupo
      const destinations = txs.filter(t => 
        t &&
        t.transfer_group === income.transfer_group && 
        t.is_income && 
        t.id !== income.id
      );
      
      const isKept = destinations.length === 0;

      return {
        ...income,
        currency,
        isKept,
        details: isKept 
          ? [{ account: income.account, amount: income.amount, name: `Mantido em: ${acc?.name || "Conta"}` }]
          : destinations.map(d => ({
            account: d.account,
            amount: d.amount,
            name: getAccountName(d.account)
          }))
      };
    }).sort((a, b) => {
      if (!a.date || !b.date || typeof a.date !== "string" || typeof b.date !== "string") return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions, getAccount, getAccountName]);

  const totalAssigned = useMemo(() => {
    const calculateTotal = (nodes: CategoryNode[]): number => {
      const safeNodes = Array.isArray(nodes) ? nodes : [];
      return safeNodes.reduce((acc, node) => {
        if (!node) return acc;
        let sum = acc + (node.assigned_amount || 0);
        if (Array.isArray(node.children)) sum += calculateTotal(node.children);
        return sum;
      }, 0);
    };
    return calculateTotal(categoryGroups);
  }, [categoryGroups]);

  // Flatten all leaf categories for the cascade dropdown
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
    setCascadeOpen(false);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const groups = Array.isArray(categoryGroups) ? categoryGroups : [];
    const isActiveGroup = groups.some(g => g && g.id === active.id);
    if (isActiveGroup) {
      const oldIndex = groups.findIndex(g => g && g.id === active.id);
      const newIndex = groups.findIndex(g => g && g.id === over.id);
      setCategoryGroups(arrayMove(groups, oldIndex, newIndex));
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await addCategoryGroup(newGroupName);
    setNewGroupName("");
    setIsGroupDialogOpen(false); // Fecha a modal após criar
  };

  const handleAddCategory = async (groupId: string) => {
    if (!newCatName.trim()) return;
    await addCategory(groupId, newCatName);
    setNewCatName("");
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Budget Header */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-primary/10 border border-primary/20 p-4 sm:p-6 shadow-soft">
        <div className="relative flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Orçamento Mensal
          </h1>

          <div className="flex items-center gap-2">
            <MonthSelector />
            
            {/* Consolidated "⋮" Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-muted/20 border border-border/40">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-border/60 w-56">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-black opacity-70">Ações do Orçamento</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <IncomeSplitterModal
                    trigger={
                      <div className="w-full flex items-center gap-2 cursor-pointer px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted/5 rounded-md">
                        <Landmark className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>Capturar Receita</span>
                      </div>
                    }
                  />
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={autoAssignFunds} className="cursor-pointer gap-2 text-xs font-medium">
                  <Target className="h-4 w-4 text-sky-400" />
                  <span>Financiar Metas</span>
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={() => handleAutoShield()} className="cursor-pointer gap-2 text-xs font-medium">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span>Cobrir Rombos</span>
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={() => handleSurplusSweep()} className="cursor-pointer gap-2 text-xs font-medium">
                  <ArrowDownToLine className="h-4 w-4 text-sky-400" />
                  <span>Recolher Sobras</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Submenu para Limpar Mês (Cascata) */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer gap-2 text-xs font-medium">
                    <Eraser className="h-4 w-4 text-violet-400" />
                    <span>Limpar Mês (Cascata)</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="glass border-border/60 max-h-60 overflow-y-auto w-48">
                      {leafCategories.map(cat => (
                        <DropdownMenuItem key={cat.id} onSelect={() => handleCascade(cat.id)} className="cursor-pointer text-xs">
                          {cat.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Highlighted Core Metric (Ready to Assign) */}
        <div className="w-full flex justify-center py-3 sm:py-5">
          <div className={cn(
            "flex flex-col items-center justify-center text-center px-8 py-5 sm:px-12 sm:py-6 rounded-2xl sm:rounded-3xl border shadow-lg transition-all duration-300 w-full max-w-sm sm:max-w-md",
            readyToAssignBalance > 0
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : readyToAssignBalance < 0
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-muted/20 border-border/40 text-muted-foreground"
          )}>
            <Wallet className="h-6 w-6 sm:h-8 sm:w-8 mb-2 shrink-0 text-primary animate-pulse" />
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-black opacity-70 mb-1">Disponível para Alocar</span>
            <span className="text-2xl sm:text-4xl font-black tracking-tight leading-none" data-testid="rta-balance">
              {formatMoney(readyToAssignBalance, "EUR")}
            </span>
          </div>
        </div>

        {/* Elegant Pending Incomes Alert Banner */}
        {currentIncomes.length > 0 && (
          <div className="mt-4 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                Você tem {currentIncomes.length} {currentIncomes.length === 1 ? "receita pendente" : "receitas pendentes"} para distribuir.
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={() => setIsPendingIncomesModalOpen(true)}
              className="gradient-primary text-xs font-bold rounded-lg h-7 px-3 shrink-0"
            >
              Ver Lançamentos
            </Button>
          </div>
        )}
      </section>

      {/* Distributed Incomes Section - Separated Container */}
      {distributedIncomes.length > 0 && (
        <section className="rounded-2xl sm:rounded-3xl bg-card/40 border border-border/60 p-3 sm:p-6 shadow-sm transition-all duration-300">
          <h3 className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-bold mb-3 sm:mb-6 text-center sm:text-left">Histórico de Receitas Processadas</h3>
          
          {/* Layout Mobile (Lista de Cards) */}
          <div className="block sm:hidden space-y-2">
            {distributedIncomes.map(income => (
              <div key={income.id} className="bg-background/25 border border-border/40 rounded-xl p-2.5 space-y-2 hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs sm:text-sm text-foreground">{income.description || "Receita"}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mt-0.5">{income.date}</span>
                  </div>
                  <span className="font-black text-xs sm:text-sm text-primary shrink-0">
                    {formatMoney(income.amount, income.currency as any)}
                  </span>
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

          {/* Layout Desktop (Tabela) */}
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
                    <TableCell className="font-black text-sm text-primary">
                      {formatMoney(income.amount, income.currency as any)}
                    </TableCell>
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
        </section>
      )}

      {activeGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 sm:p-16 border border-dashed border-border/60 rounded-3xl bg-card/25 backdrop-blur-sm gap-4 animate-in fade-in duration-300">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground">Sem Grupos de Categorias</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Você ainda não possui nenhum grupo de categorias de orçamento configurado neste período. Crie o seu primeiro grupo de planejamento para começar.
            </p>
          </div>
          <Button onClick={() => setIsGroupDialogOpen(true)} className="gradient-primary rounded-xl gap-1.5 font-bold px-5">
            <FolderPlus className="h-4 w-4" />
            Criar Primeiro Grupo
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={activeGroups.map(g => g.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {activeGroups.map((group) => (
                <SortableItem key={group.id} id={group.id} isGroup>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">{group.name}</h2>
                        
                        <div className="flex items-center gap-1">
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
                                  <Button onClick={() => handleAddCategory(group.id)} className="gradient-primary w-full">Adicionar Categoria</Button>
                                </DialogFooter>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <CategoryActions category={group} isGroup />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Total: {formatMoney((Array.isArray(group.children) ? group.children : []).reduce((a, b) => a + ((b && b.assigned_amount) || 0), 0), "EUR")}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="hover:bg-transparent border-border/40">
                            <TableHead className="w-[40px] p-2 sm:p-4 h-auto"></TableHead>
                            <TableHead className="w-1/2 p-2 sm:p-4 h-auto text-xs sm:text-sm">Categoria</TableHead>
                            <TableHead className="text-right hidden sm:table-cell p-2 sm:p-4 h-auto text-xs sm:text-sm">
                              <div className="flex items-center justify-end gap-1">
                                Reservado
                                <HelpTooltip content="O valor que você planejou gastar nesta categoria." side="top" />
                              </div>
                            </TableHead>
                            <TableHead className="text-right hidden sm:table-cell p-2 sm:p-4 h-auto text-xs sm:text-sm">
                              <div className="flex items-center justify-end gap-1">
                                Gasto
                                <HelpTooltip content="O quanto já foi de fato gasto." side="top" />
                              </div>
                            </TableHead>
                            <TableHead className="text-right p-2 sm:p-4 h-auto text-xs sm:text-sm">
                              <div className="flex items-center justify-end gap-1">
                                Disponível
                                <HelpTooltip content="Quanto ainda resta para você gastar nesta categoria." side="top" />
                              </div>
                            </TableHead>
                            <TableHead className="w-[50px] hidden sm:table-cell p-2 sm:p-4 h-auto text-xs sm:text-sm"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const rawChildren = (Array.isArray(group.children) ? group.children : [])
                              .filter(c => c && c.id && (typeof c.id === "string" || typeof c.id === "number"));
                            const seenChildren = new Set();
                            const children = rawChildren.filter(c => {
                              if (seenChildren.has(c.id)) return false;
                              seenChildren.add(c.id);
                              return true;
                            });

                            return (
                              <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                {children.length === 0 ? (
                                  <TableRow><TableCell colSpan={6} className="h-16 text-center text-muted-foreground italic text-xs">Vazio.</TableCell></TableRow>
                                ) : (
                                  children.map((cat) => (
                                    <SortableCategoryRow key={cat.id} cat={cat} assignMoney={assignMoney} />
                                  ))
                                )}
                              </SortableContext>
                            );
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 50/30/20 Rule Macro Tracking Panel - Relocated to the bottom */}
      <section className="rounded-2xl sm:rounded-3xl bg-card/30 border border-border/40 p-4 sm:p-6 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs sm:text-sm uppercase tracking-widest text-primary font-bold">Acompanhamento Regra 50/30/20 (Alocado / Meta)</h3>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Orçamento Base-Zero</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Necessidades (Needs)",
              current: macroDist.needsPct,
              target: targetNeeds,
              amount: macroDist.needsAssigned,
              color: macroDist.needsPct > targetNeeds + 5 ? "bg-rose-500" : macroDist.needsPct > targetNeeds ? "bg-amber-500" : "bg-emerald-500",
              textColor: macroDist.needsPct > targetNeeds + 5 ? "text-rose-400" : macroDist.needsPct > targetNeeds ? "text-amber-400" : "text-emerald-400",
              bgColor: macroDist.needsPct > targetNeeds + 5 ? "bg-rose-500/10 border-rose-500/20" : macroDist.needsPct > targetNeeds ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              label: "Desejos (Wants)",
              current: macroDist.wantsPct,
              target: targetWants,
              amount: macroDist.wantsAssigned,
              color: macroDist.wantsPct > targetWants + 5 ? "bg-rose-500" : macroDist.wantsPct > targetWants ? "bg-amber-500" : "bg-emerald-500",
              textColor: macroDist.wantsPct > targetWants + 5 ? "text-rose-400" : macroDist.wantsPct > targetWants ? "text-amber-400" : "text-emerald-400",
              bgColor: macroDist.wantsPct > targetWants + 5 ? "bg-rose-500/10 border-rose-500/20" : macroDist.wantsPct > targetWants ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              label: "Poupança (Savings)",
              current: macroDist.savingsPct,
              target: targetSavings,
              amount: macroDist.savingsAssigned,
              color: macroDist.savingsPct > targetSavings + 5 ? "bg-rose-500" : macroDist.savingsPct > targetSavings ? "bg-amber-500" : "bg-emerald-500",
              textColor: macroDist.savingsPct > targetSavings + 5 ? "text-rose-400" : macroDist.savingsPct > targetSavings ? "text-amber-400" : "text-emerald-400",
              bgColor: macroDist.savingsPct > targetSavings + 5 ? "bg-rose-500/10 border-rose-500/20" : macroDist.savingsPct > targetSavings ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20",
            }
          ].map((item, idx) => (
            <div key={idx} className={cn("p-4 rounded-xl border flex flex-col gap-2 transition-all duration-300 hover:scale-[1.01]", item.bgColor)}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">{item.label}</span>
                <span className={cn("text-xs font-black", item.textColor)}>
                  {item.current.toFixed(1)}% <span className="text-[10px] text-muted-foreground/60 font-normal">/ {item.target}%</span>
                </span>
              </div>
              <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500 rounded-full", item.color)} 
                  style={{ width: `${Math.min(item.current, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 mt-1">
                <span>Alocado: {formatMoney(item.amount, "EUR")}</span>
                <span>Renda: {formatMoney(macroDist.totalIncome, "EUR")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dialog for listing pending incomes */}
      <Dialog open={isPendingIncomesModalOpen} onOpenChange={setIsPendingIncomesModalOpen}>
        <DialogContent className="glass border-border/60 w-[94vw] sm:max-w-md rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/30">
            <DialogTitle className="text-lg font-black tracking-tight text-gradient-mixed">
              Receitas Recebidas
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Distribua ou mantenha essas receitas no orçamento.
            </p>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {currentIncomes.map(income => {
              const acc = getAccount(income.account);
              const currency = acc?.currency || "EUR";
              return (
                <div key={income.id} className="flex flex-col gap-2.5 bg-background/40 rounded-xl p-2.5 border border-primary/10 hover:border-primary/30 transition-all group">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-sm text-foreground">{income.description || "Receita"}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Recebido em: {acc?.name || "Conta"} • {income.date}</div>
                    </div>
                    <div className="text-base font-black text-primary shrink-0">
                      {formatMoney(income.amount, currency as any)}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/20">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg border-primary/20 hover:bg-primary/10 hover:text-primary h-7 text-[10px] px-2.5"
                      onClick={() => {
                        keepInAccount(income.id);
                        if (currentIncomes.length <= 1) {
                          setIsPendingIncomesModalOpen(false);
                        }
                      }}
                    >
                      Manter
                    </Button>
                    <DistributionModal 
                      initialSourceAccount={String(income.account)} 
                      initialAmount={String(income.amount)}
                      sourceTransactionId={income.id}
                      trigger={
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (currentIncomes.length <= 1) {
                              setIsPendingIncomesModalOpen(false);
                            }
                          }}
                          className="gradient-primary rounded-lg h-7 text-[10px] px-3"
                        >
                          Distribuir
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Standalone Dialog for Creating a New Category Group */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="glass border-border/60">
          <DialogHeader>
            <DialogTitle>Novo Grupo de Categorias</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGroup} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupName">Nome do Grupo</Label>
              <Input 
                id="groupName" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)} 
                placeholder="Ex: Contas de Consumo..." 
                className="bg-background/50" 
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="gradient-primary w-full">Adicionar Grupo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-20" />
    </div>
  );
};

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

  const available = cat.available_amount ?? ((cat.assigned_amount || 0) - (cat.spent_amount || 0));
  const percentSpent = (cat.assigned_amount || 0) > 0 ? ((cat.spent_amount || 0) / cat.assigned_amount) * 100 : 0;

  return (
    <TableRow ref={setNodeRef} style={style} className="border-border/40 hover:bg-muted/20 transition-colors">
      <TableCell className="w-[40px] p-2 sm:p-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/20 hover:text-primary/40 transition-colors">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </TableCell>
      <TableCell className="p-2 sm:p-4">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs sm:text-sm text-foreground/90">{cat.name}</span>
            {cat.macro_allocation && cat.macro_allocation !== 'NONE' && (
              <span className={cn(
                "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0",
                cat.macro_allocation === 'NEEDS' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                cat.macro_allocation === 'WANTS' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                cat.macro_allocation === 'SAVINGS' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}>
                {cat.macro_allocation === 'NEEDS' ? '50%' : cat.macro_allocation === 'WANTS' ? '30%' : '20%'}
              </span>
            )}
          </div>
          <Progress value={percentSpent} className="h-0.5 sm:h-1 w-16 sm:w-32" />
        </div>
      </TableCell>
      <TableCell className="text-right hidden sm:table-cell p-2 sm:p-4">
        <CurrencyInput
          value={cat.assigned_amount || 0}
          onChange={(val) => assignMoney(cat.id, val)}
          className="w-24 ml-auto h-8 text-right bg-background/50 border-border/40 focus:border-primary/50"
        />
      </TableCell>
      <TableCell className="text-right text-muted-foreground font-medium italic hidden sm:table-cell p-2 sm:p-4">
        {formatMoney(cat.spent_amount || 0, "EUR")}
      </TableCell>
      <TableCell className={cn(
        "text-right font-bold tabular text-xs sm:text-sm p-2 sm:p-4",
        available > 0 ? "text-emerald-400" : available < 0 ? "text-rose-500" : "text-muted-foreground/40"
      )}>
        {formatMoney(available, "EUR")}
      </TableCell>
      <TableCell className="hidden sm:table-cell p-2 sm:p-4">
        <CategoryActions category={cat} />
      </TableCell>
    </TableRow>
  );
};

export default Budget;
