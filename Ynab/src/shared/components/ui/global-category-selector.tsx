import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover";

interface GlobalCategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  currency?: string;
}

export const GlobalCategorySelector = ({
  value,
  onValueChange,
  placeholder = "Selecione uma categoria",
  className,
  disabled = false,
  currency,
}: GlobalCategorySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const { categoryGroups } = useAccountStore();

  const normalizeStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const searchNormalized = normalizeStr(search);

  // Construir a lista de itens a serem exibidos baseados na busca
  const displayItems: any[] = [];

  // Opção "Sem Categoria"
  const showNoneOption = search === "" || normalizeStr("sem categoria").includes(searchNormalized);
  if (showNoneOption) {
    displayItems.push({
      id: "none",
      name: "Sem Categoria",
      isCategory: true,
      isNone: true,
      displayName: "Sem Categoria",
    });
  }

  // Percorre os grupos de categoria e filtra as categorias filhas que batem com a busca
  (categoryGroups || []).forEach((group: any) => {
    if (currency && group.currency !== currency) {
      return;
    }

    const matchingChildren = (group.children || []).filter((cat: any) => {
      if (currency && cat.currency !== currency) return false;
      return normalizeStr(cat.name).includes(searchNormalized);
    });

    if (matchingChildren.length > 0) {
      // Adiciona o cabeçalho do grupo
      displayItems.push({
        id: `group-header-${group.id}`,
        name: group.name,
        isHeader: true,
      });

      // Adiciona as categorias filhas correspondentes
      matchingChildren.forEach((cat: any) => {
        displayItems.push({
          id: String(cat.id),
          name: cat.name,
          isCategory: true,
          displayName: `\u00A0\u00A0↳ ${cat.name}`,
          groupName: group.name,
        });
      });
    }
  });

  // Filtra apenas itens clicáveis (categorias e a opção "none") para navegação por teclado e índice ativo
  const clickableItems = displayItems.filter(item => item.isCategory);

  // Achar o item selecionado para mostrar no botão do trigger
  let selectedCategoryName = "";
  if (value === "none" || !value) {
    selectedCategoryName = "Sem Categoria";
  } else {
    for (const group of categoryGroups || []) {
      const found = (group.children || []).find((c: any) => String(c.id) === String(value));
      if (found) {
        selectedCategoryName = found.name;
        break;
      }
    }
  }

  // Inicializar o primeiro resultado focado por padrão ao digitar ou abrir
  useEffect(() => {
    if (clickableItems.length > 0) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [search, isOpen, clickableItems.length]);

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
            {selectedCategoryName ? (
              <span className="text-foreground">{selectedCategoryName}</span>
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
        style={{ width: "max(var(--radix-popover-trigger-width), 240px)" }}
      >
        <Input
          type="text"
          placeholder="🔍 Filtrar categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (clickableItems.length === 0) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              const nextIdx = activeIndex < clickableItems.length - 1 ? activeIndex + 1 : 0;
              setActiveIndex(nextIdx);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const prevIdx = activeIndex > 0 ? activeIndex - 1 : clickableItems.length - 1;
              setActiveIndex(prevIdx);
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (activeIndex >= 0 && activeIndex < clickableItems.length) {
                onValueChange(String(clickableItems[activeIndex].id));
                setIsOpen(false);
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          className="h-8.5 text-xs bg-background/40 border-border/50 placeholder:text-muted-foreground/60 rounded-lg focus-visible:ring-primary/50"
        />

        <div 
          className="max-h-[250px] overflow-y-auto overscroll-contain flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-muted"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {displayItems.length === 0 ? (
            <div className="py-2.5 px-3 text-xs text-muted-foreground text-center select-none">
              Nenhuma categoria encontrada
            </div>
          ) : (
            displayItems.map((item) => {
              if (item.isHeader) {
                return (
                  <div
                    key={item.id}
                    className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider px-2.5 py-1.5 select-none"
                  >
                    {item.name}
                  </div>
                );
              }

              // Encontrar o índice deste item nos clicáveis
              const clickableIndex = clickableItems.findIndex(ci => ci.id === item.id);
              const isHighlighted = clickableIndex === activeIndex;
              const isSelected = String(item.id) === String(value);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onValueChange(String(item.id));
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-lg text-foreground transition-colors flex items-center justify-between cursor-pointer",
                    isHighlighted ? "bg-primary/20" : isSelected ? "bg-primary/10" : "hover:bg-primary/10"
                  )}
                >
                  <span className="whitespace-pre">{item.displayName || item.name}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
