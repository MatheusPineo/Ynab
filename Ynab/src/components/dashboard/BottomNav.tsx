import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  Target,
  Sparkles,
  MoreHorizontal,
  Settings as SettingsIcon,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { HelpTooltip } from "@/components/ui/help-tooltip";

const primaryNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard", description: "Visão geral do patrimônio." },
  { icon: Wallet, label: "Contas", to: "/accounts", description: "Saldos e limites." },
  { icon: ArrowLeftRight, label: "Transações", to: "/transactions", description: "Entradas e saídas." },
  { icon: PieChart, label: "Orçamento", to: "/budget", description: "Distribuição de renda." },
];

const moreNavItems = [
  { icon: Handshake, label: "Dívidas", to: "/debts", description: "Gerencie devedores e suas dívidas." },
  { icon: Target, label: "Metas", to: "/goals", description: "Objetivos financeiros." },
  { icon: Sparkles, label: "Insights", to: "/insights", description: "Relatórios de hábitos." },
  { icon: SettingsIcon, label: "Config.", to: "/settings", description: "Ajustes e perfil." },
];

export const BottomNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-sidebar-border bg-sidebar/95 backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <HelpTooltip key={item.label} content={item.description} side="top">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-200 min-w-0 flex-1",
                    isActive
                      ? "text-primary scale-105"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:scale-105",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-200",
                        isActive
                          ? "bg-primary/10 shadow-soft"
                          : "bg-transparent",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span className="truncate w-full text-center">{item.label}</span>
                  </>
                )}
              </NavLink>
            </HelpTooltip>
          );
        })}

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-200 min-w-0 flex-1 text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl">
                <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
              <span>Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={8}
            className="glass border-border/60 min-w-[160px] mb-2"
          >
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.label}
                  className="cursor-pointer gap-3 py-3"
                  onClick={() => navigate(item.to)}
                >
                  <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                  <span className="font-medium flex-1">{item.label}</span>
                  <HelpTooltip content={item.description} side="left" />
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
