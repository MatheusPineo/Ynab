import { useMemo, useState, useEffect } from "react";
import { useAccountStore, CategoryGroup, CategoryNode } from "@/store/useAccountStore";
import { formatMoney, netWorth } from "@/data/mockData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wallet, Plus, FolderPlus, GripVertical, MoreHorizontal, Edit, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <div className="flex items-center gap-4 bg-muted/20 px-4 py-2 rounded-2xl border border-border/40 shadow-sm">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex flex-col items-center min-w-[120px]">
        <span className="text-sm font-bold text-foreground leading-none">
          {monthNames[currentMonth - 1]}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mt-1">
          {currentYear}
        </span>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
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
    addCategoryGroup, 
    addCategory, 
    setCategoryGroups 
  } = useAccountStore();
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    fetchCategoryGroups();
  }, [fetchCategoryGroups]);

  const totalCash = useMemo(() => netWorth(tree, "EUR"), [tree]);
  
  const totalAssigned = useMemo(() => {
    const calculateTotal = (nodes: CategoryNode[]): number => {
      return nodes.reduce((acc, node) => {
        let sum = acc + (node.assigned_amount || 0);
        if (node.children) sum += calculateTotal(node.children);
        return sum;
      }, 0);
    };
    return calculateTotal(categoryGroups);
  }, [categoryGroups]);

  const readyToAssign = totalCash - totalAssigned;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isActiveGroup = categoryGroups.some(g => g.id === active.id);
    if (isActiveGroup) {
      const oldIndex = categoryGroups.findIndex(g => g.id === active.id);
      const newIndex = categoryGroups.findIndex(g => g.id === over.id);
      setCategoryGroups(arrayMove(categoryGroups, oldIndex, newIndex));
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await addCategoryGroup(newGroupName);
    setNewGroupName("");
  };

  const handleAddCategory = async (groupId: string) => {
    if (!newCatName.trim()) return;
    await addCategory(groupId, newCatName);
    setNewCatName("");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Budget Header */}
      <section className="relative overflow-hidden rounded-3xl bg-primary/10 border border-primary/20 p-8 shadow-soft">
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-bold">
              <Wallet className="h-4 w-4" />
              Pronto para Alocar
            </div>
            <h1 className={cn(
              "text-5xl font-black tabular tracking-tight transition-colors",
              readyToAssign >= 0 ? "text-primary" : "text-rose-500"
            )}>
              {formatMoney(readyToAssign, "EUR")}
            </h1>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-4">
            <MonthSelector />
            
            <div className="flex flex-col gap-3 max-w-xs text-center sm:text-right">
              <p className="text-sm text-muted-foreground">Patrimônio disponível neste mês.</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-2">
                    <FolderPlus className="h-4 w-4" /> Novo Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-border/60">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Grupo de Orçamento</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddGroup} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="groupName">Nome do Grupo</Label>
                      <Input id="groupName" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Lazer..." className="bg-background/50" />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="gradient-primary w-full">Criar Grupo</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categoryGroups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {categoryGroups.map((group) => (
              <SortableItem key={group.id} id={group.id} isGroup>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">{group.name}</h2>
                      
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="h-5 w-5 rounded-md bg-muted/40 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center">
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
                      Total: {formatMoney((group.children || []).reduce((a, b) => a + (b.assigned_amount || 0), 0), "EUR")}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-card/40 overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/40">
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead className="w-1/2">Categoria</TableHead>
                          <TableHead className="text-right">Reservado</TableHead>
                          <TableHead className="text-right">Gasto</TableHead>
                          <TableHead className="text-right">Disponível</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext items={(group.children || []).map(c => c.id)} strategy={verticalListSortingStrategy}>
                          {(!group.children || group.children.length === 0) ? (
                            <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground italic text-xs">Vazio.</TableCell></TableRow>
                          ) : (
                            group.children.map((cat) => (
                              <SortableCategoryRow key={cat.id} cat={cat} assignMoney={assignMoney} />
                            ))
                          )}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
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
      <TableCell className="w-[40px]">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/20 hover:text-primary/40 transition-colors">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-foreground/90">{cat.name}</span>
          <Progress value={percentSpent} className="h-1 w-32" />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          value={cat.assigned_amount}
          onChange={(e) => assignMoney(cat.id, parseFloat(e.target.value) || 0)}
          className="w-24 ml-auto h-8 text-right bg-background/50 border-border/40 focus:border-primary/50"
        />
      </TableCell>
      <TableCell className="text-right text-muted-foreground font-medium italic">
        {formatMoney(cat.spent_amount || 0, "EUR")}
      </TableCell>
      <TableCell className={cn(
        "text-right font-bold tabular",
        available > 0 ? "text-emerald-400" : available < 0 ? "text-rose-500" : "text-muted-foreground/40"
      )}>
        {formatMoney(available, "EUR")}
      </TableCell>
      <TableCell>
        <CategoryActions category={cat} />
      </TableCell>
    </TableRow>
  );
};

export default Budget;
