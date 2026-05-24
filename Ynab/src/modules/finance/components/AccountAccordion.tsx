import { useState } from "react";
import { ChevronRight, Plus, GripVertical, Target, Move, ArrowDownAZ, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  type AccountNode,
  type Currency,
} from "@/types";
import { CURRENCY_SYMBOL, formatMoney } from "@/shared/lib/currency-utils";
import { cn } from "@/shared/lib/utils";
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
import { useAccountStore } from "@/modules/finance/store/useAccountStore";

interface AccountRowProps {
  node: AccountNode;
  depth: number;
  parentCurrency: Currency;
  sortByAlphabet?: boolean;
}

// Subtle background per depth — kept inside the dark theme palette
const depthBg = [
  "bg-card/80",          // 0 — master
  "bg-muted/30",         // 1
  "bg-muted/50",         // 2
  "bg-muted/70",         // 3
];
const bgFor = (d: number) => depthBg[Math.min(d, depthBg.length - 1)];

const AccountRow = ({ node, depth, parentCurrency, sortByAlphabet }: AccountRowProps) => {
  const [open, setOpen] = useState(depth === 0);
  const currency = nodeCurrency(node, parentCurrency);
  const hasChildren = !!node.children?.length;
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const total = sumNode(node);
  const isMaster = depth === 0;
  const isExcluded = !!node.exclude_from_totals;

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
          "group flex flex-col w-full text-left transition-colors duration-200",
          bgFor(depth),
          hasChildren ? "px-3 sm:px-4 py-3 sm:py-4 border-b border-border/40" : "px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl border border-border/50 shadow-sm", // Papel vs Topo de Pasta
          hasChildren && "hover:bg-muted/60 cursor-pointer",
          !hasChildren && "hover:bg-muted/40 cursor-pointer",
          isExcluded && "border-l-4 border-l-purple-500/70 bg-purple-950/5 hover:bg-purple-950/10",
          "[--pad-base:6px] [--pad-indent:4px] sm:[--pad-base:12px] sm:[--pad-indent:8px]"
        )}
        style={{ paddingLeft: `calc(var(--pad-base) + ${depth} * var(--pad-indent))` }}
      >
        <div className="flex w-full items-center gap-1.5 sm:gap-2">
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
        {(node.icon_url && !imageError) ? (
          <div className={cn(
            "shrink-0 h-8 w-8 rounded-full overflow-hidden border shadow-sm bg-background/50 flex items-center justify-center",
            isExcluded ? "border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]" : "border-border/40"
          )}>
            <img 
              src={node.icon_url} 
              alt="" 
              className="h-full w-full object-cover" 
              onError={() => {
                console.warn("❌ Erro ao carregar imagem, aplicando fallback de moeda:", node.icon_url);
                setImageError(true);
              }}
            />
          </div>
        ) : (
          <span
            className={cn(
              "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold tabular",
              isExcluded
                ? "bg-purple-950/50 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                : (isMaster || hasChildren
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "bg-secondary/15 text-secondary border border-secondary/20")
            )}
            title={currency}
          >
            {CURRENCY_SYMBOL[currency]}
          </span>
        )}

        {/* Name */}
        <span
          className={cn(
            "min-w-0 truncate flex items-center gap-1.5 sm:gap-2",
            isMaster ? "text-base font-semibold text-foreground" : "text-sm text-foreground/90",
            isExcluded && "text-foreground/75 italic"
          )}
        >
          <span className="truncate">{node.name}</span>
          {isExcluded && (
            <span 
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/25 select-none"
              title="Este saldo e suas subcontas foram desconsiderados na somatória dos totais globais."
            >
              <EyeOff className="h-2.5 w-2.5 text-purple-400 shrink-0" />
              Fora da Soma
            </span>
          )}
        </span>

        <span className="flex-1" />

        {/* Balance */}
        <div
          className="shrink-0 flex flex-col items-end mr-2"
          title={isExcluded ? "Este saldo está desconsiderado do cálculo total." : undefined}
        >
          {node.ceiling && Number(node.ceiling) > 0 ? (
            <>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5 select-none">
                Valor Alocado / Teto
              </span>
              <span className={cn(
                "tabular tracking-tight flex items-center gap-1.5",
                isMaster ? "text-base font-bold" : "text-sm font-medium",
                isExcluded
                  ? "text-purple-300/60"
                  : (total < 0 ? "text-rose-500 font-semibold" : (isMaster ? "text-foreground" : "text-foreground/85"))
              )}>
                <span>{formatMoney(total, currency)}</span>
                <span className="text-muted-foreground/60 font-normal text-xs">/</span>
                <span className="text-muted-foreground text-xs">{formatMoney(Number(node.ceiling), currency)}</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5 select-none">
                Valor Alocado
              </span>
              <span className={cn(
                "tabular tracking-tight",
                isMaster ? "text-base font-bold" : "text-sm font-medium",
                isExcluded
                  ? "text-purple-300/60"
                  : (total < 0 ? "text-rose-500 font-semibold" : (isMaster ? "text-foreground" : "text-foreground/85"))
              )}>
                {formatMoney(total, currency)}
              </span>
            </>
          )}
        </div>

        {/* Account Actions */}
        <div onClick={(e) => e.stopPropagation()}>
          <AccountActions account={node} />
        </div>
        </div>

        {/* Bottom Row: Progress Bar */}
        {(!isMaster || (node.ceiling && Number(node.ceiling) > 0)) && (() => {
          const hasCeiling = node.ceiling && Number(node.ceiling) > 0;

          if (!hasCeiling) {
            return (
              <div className="w-full h-5 bg-slate-800/80 rounded-full relative overflow-hidden mt-2 border border-slate-700/50 shadow-inner">
                <div 
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 bg-slate-700"
                  style={{ width: '100%' }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md z-10 select-none">
                  Saldo Livre
                </span>
              </div>
            );
          }

          const ceilVal = Number(node.ceiling);
          const rawPct = (total / ceilVal) * 100;
          const displayPct = Math.round(rawPct);
          const barWidth = Math.min(rawPct, 100);
          
          let barColor = "bg-rose-500";
          let glowClass = "";
          
          if (rawPct > 100) {
            barColor = "bg-gradient-to-r from-cyan-400 to-purple-500";
            glowClass = "shadow-[0_0_12px_rgba(168,85,247,0.6)]";
          } else if (rawPct >= 50) {
            barColor = "bg-emerald-500";
          }

          return (
            <div className="w-full h-5 bg-slate-800/80 rounded-full relative overflow-hidden mt-2 border border-slate-700/50 shadow-inner">
              <div 
                className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-500", barColor, glowClass)}
                style={{ width: `${barWidth}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md z-10 select-none">
                {displayPct}%
              </span>
            </div>
          );
        })()}
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
              {(() => {
                const displayChildren = node.children ? [...node.children] : [];
                if (sortByAlphabet) {
                  displayChildren.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
                }
                return displayChildren.map((child) => (
                  <AccountRow
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    parentCurrency={currency}
                    sortByAlphabet={sortByAlphabet}
                  />
                ));
              })()}
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
  const [sortByAlphabet, setSortByAlphabet] = useState<boolean>(() => {
    return localStorage.getItem("vault_sort_subaccounts_az") === "true";
  });

  const handleToggleSort = () => {
    setSortByAlphabet((prev) => {
      const newVal = !prev;
      localStorage.setItem("vault_sort_subaccounts_az", String(newVal));
      return newVal;
    });
  };
  
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
    <div className="flex flex-col gap-3">
      <div className="flex justify-end items-center px-1">
        <button
          type="button"
          onClick={handleToggleSort}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 shadow-sm cursor-pointer select-none",
            sortByAlphabet
              ? "bg-primary/10 border-primary/40 text-primary hover:bg-primary/15"
              : "bg-muted/15 border-border/50 text-muted-foreground hover:bg-muted/25 hover:text-foreground"
          )}
        >
          <ArrowDownAZ className="h-3.5 w-3.5" />
          <span>Ordenar Subcontas A-Z</span>
        </button>
      </div>

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
                sortByAlphabet={sortByAlphabet}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

function sumNode(node: AccountNode, isRootCall = true): number {
  const balance = (!isRootCall && node.exclude_from_totals) ? 0 : (Number(node.balance) || 0);
  if (!node.children || node.children.length === 0) return balance;
  return node.children.reduce((acc, c) => {
    if (c.exclude_from_totals) return acc;
    return acc + sumNode(c, false);
  }, balance);
}

function nodeCurrency(node: AccountNode, parentCurrency?: Currency): Currency {
  return node.currency ?? parentCurrency ?? "EUR";
}
