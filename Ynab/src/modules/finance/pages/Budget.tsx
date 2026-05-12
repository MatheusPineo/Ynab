import { useMemo, useState, useEffect } from "react";
import { useAccountStore, CategoryGroup, CategoryNode } from "@/modules/finance/store/useAccountStore";
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
import { Progress } from "@/shared/components/ui/progress";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { Wallet, Plus, FolderPlus, GripVertical, MoreHorizontal, Edit, Trash, ChevronLeft, ChevronRight } from "lucide-react";
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
  const { updateCategory, deleteCategory } = useAccountStore();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCategory(category.id, { name: editedName });
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
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
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
    totalsByCurrency
  } = useAccountStore();
  
  const { convert } = useCurrencyStore();
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

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
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-primary/10 border border-primary/20 p-3.5 sm:p-8 shadow-soft">
        <div className="relative flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1 sm:gap-2">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground">
              Orçamento Mensal
            </h1>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-3">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsGroupDialogOpen(true)}
                className="border-primary/20 hover:bg-primary/10 rounded-xl h-8 sm:h-10 text-[10px] sm:text-xs gap-1 sm:gap-1.5 font-bold"
              >
                <FolderPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Novo Grupo
              </Button>
              <MonthSelector />
            </div>
          </div>
        </div>

        {/* New Income Section */}
        {currentIncomes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-primary/10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-[10px] sm:text-xs uppercase tracking-wider text-primary font-bold">
                Receitas Recebidas <span className="opacity-70 font-normal">(Aguardando Distribuição)</span>
              </h3>
              <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-bold shrink-0">
                {currentIncomes.length} {currentIncomes.length === 1 ? "pendente" : "pendentes"}
              </span>
            </div>
            <div className="grid gap-2">
              {currentIncomes.map(income => {
                const acc = getAccount(income.account);
                const currency = acc?.currency || "EUR";
                return (
                  <div key={income.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-background/40 rounded-xl p-2.5 border border-primary/10 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                        <Plus className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{income.description || "Receita"}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Recebido em: {acc?.name || "Conta"} • {income.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0">
                      <div className="text-base sm:text-xl font-black text-primary">
                        {formatMoney(income.amount, currency as any)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-lg border-primary/20 hover:bg-primary/10 h-7 text-[10px] sm:text-xs px-2.5"
                          onClick={() => keepInAccount(income.id)}
                        >
                          Manter
                        </Button>
                        <DistributionModal 
                          initialSourceAccount={String(income.account)} 
                          initialAmount={String(income.amount)}
                          sourceTransactionId={income.id}
                          trigger={
                            <Button size="sm" className="gradient-primary rounded-lg h-7 text-[10px] sm:text-xs px-3">
                              Distribuir
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

  const available = (cat.assigned_amount || 0) - (cat.spent_amount || 0);
  const percentSpent = (cat.assigned_amount || 0) > 0 ? ((cat.spent_amount || 0) / cat.assigned_amount) * 100 : 0;

  return (
    <TableRow ref={setNodeRef} style={style} className="border-border/40 hover:bg-muted/20 transition-colors">
      <TableCell className="w-[40px] p-2 sm:p-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/20 hover:text-primary/40 transition-colors">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </TableCell>
      <TableCell className="p-2 sm:p-4">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <span className="font-semibold text-xs sm:text-sm text-foreground/90">{cat.name}</span>
          <Progress value={percentSpent} className="h-0.5 sm:h-1 w-16 sm:w-32" />
        </div>
      </TableCell>
      <TableCell className="text-right hidden sm:table-cell p-2 sm:p-4">
        <Input
          type="number"
          value={cat.assigned_amount}
          onChange={(e) => assignMoney(cat.id, parseFloat(e.target.value) || 0)}
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
