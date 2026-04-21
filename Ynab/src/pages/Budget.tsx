import { useMemo, useState } from "react";
import { useAccountStore, CategoryGroup, BudgetCategory } from "@/store/useAccountStore";
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
import { Wallet, Plus, FolderPlus, GripVertical } from "lucide-react";
import { toast } from "sonner";
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

// --- Components for Drag & Drop ---

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
  const { categoryGroups, tree, assignMoney, addCategoryGroup, addCategory, setCategoryGroups } = useAccountStore();
  const [newGroupName, setNewGroupName] = useState("");
  const [newCatName, setNewCatName] = useState("");

  const totalCash = useMemo(() => netWorth(tree, "EUR"), [tree]);
  const totalAssigned = useMemo(() => {
    return categoryGroups.reduce((acc, group) => {
      return acc + group.categories.reduce((groupAcc, cat) => groupAcc + cat.assigned, 0);
    }, 0);
  }, [categoryGroups]);

  const readyToAssign = totalCash - totalAssigned;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if we are dragging a group
    const isActiveGroup = categoryGroups.some(g => g.id === active.id);
    
    if (isActiveGroup) {
      const oldIndex = categoryGroups.findIndex(g => g.id === active.id);
      const newIndex = categoryGroups.findIndex(g => g.id === over.id);
      setCategoryGroups(arrayMove(categoryGroups, oldIndex, newIndex));
      return;
    }

    // Check if we are dragging a category within a group
    let sourceGroupIndex = -1;
    let categoryIndex = -1;

    categoryGroups.forEach((group, gIdx) => {
      const cIdx = group.categories.findIndex(c => c.id === active.id);
      if (cIdx !== -1) {
        sourceGroupIndex = gIdx;
        categoryIndex = cIdx;
      }
    });

    if (sourceGroupIndex !== -1) {
      // Find if we are over another category in the SAME group
      const targetCategoryIndex = categoryGroups[sourceGroupIndex].categories.findIndex(c => c.id === over.id);
      
      if (targetCategoryIndex !== -1) {
        const newGroups = [...categoryGroups];
        newGroups[sourceGroupIndex].categories = arrayMove(
          newGroups[sourceGroupIndex].categories,
          categoryIndex,
          targetCategoryIndex
        );
        setCategoryGroups(newGroups);
      }
    }
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    addCategoryGroup(newGroupName);
    setNewGroupName("");
    toast.success(`Grupo "${newGroupName}" criado!`);
  };

  const handleAddCategory = (groupId: string) => {
    if (!newCatName.trim()) return;
    addCategory(groupId, newCatName);
    setNewCatName("");
    toast.success(`Categoria "${newCatName}" adicionada!`);
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
          
          <div className="flex flex-col gap-3 max-w-xs text-center sm:text-right">
            <p className="text-sm text-muted-foreground">Seu patrimônio total disponível para alocação.</p>
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
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Total: {formatMoney(group.categories.reduce((a, b) => a + b.assigned, 0), "EUR")}
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext items={group.categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                          {group.categories.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground italic text-xs">Vazio.</TableCell></TableRow>
                          ) : (
                            group.categories.map((cat) => (
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

const SortableCategoryRow = ({ cat, assignMoney }: { cat: BudgetCategory, assignMoney: any }) => {
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

  const available = cat.assigned - cat.spent;
  const percentSpent = cat.assigned > 0 ? (cat.spent / cat.assigned) * 100 : 0;

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
          value={cat.assigned}
          onChange={(e) => assignMoney(cat.id, parseFloat(e.target.value) || 0)}
          className="w-24 ml-auto h-8 text-right bg-background/50 border-border/40 focus:border-primary/50"
        />
      </TableCell>
      <TableCell className="text-right text-muted-foreground font-medium italic">
        {formatMoney(cat.spent, "EUR")}
      </TableCell>
      <TableCell className={cn(
        "text-right font-bold tabular",
        available > 0 ? "text-emerald-400" : available < 0 ? "text-rose-500" : "text-muted-foreground/40"
      )}>
        {formatMoney(available, "EUR")}
      </TableCell>
    </TableRow>
  );
};

export default Budget;
