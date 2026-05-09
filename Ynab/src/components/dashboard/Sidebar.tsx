import { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  PieChart,
  Settings as SettingsIcon,
  Sparkles,
  ChevronLeft,
  LogOut,
  User as UserIcon,
  Handshake
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { HelpTooltip } from "@/components/ui/help-tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard", description: "Visão geral do seu patrimônio e fluxo de caixa." },
  { icon: Wallet, label: "Contas", to: "/accounts", description: "Gerencie suas contas bancárias, cartões e limites." },
  { icon: ArrowLeftRight, label: "Transações", to: "/transactions", description: "Registre e acompanhe suas entradas e saídas de dinheiro." },
  { icon: PieChart, label: "Orçamento", to: "/budget", description: "Distribua sua renda e planeje seus gastos do mês." },
  { icon: Handshake, label: "Dívidas", to: "/debts", description: "Controle quem te deve dinheiro e o que você deve a terceiros." },
  { icon: Target, label: "Metas", to: "/goals", description: "Crie objetivos financeiros de médio e longo prazo." },
  { icon: Sparkles, label: "Insights", to: "/insights", description: "Relatórios inteligentes sobre seus hábitos financeiros." },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Sessão encerrada.");
    navigate("/auth");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight animate-fade-in-up">
            <span className="text-sm font-semibold text-sidebar-accent-foreground tracking-tight">
              Vault
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Finance OS
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <HelpTooltip key={item.label} content={item.description} side="right">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full gradient-primary" />
                    )}
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            </HelpTooltip>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <HelpTooltip content="Ajustes da conta, perfil e modelo de distribuição de renda." side="right">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <SettingsIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!collapsed && <span>Configurações</span>}
          </NavLink>
        </HelpTooltip>

        <div className={cn(
          "mt-3 flex w-full items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2.5",
          collapsed && "justify-center"
        )}>
          <Avatar className="h-8 w-8 rounded-full border border-primary/20 shrink-0">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="gradient-primary text-[10px] text-white">
              {user?.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left leading-tight">
              <div className="text-xs font-semibold text-sidebar-accent-foreground truncate">
                {user?.name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {user?.email}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <HelpTooltip content={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} side="right">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all shadow-soft"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </HelpTooltip>
    </aside>
  );
};
