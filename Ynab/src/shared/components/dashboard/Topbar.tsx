import { Bell } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ModeToggle } from "@/shared/components/ui/mode-toggle";
import { AddTransactionModal } from "@/modules/finance/components/AddTransactionModal";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GlobalSearch } from "@/modules/finance/components/GlobalSearch";
import { Capacitor } from "@capacitor/core";

export const Topbar = () => {
  const { user } = useAuthStore();
  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const firstName = user?.name ? user.name.split(" ")[0] : "Usuário";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 19) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <header className={`flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-8 border-b border-sidebar-border shrink-0 ${
      Capacitor.isNativePlatform() ? "pt-8 h-22" : "h-16"
    }`}>
      <div className="min-w-0 flex-1">
        <div className="hidden sm:block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 capitalize">
          {currentMonth}
        </div>
        <h1 className="text-foreground font-semibold tracking-tight truncate">
          <span className="hidden sm:inline text-2xl">
            {getGreeting()}, {firstName} <span className="text-gradient-primary">👋</span>
          </span>
          <span className="sm:hidden text-xl font-black tracking-tighter">
            Vault <span className="text-gradient-primary">✦</span>
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden md:block">
          <GlobalSearch />
        </div>

        <ModeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full glass relative h-9 w-9"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
        </Button>

        <div className="hidden sm:block">
          <AddTransactionModal />
        </div>
      </div>
    </header>
  );
};
