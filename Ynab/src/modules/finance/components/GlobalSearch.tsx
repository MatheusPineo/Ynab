import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/components/ui/command";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import { cn } from "@/shared/lib/utils";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { tree, transactions } = useAccountStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const getLeafAccounts = (nodes: any[]): any[] => {
    let leaves: any[] = [];
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        leaves = [...leaves, ...getLeafAccounts(node.children)];
      } else {
        leaves.push(node);
      }
    });
    return leaves;
  };

  const leafAccounts = getLeafAccounts(tree);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-full glass px-4 py-2 w-72 text-left transition-all hover:bg-white/10 group"
        )}
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm text-muted-foreground flex-1">
          Buscar transações, contas...
        </span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite para buscar..." />
        <CommandList className="glass border-none">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          <CommandGroup heading="Contas">
            {leafAccounts.map((account) => (
              <CommandItem
                key={account.id}
                onSelect={() => {
                  setOpen(false);
                  navigate(`/account/${account.id}`);
                }}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                    {account.currency}
                  </div>
                  <span>{account.name}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Transações Recentes">
            {transactions.slice(0, 10).map((t) => (
              <CommandItem
                key={t.id}
                onSelect={() => {
                  setOpen(false);
                  navigate("/transactions");
                }}
                className="cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{t.description}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.date).toLocaleDateString("pt-BR")} • {t.is_income ? "+" : "-"} {t.amount}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
