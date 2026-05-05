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

const primaryNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Wallet, label: "Contas", to: "/accounts" },
  { icon: ArrowLeftRight, label: "Transações", to: "/transactions" },
  { icon: PieChart, label: "Orçamento", to: "/budget" },
];

const moreNavItems = [
  { icon: Target, label: "Metas", to: "/goals" },
  { icon: Sparkles, label: "Insights", to: "/insights" },
  { icon: SettingsIcon, label: "Config.", to: "/settings" },
];

export const BottomNav = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-sidebar-border bg-sidebar/95 backdrop-blur-xl safe-area-pb">
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-200 min-w-0 flex-1",
                  isActive
                    ? "text-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                      isActive
                        ? "gradient-primary shadow-glow text-primary-foreground"
                        : "text-inherit"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
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
                  <span className="font-medium">{item.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
