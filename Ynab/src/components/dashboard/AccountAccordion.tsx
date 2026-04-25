import { useState } from "react";
import { ChevronRight, Plus, GripVertical } from "lucide-react";
import {
  type AccountNode,
  type Currency,
  CURRENCY_SYMBOL,
  formatMoney,
  sumNode,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { AccountActions } from "./AccountActions"; // Importa o novo componente
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
import { useAccountStore } from "@/store/useAccountStore";

interface AccountRowProps {
  node: AccountNode;
  depth: number;
  parentCurrency: Currency;
}

// Subtle background per depth — kept inside the dark theme palette
const depthBg = [
  "bg-card/80",          // 0 — master
  "bg-muted/30",         // 1
  "bg-muted/50",         // 2
  "bg-muted/70",         // 3
];
const bgFor = (d: number) => depthBg[Math.min(d, depthBg.length - 1)];

const AccountRow = ({ node, depth, parentCurrency }: AccountRowProps) => {
  const [open, setOpen] = useState(depth === 0);
  const currency = nodeCurrency(node, parentCurrency);
  const hasChildren = !!node.children?.length;
  const total = sumNode(node);
  const isMaster = depth === 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id, disabled: !isMaster });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const RowContent = (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn("rounded-xl transition-shadow", isMaster && "border border-border/60 overflow-hidden shadow-soft", isDragging && "shadow-elevated")}
    >
      <button
        type="button"
        onClick={() => hasChildren && setOpen((o) => !o)}
        className={cn(
          "group flex w-full items-center gap-2 px-3 py-3 text-left transition-colors duration-200",
          bgFor(depth),
          hasChildren && "hover:bg-muted/60 cursor-pointer",
          !hasChildren && "hover:bg-muted/40 cursor-pointer",
          isMaster && "px-4 py-4",
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className={cn(
            "text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors shrink-0 p-1 -ml-1",
            isMaster ? "cursor-grab active:cursor-grabbing" : "opacity-0 pointer-events-none"
          )}
          title={isMaster ? "Arraste para reordenar" : ""}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </span>

        {/* Chevron */}
        <span
          className={cn(
            "shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-transform duration-300 ease-out",
            hasChildren ? "opacity-100" : "opacity-0",
            open && "rotate-90 text-primary",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </span>

        {/* Currency badge */}
        <span
          className={cn(
            "shrink-0 inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[10px] font-bold tabular",
            isMaster
              ? "gradient-primary text-primary-foreground"
              : "bg-secondary/15 text-secondary",
          )}
          title={currency}
        >
          {CURRENCY_SYMBOL[currency]}
        </span>

        {/* Name */}
        <span
          className={cn(
            "min-w-0 truncate",
            isMaster ? "text-base font-semibold text-foreground" : "text-sm text-foreground/90",
          )}
        >
          {node.name}
        </span>

        {/* Teto + variação */}
        <span className="flex-1" />

        {/* Balance */}
        <span
          className={cn(
            "shrink-0 tabular tracking-tight mr-2",
            isMaster ? "text-base font-bold text-foreground" : "text-sm font-medium text-foreground/85",
          )}
        >
          {formatMoney(total, currency)}
        </span>

        {/* Account Actions (inclui add subaccount, edit, delete) */}
        <div onClick={(e) => e.stopPropagation()}>
          <AccountActions account={node} />
        </div>
      </button>

      {/* Children */}
      {hasChildren && (
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className={cn("flex flex-col gap-px")}>
              {node.children!.map((child) => (
                <AccountRow
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  parentCurrency={currency}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return RowContent;
};

interface Props {
  tree: AccountNode[];
}

export const AccountAccordion = ({ tree }: Props) => {
  const { setTree } = useAccountStore();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tree.findIndex((node) => node.id === active.id);
      const newIndex = tree.findIndex((node) => node.id === over.id);
      
      const newTree = arrayMove(tree, oldIndex, newIndex);
      setTree(newTree);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        <SortableContext items={tree.map(n => n.id)} strategy={verticalListSortingStrategy}>
          {tree.map((root) => (
            <AccountRow
              key={root.id}
              node={root}
              depth={0}
              parentCurrency={nodeCurrency(root)}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};

function nodeCurrency(node: AccountNode, parentCurrency?: Currency): Currency {
  return node.currency ?? parentCurrency ?? "EUR";
}
