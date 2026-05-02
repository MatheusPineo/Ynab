import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { AddTransactionModal } from "./AddTransactionModal";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Topbar = () => {
  const { user } = useAuthStore();
  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const firstName = user?.name ? user.name.split(" ")[0] : "Usuário";

  return (
    <header className="flex items-center justify-between gap-4 px-8 py-5 border-b border-border/60">
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 capitalize">
          {currentMonth}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bom dia, {firstName} <span className="text-gradient-primary">👋</span>
        </h1>
      </div>


      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-full glass px-4 py-2 w-72">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar transações, contas..."
            className="bg-transparent text-sm placeholder:text-muted-foreground outline-none flex-1"
          />
          <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-border px-1.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <ModeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full glass relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
        </Button>

        <AddTransactionModal />
      </div>
    </header>
  );
};
