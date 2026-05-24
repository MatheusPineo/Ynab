import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover";

interface GlobalAccountSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  excludeAccountId?: string;
  className?: string;
  required?: boolean;
  filterLeafOnly?: boolean; // Se true, lista apenas contas folha (sem filhos)
  showAllOption?: boolean;  // Se true, inclui a opção "Todas as Contas" com valor "all"
  showRootOption?: boolean; // Se true, inclui a opção "Conta Mestre" com valor "root"
  allowListIds?: string[]; // Se passado, apenas essas contas (além das virtuais) serão exibidas
  disabled?: boolean;
}

export const GlobalAccountSelector = ({
  value,
  onValueChange,
  placeholder = "Selecione uma conta",
  excludeAccountId,
  className,
  filterLeafOnly = false,
  showAllOption = false,
  showRootOption = false,
  allowListIds,
  disabled = false,
}: GlobalAccountSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const { tree } = useAccountStore();

  // Achatamento da árvore de contas para listagem linear com indentação visual
  const getAllAccounts = (nodes: any[], depth = 0): any[] => {
    let list: any[] = [];
    if (!nodes || !Array.isArray(nodes)) return list;

    nodes.forEach((node) => {
      const indent = "\u00A0\u00A0".repeat(depth);
      const isLeaf = !node.children || !Array.isArray(node.children) || node.children.length === 0;

      list.push({
        ...node,
        displayName: `${indent}${depth > 0 ? "↳ " : ""}${node.name}`,
        isLeaf,
      });

      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        list = [...list, ...getAllAccounts(node.children, depth + 1)];
      }
    });
    return list;
  };

  const allAccounts = getAllAccounts(tree);

  // Filtragem das contas com base na busca e exclusões
  const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const filteredAccounts = allAccounts
    .filter((acc) => {
      if (excludeAccountId && String(acc.id) === String(excludeAccountId)) return false;
      if (allowListIds && !allowListIds.includes(String(acc.id))) return false;
      if (filterLeafOnly && !acc.isLeaf) return false;
      return normalizeStr(acc.name).includes(normalizeStr(search));
    });

  // Se showAllOption for ativo, incluímos o item virtual "Todas as Contas"
  const showVirtualAll = showAllOption && (normalizeStr("todas as contas").includes(normalizeStr(search)) || search === "");

  // Se showRootOption for ativo, incluímos o item virtual "Conta Mestre"
  const showVirtualRoot = showRootOption && (normalizeStr("conta mestre superior").includes(normalizeStr(search)) || search === "");

  const displayItems = [
    ...(showVirtualAll ? [{ id: "all", name: "Todas as Contas", displayName: "Todas as Contas", currency: "", isLeaf: true }] : []),
    ...(showVirtualRoot ? [{ id: "root", name: "Conta Mestre (Nível Superior / Sem Pai)", displayName: "Conta Mestre (Nível Superior / Sem Pai)", currency: "", isLeaf: true }] : []),
    ...filteredAccounts
  ];

  // Conta selecionada atualmente
  const selectedAccount = value === "all"
    ? { id: "all", name: "Todas as Contas", displayName: "Todas as Contas", currency: "" }
    : value === "root"
    ? { id: "root", name: "Conta Mestre (Nível Superior / Sem Pai)", displayName: "Conta Mestre (Nível Superior / Sem Pai)", currency: "" }
    : allAccounts.find((a) => String(a.id) === String(value));

  // Inicializar o primeiro resultado focado por padrão ao digitar ou abrir
  useEffect(() => {
    if (displayItems.length > 0) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [search, isOpen, displayItems.length]);

  // Limpar a busca ao fechar o popover
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  return (
    <Popover open={isOpen && !disabled} onOpenChange={(open) => !disabled && setIsOpen(open)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full col-span-full h-10 px-3 bg-background/50 border border-border/60 hover:border-primary/50 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-primary/40",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            className
          )}
        >
          <span className="truncate">
            {selectedAccount ? (
              <span className="flex items-center gap-1.5">
                <span className="whitespace-pre">{selectedAccount.displayName || selectedAccount.name}</span>
                {selectedAccount.currency && <span className="text-[10px] text-muted-foreground">({selectedAccount.currency})</span>}
              </span>
            ) : (
              <span className="text-muted-foreground/60">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground/80 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent 
        className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-glow p-2 text-xs flex flex-col gap-1.5 align-start"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Input
          type="text"
          placeholder="🔍 Filtrar conta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (displayItems.length === 0) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              const nextIdx = activeIndex < displayItems.length - 1 ? activeIndex + 1 : 0;
              setActiveIndex(nextIdx);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const prevIdx = activeIndex > 0 ? activeIndex - 1 : displayItems.length - 1;
              setActiveIndex(prevIdx);
            } else if (e.key === "Enter") {
              e.preventDefault(); // Impede submissão de formulários
              if (activeIndex >= 0 && activeIndex < displayItems.length) {
                onValueChange(String(displayItems[activeIndex].id));
                setIsOpen(false);
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          className="h-8.5 text-xs bg-background/40 border-border/50 placeholder:text-muted-foreground/60 rounded-lg focus-visible:ring-primary/50"
        />

        <div className="max-h-[300px] overflow-y-auto overscroll-contain flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-muted">
          {displayItems.length === 0 ? (
            <div className="py-2.5 px-3 text-xs text-muted-foreground text-center select-none">
              Nenhuma conta encontrada
            </div>
          ) : (
            displayItems.map((acc, index) => {
              const isHighlighted = index === activeIndex;
              const isSelected = String(acc.id) === String(value);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    onValueChange(String(acc.id));
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-lg text-foreground transition-colors flex items-center justify-between cursor-pointer",
                    isHighlighted ? "bg-primary/20" : isSelected ? "bg-primary/10" : "hover:bg-primary/10"
                  )}
                >
                  <span className="whitespace-pre">{acc.displayName || acc.name}</span>
                  {acc.id !== "all" && acc.id !== "root" && acc.currency && (
                    <span className="text-[10px] text-muted-foreground font-semibold px-1 bg-background/30 rounded border border-border/30">
                      {acc.currency}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
