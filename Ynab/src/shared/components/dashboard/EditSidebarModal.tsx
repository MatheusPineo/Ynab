import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Switch } from "@/shared/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useSidebarStore } from "@/shared/store/useSidebarStore";
import { navItems } from "./Sidebar";
import { GripVertical } from "lucide-react";
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

interface EditSidebarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SortableItemProps {
  item: typeof navItems[0];
  isHidden: boolean;
  onToggle: (key: string) => void;
}

function SortableItem({ item, isHidden, onToggle }: SortableItemProps) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between space-x-2 border border-border/50 rounded-xl p-3 bg-muted/20 hover:border-primary/20 transition-all"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded-lg hover:bg-sidebar-accent transition-colors"
          {...attributes}
          {...listeners}
          aria-label="Reordenar atalho"
        >
          <GripVertical className="w-4 h-4 shrink-0" />
        </button>
        <div className="p-2 bg-sidebar-accent rounded-lg">
          <Icon className="w-4 h-4 text-sidebar-foreground" />
        </div>
        <span className="text-sm font-medium">{t(`navigation.${item.key}`)}</span>
      </div>
      <Switch
        checked={!isHidden}
        onCheckedChange={() => onToggle(item.key)}
      />
    </div>
  );
}

export function EditSidebarModal({ open, onOpenChange }: EditSidebarModalProps) {
  const { t } = useTranslation();
  const { hiddenItems, sidebarOrder, toggleItem, setSidebarOrder } = useSidebarStore();
  const [orderedItems, setOrderedItems] = useState<typeof navItems>([]);

  // Carregar e sincronizar a ordem dos atalhos com base na store ao abrir o modal
  useEffect(() => {
    if (open) {
      const order = sidebarOrder || [];
      const sorted = [...navItems].sort((a, b) => {
        const idxA = order.indexOf(a.key);
        const idxB = order.indexOf(b.key);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return navItems.findIndex(n => n.key === a.key) - navItems.findIndex(n => n.key === b.key);
      });
      setOrderedItems(sorted);
    }
  }, [open, sidebarOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((i) => i.key === active.id);
        const newIndex = items.findIndex((i) => i.key === over.id);
        const newOrdered = arrayMove(items, oldIndex, newIndex);
        
        // Atualiza a store e persiste no backend
        setSidebarOrder(newOrdered.map(i => i.key));
        return newOrdered;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("navigation.edit_sidebar", "Editar Atalhos")}</DialogTitle>
        </DialogHeader>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedItems.map((i) => i.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
              {orderedItems.map((item) => {
                const isHidden = hiddenItems.includes(item.key);
                return (
                  <SortableItem
                    key={item.key}
                    item={item}
                    isHidden={isHidden}
                    onToggle={toggleItem}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}
