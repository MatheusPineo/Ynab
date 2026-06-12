import { useState } from "react";
import { ChevronRight, GripVertical, EyeOff, Landmark, CreditCard, LineChart, HandCoins } from "lucide-react";
import { toast } from "sonner";
import {
  type AccountNode,
  type Currency,
} from "@/types";
import { formatMoney } from "@/shared/lib/currency-utils";
import { cn } from "@/shared/lib/utils";
import { useNavigate } from "react-router-dom";
import { AccountActions } from "./AccountActions";
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
}

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
  const [logoError, setLogoError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [lastLogoUrl, setLastLogoUrl] = useState(node.bank_logo_url);
  if (node.bank_logo_url !== lastLogoUrl) {
    setLastLogoUrl(node.bank_logo_url);
    setLogoError(false);
  }

  const { updateNode, tree } = useAccountStore();

  const total = sumNode(node);
  const isMaster = depth === 0;
  const isExcluded = !!node.exclude_from_totals;
  
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
        !isMaster && "mx-1 sm:mx-3 mb-2 w-[calc(100%-8px)] sm:w-[calc(100%-24px)]",
        hasChildren && "border border-border/60 rounded-xl overflow-hidden bg-background/20 shadow-soft",
        isDragging && "shadow-elevated z-10"
      )}
    >
      <button
        type="button"
        onClick={() => hasChildren ? setOpen((o) => !o) : navigate(`/account/${node.id}`)}
        className={cn(
          "group flex flex-col w-full text-left transition-colors duration-200",
          bgFor(depth),
          hasChildren ? "px-3 sm:px-4 py-3 sm:py-4 border-b border-border/40" : "px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl border border-border/50 shadow-sm",
          hasChildren && "hover:bg-muted/60 cursor-pointer",
          !hasChildren && "hover:bg-muted/40 cursor-pointer",
          isExcluded && "border-l-4 border-l-purple-500/70 bg-purple-950/5 hover:bg-purple-950/10",
          "[--pad-base:6px] [--pad-indent:4px] sm:[--pad-base:12px] sm:[--pad-indent:8px]"
        )}
        style={{ paddingLeft: `calc(var(--pad-base) + ${depth} * var(--pad-indent))` }}
      >
        <div className="flex w-full items-center gap-1.5 sm:gap-2">
          {/* Drag handle — fixed-width wrapper for strict alignment */}
          <span
            {...(isMaster ? { ...attributes, ...listeners } : {})}
            className={cn(
              "shrink-0 w-6 flex items-center justify-center p-1 -ml-1 transition-colors",
              isMaster
                ? "text-muted-foreground/40 group-hover:text-muted-foreground/70 cursor-grab active:cursor-grabbing"
                : "pointer-events-none"
            )}
            title={isMaster ? "Arraste para reordenar" : undefined}
            onClick={isMaster ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
          >
            <GripVertical className={cn("h-4 w-4", !isMaster && "opacity-0")} />
          </span>

          {/* Chevron Wrapper for Strict Horizontal Alignment */}
          <span className="w-5 h-5 flex items-center justify-center shrink-0">
            {hasChildren ? (
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-transform duration-300 ease-out",
                  open && "rotate-90 text-primary",
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </span>
            ) : (
              <ChevronRight className="h-4 w-4 opacity-0 pointer-events-none" />
            )}
          </span>

          {/* Unified Bank Icon / Custom Icon / Generic Fallback */}
          <div className={cn(
            "shrink-0 h-8 w-8 rounded-full overflow-hidden border shadow-sm bg-white flex items-center justify-center",
            isExcluded ? "border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]" : "border-border/40"
          )}>
            {node.bank_logo_url && !logoError ? (
              <img 
                src={node.bank_logo_url} 
                alt="" 
                className="h-6 w-6 rounded-full object-contain" 
                onError={() => {
                  console.warn("❌ Erro ao carregar logo do banco, aplicando fallback:", node.bank_logo_url);
                  setLogoError(true);
                }}
              />
            ) : node.icon_url && !imageError ? (
              <img 
                src={node.icon_url} 
                alt="" 
                className="h-full w-full rounded-full object-cover" 
                onError={() => {
                  console.warn("❌ Erro ao carregar imagem, aplicando fallback:", node.icon_url);
                  setImageError(true);
                }}
              />
            ) : (
              <Landmark className="h-4 w-4 text-muted-foreground/80" />
            )}
          </div>

          {/* Name */}
          <span
            className={cn(
              "min-w-0 truncate flex items-center gap-1.5 sm:gap-2 flex-wrap",
              isMaster ? "text-base font-semibold text-foreground" : "text-sm text-foreground/90",
              isExcluded && "text-foreground/75 italic"
            )}
          >
            <span className="truncate">{node.name}</span>
            
            {/* Account Type Badges */}
            {(node.account_type === 'CREDIT_CARD' || node.account_type === 'credit_card') && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/25 select-none"
                title="Cartão de Crédito"
              >
                <CreditCard className="h-2.5 w-2.5 shrink-0" />
                Cartão
              </span>
            )}
            
            {(node.account_type === 'TRACKING' || node.account_type === 'tracking') && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-sky-500/15 text-sky-500 border border-sky-500/25 select-none"
                title="Conta de Acompanhamento (Fora do Orçamento)"
              >
                <LineChart className="h-2.5 w-2.5 shrink-0" />
                Acompanhamento
              </span>
            )}

            {node.account_type === 'LOAN_GIVEN' && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/25 select-none"
                title="Empréstimo Concedido a Terceiros"
              >
                <HandCoins className="h-2.5 w-2.5 shrink-0" />
                A Receber
              </span>
            )}

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

          {/* Current Balance */}
          <div
            className="shrink-0 flex flex-col items-end mr-2"
            title={isExcluded ? "Este saldo está desconsiderado do cálculo total." : undefined}
          >
            {(() => {
              const isLoanGiven = node.account_type === 'LOAN_GIVEN';
              const displayTotal = (isLoanGiven && total > 0) ? -Math.abs(total) : total;
              
              return (
                <span className={cn(
                  "tabular tracking-tight",
                  isMaster ? "text-base font-bold" : "text-sm font-medium",
                  isExcluded
                    ? "text-purple-300/60"
                    : (isLoanGiven || displayTotal < 0 ? "text-rose-500 font-semibold" : (isMaster ? "text-foreground" : "text-foreground/85"))
                )}>
                  {formatMoney(displayTotal, currency)}
                </span>
              );
            })()}
          </div>

          {/* Account Actions */}
          <div onClick={(e) => e.stopPropagation()}>
            <AccountActions account={node} />
          </div>
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
              {(node.children || []).map((child) => (
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

  console.log("Account:", node.name, "Domain:", node.bank_domain);

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
        distance: 8,
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
