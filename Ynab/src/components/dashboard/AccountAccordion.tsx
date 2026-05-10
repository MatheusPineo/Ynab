import { useState } from "react";
import { ChevronRight, Plus, GripVertical, Gauge, Move } from "lucide-react";
import { toast } from "sonner";
import {
  type AccountNode,
  type Currency,
} from "@/types";
import { CURRENCY_SYMBOL, formatMoney } from "@/lib/currency-utils";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const total = sumNode(node);
  const isMaster = depth === 0;

  const { updateNode, tree } = useAccountStore();

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

  // HTML5 Drag & Drop Nativo para movimentação hierárquica
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", node.id.toString());
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-40");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    e.currentTarget.classList.remove("opacity-40");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("border-primary", "bg-primary/5");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    e.currentTarget.classList.remove("border-primary", "bg-primary/5");
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-primary", "bg-primary/5");

    const draggedIdStr = e.dataTransfer.getData("text/plain");
    if (!draggedIdStr) return;

    const draggedId = Number(draggedIdStr);
    const targetId = node.id;

    if (draggedId === targetId) return;

    // Verificar se o targetId é descendente do draggedId (evitar loops)
    const isDescendant = (parent: AccountNode, childId: number): boolean => {
      if (!parent.children) return false;
      return parent.children.some(child => child.id === childId || isDescendant(child, childId));
    };

    const findNode = (nodes: AccountNode[], id: number): AccountNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findNode(n.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const draggedNode = findNode(tree, draggedId);
    if (draggedNode && isDescendant(draggedNode, targetId)) {
      toast.error("Não é possível mover uma conta para dentro de seus próprios descendentes.");
      return;
    }

    try {
      await updateNode(draggedId, { parent: targetId });
      toast.success(`Conta "${draggedNode?.name || ""}" movida para dentro de "${node.name}" com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao mover conta: " + (err.message || "Erro desconhecido"));
    }
  };

  const RowContent = (
    <div 
      ref={setNodeRef} 
      style={style}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "transition-all duration-300 ease-in-out border border-transparent rounded-xl",
        !isMaster && "mx-1 sm:mx-3 mb-2 w-[calc(100%-8px)] sm:w-[calc(100%-24px)]", // Reduz largura de tudo que não for raiz
        hasChildren && "border border-border/60 rounded-xl overflow-hidden bg-background/20 shadow-soft", // Estilo pasta (para quem tem filhos)
        isDragging && "shadow-elevated z-10"
      )}
    >
      <button
        type="button"
        onClick={() => hasChildren ? setOpen((o) => !o) : navigate(`/account/${node.id}`)}
        className={cn(
          "group flex w-full items-center gap-1.5 sm:gap-2 text-left transition-colors duration-200",
          bgFor(depth),
          hasChildren ? "px-3 sm:px-4 py-3 sm:py-4 border-b border-border/40" : "px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl border border-border/50 shadow-sm", // Papel vs Topo de Pasta
          hasChildren && "hover:bg-muted/60 cursor-pointer",
          !hasChildren && "hover:bg-muted/40 cursor-pointer",
          "[--pad-base:6px] [--pad-indent:4px] sm:[--pad-base:12px] sm:[--pad-indent:8px]"
        )}
        style={{ paddingLeft: `calc(var(--pad-base) + ${depth} * var(--pad-indent))` }}
      >
        {/* Drag handle */}
        {isMaster && (
          <span
            {...attributes}
            {...listeners}
            className="text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors shrink-0 p-1 -ml-1 cursor-grab active:cursor-grabbing"
            title="Arraste para reordenar"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}

        {/* Chevron */}
        {hasChildren ? (
          <span
            className={cn(
              "shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-transform duration-300 ease-out",
              open && "rotate-90 text-primary",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <div className="w-1.5 sm:w-2 shrink-0" />
        )}

        {/* Icon or Currency badge */}
        {node.icon_url ? (
          <div className="shrink-0 h-8 w-8 rounded-full overflow-hidden border border-border/40 shadow-sm bg-background/50 flex items-center justify-center">
            <img 
              src={node.icon_url} 
              alt="" 
              className="h-full w-full object-cover" 
              onError={(e) => {
                console.error("❌ Erro ao carregar imagem:", node.icon_url);
                (e.target as any).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <span
            className={cn(
              "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold tabular",
              isMaster || hasChildren
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "bg-secondary/15 text-secondary border border-secondary/20",
            )}
            title={currency}
          >
            {CURRENCY_SYMBOL[currency]}
          </span>
        )}

        {/* Name */}
        <span
          className={cn(
            "min-w-0 truncate",
            isMaster ? "text-base font-semibold text-foreground" : "text-sm text-foreground/90",
          )}
        >
          {node.name}
        </span>

        {/* Indicator for ceiling/limit */}
        {node.ceiling && Number(node.ceiling) > 0 && (() => {
          const ceilVal = Math.round(Number(node.ceiling));
          const pct = Math.round((total / Number(node.ceiling)) * 100);
          
          let colorClasses = "";
          if (pct >= 100) {
            colorClasses = "gradient-mixed text-zinc-950 font-black border-transparent shadow-sm";
          } else if (pct >= 80) {
            colorClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
          } else if (pct >= 40) {
            colorClasses = "bg-amber-500/15 text-amber-400 border-amber-500/25";
          } else {
            colorClasses = "bg-rose-500/15 text-rose-400 border-rose-500/25";
          }
          
          return (
            <div className={cn(
              "flex items-center gap-1.5 ml-4 sm:ml-5 px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold select-none shrink-0 transition-all border",
              colorClasses
            )}>
              <Gauge className={cn("h-3 w-3 shrink-0", pct >= 100 ? "text-zinc-950" : "")} />
              <span>
                {CURRENCY_SYMBOL[currency] || ""}{ceilVal.toLocaleString('pt-BR')}
                {"/"}
                {pct}%
              </span>
            </div>
          );
        })()}

        {/* Teto + variação */}
        <span className="flex-1" />

        {/* Balance */}
        <span
          className={cn(
            "shrink-0 tabular tracking-tight mr-2",
            isMaster ? "text-base font-bold" : "text-sm font-medium",
            total < 0 ? "text-rose-500 font-semibold" : (isMaster ? "text-foreground" : "text-foreground/85")
          )}
        >
          {formatMoney(total, currency)}
        </span>

        {/* Account Actions */}
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
            <div className={cn("flex flex-col pt-3 pb-1")}>
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
        {/* Área de Drop para nível raiz */}
        <div 
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("border-primary", "bg-primary/10", "scale-[1.01]");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("border-primary", "bg-primary/10", "scale-[1.01]");
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-primary", "bg-primary/10", "scale-[1.01]");
            const draggedIdStr = e.dataTransfer.getData("text/plain");
            if (!draggedIdStr) return;
            const draggedId = Number(draggedIdStr);
            
            const findNode = (nodes: AccountNode[], id: number): AccountNode | null => {
              for (const n of nodes) {
                if (n.id === id) return n;
                if (n.children) {
                  const found = findNode(n.children, id);
                  if (found) return found;
                }
              }
              return null;
            };

            const draggedNode = findNode(tree, draggedId);
            if (draggedNode && draggedNode.parent === null) {
              // Já é mestre
              return;
            }

            try {
              const { updateNode } = useAccountStore.getState();
              await updateNode(draggedId, { parent: null });
              toast.success(`Conta "${draggedNode?.name || ""}" transformada em Conta Mestre (Nível Superior).`);
            } catch (err: any) {
              toast.error("Erro ao mover conta para a raiz: " + (err.message || "Erro desconhecido"));
            }
          }}
          className="border border-dashed border-border/60 hover:border-primary/50 bg-card/20 hover:bg-card/30 rounded-2xl py-3 px-4 text-center text-xs text-muted-foreground hover:text-primary transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group shadow-sm mb-2"
        >
          <Move className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          Arraste qualquer conta aqui para transformá-la em Conta Mestre (Nível Superior)
        </div>

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

function sumNode(node: AccountNode): number {
  const balance = Number(node.balance) || 0;
  if (!node.children || node.children.length === 0) return balance;
  return node.children.reduce((acc, c) => acc + sumNode(c), balance);
}

function nodeCurrency(node: AccountNode, parentCurrency?: Currency): Currency {
  return node.currency ?? parentCurrency ?? "EUR";
}
