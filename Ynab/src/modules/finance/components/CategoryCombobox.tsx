import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover";

interface CategoryComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  excludeCategoryId?: string;
  className?: string;
  required?: boolean;
  filterLeafOnly?: boolean;
  showAllOption?: boolean;
  disabled?: boolean;
}

export const CategoryCombobox = ({
  value,
  onValueChange,
  placeholder = "Selecione uma categoria",
  excludeCategoryId,
  className,
  filterLeafOnly = false,
  showAllOption = false,
  disabled = false,
}: CategoryComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const { categoryGroups: tree } = useAccountStore();

  // Achatamento da árvore de categorias
  const getAllCategories = (nodes: any[], depth = 0): any[] => {
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
        list = [...list, ...getAllCategories(node.children, depth + 1)];
      }
    });
    return list;
  };

  const allCategories = getAllCategories(tree);

  // Filtragem das contas com base na busca e exclusões
  const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const filteredCategories = allCategories
    .filter((cat) => {
      if (excludeCategoryId && String(cat.id) === String(excludeCategoryId)) return false;
      if (filterLeafOnly && !cat.isLeaf) return false;
      return normalizeStr(cat.name).includes(normalizeStr(search));
    });

  const showVirtualAll = showAllOption && (normalizeStr("todas as categorias").includes(normalizeStr(search)) || search === "");

  const displayItems = showVirtualAll
    ? [{ id: "all", name: "Todas as Categorias", displayName: "Todas as Categorias", isLeaf: true }, ...filteredCategories]
    : filteredCategories;

  const selectedCategory = value === "all"
    ? null
    : allCategories.find((a) => String(a.id) === String(value));

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
            "w-full h-10 px-3 bg-background/50 border border-border/60 hover:border-primary/50 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-primary/40",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            className
          )}
        >
          <span className="truncate">
            {value === "all" ? (
              <span className="text-foreground font-semibold">Todas as Categorias</span>
            ) : selectedCategory ? (
              <span className="flex items-center gap-1.5">
                <span className="whitespace-pre">{selectedCategory.displayName || selectedCategory.name}</span>
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
          placeholder="🔍 Filtrar categoria..."
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

        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 scrollbar-thin">
          {displayItems.length === 0 ? (
            <div className="py-2.5 px-3 text-xs text-muted-foreground text-center select-none">
              Nenhuma categoria encontrada
            </div>
          ) : (
            displayItems.map((cat, index) => {
              const isHighlighted = index === activeIndex;
              const isSelected = String(cat.id) === String(value);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onValueChange(String(cat.id));
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-lg text-foreground transition-colors flex items-center justify-between cursor-pointer",
                    isHighlighted ? "bg-primary/20" : isSelected ? "bg-primary/10" : "hover:bg-primary/10"
                  )}
                >
                  <span className="whitespace-pre">{cat.displayName || cat.name}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
