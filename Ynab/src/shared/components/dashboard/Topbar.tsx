import { Bell, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ModeToggle } from "@/shared/components/ui/mode-toggle";
import { AddTransactionModal } from "@/modules/finance/components/AddTransactionModal";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GlobalSearch } from "@/modules/finance/components/GlobalSearch";
import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInboxStore } from "@/modules/finance/store/useInboxStore";
import { useAccountStore } from "@/modules/finance/store/useAccountStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

export const Topbar = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const firstName = user?.name ? user.name.split(" ")[0] : "Usuário";

  const { inboxItems, fetchInboxItems } = useInboxStore();
  const { globalPendingTransactions, fetchGlobalPendingTransactions } = useAccountStore();

  useEffect(() => {
    fetchInboxItems();
    fetchGlobalPendingTransactions();
  }, [fetchInboxItems, fetchGlobalPendingTransactions]);

  // Consolidar as tarefas pendentes/ações exigidas do usuário
  const pendingTasks = useMemo(() => {
    const tasks: Array<{
      id: string;
      title: string;
      description: string;
      type: "inbox" | "transaction" | "custom";
      route: string;
      icon: any;
    }> = [];

    // 1. Notas e cupons no Inbox pendentes de homologação
    inboxItems.forEach((item) => {
      if (item.status === "ready" || item.status === "failed") {
        const fileName = item.file ? item.file.split("/").pop() : "Recibo";
        tasks.push({
          id: `inbox-${item.id}`,
          title: "Homologação de Comprovante",
          description: item.status === "ready" 
            ? `Revisar dados extraídos do arquivo: ${fileName}`
            : `IA falhou ao processar: ${fileName}. Corrija manualmente.`,
          type: "inbox",
          route: "/inbox",
          icon: FileText,
        });
      }
    });

    // 2. Transações pendentes (ex: transações agendadas que precisam ser efetivadas)
    globalPendingTransactions.forEach((t) => {
      tasks.push({
        id: `tx-${t.id}`,
        title: "Transação Pendente",
        description: `Efetivar lançamento: ${t.description || "Sem descrição"} (${t.amount ? t.amount.toLocaleString("pt-BR", { style: "currency", currency: t.currency || "BRL" }) : ""})`,
        type: "transaction",
        route: "/transactions?status=pending",
        icon: AlertCircle,
      });
    });

    return tasks;
  }, [inboxItems, globalPendingTransactions]);

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full glass relative h-9 w-9"
            >
              <Bell className="h-4 w-4" />
              {pendingTasks.length > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 animate-pulse-glow" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[340px] rounded-xl border border-border/80 bg-card/95 backdrop-blur-md p-2 shadow-2xl">
            <DropdownMenuLabel className="text-xs font-bold text-foreground px-2 py-1.5 flex items-center justify-between">
              <span>Ações Pendentes</span>
              {pendingTasks.length > 0 && (
                <span className="bg-rose-500/10 text-rose-500 text-[10px] py-0.5 px-2 rounded-full font-black">
                  {pendingTasks.length}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60" />
            {pendingTasks.length === 0 ? (
              <div className="text-center py-6 px-4 space-y-1.5">
                <span className="text-gradient-primary text-xl">🎉</span>
                <p className="text-xs font-semibold text-foreground">Tudo limpo por aqui!</p>
                <p className="text-[10px] text-muted-foreground">Você não possui nenhuma ação pendente no momento.</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-1 py-1">
                {pendingTasks.map((task) => {
                  const TaskIcon = task.icon;
                  return (
                    <DropdownMenuItem
                      key={task.id}
                      onClick={() => navigate(task.route)}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/10 cursor-pointer transition-all focus:bg-muted/10 group"
                    >
                      <div className="h-7 w-7 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <TaskIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-normal">
                          {task.description}
                        </p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden sm:block">
          <AddTransactionModal />
        </div>
      </div>
    </header>
  );
};

