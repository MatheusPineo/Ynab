import { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Handshake,
  Scale,
  HelpCircle,
  BarChart3,
  CreditCard,
  Inbox as InboxIcon,
  SlidersHorizontal,
  Pencil,
  Briefcase,
  Coins,
  Calculator
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/modules/auth/store/useAuthStore";
import { useSidebarStore } from "@/shared/store/useSidebarStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { EditSidebarModal } from "./EditSidebarModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { toast } from "sonner";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";

export const navItems = [
  { icon: LayoutDashboard, key: "dashboard", to: "/dashboard" },
  { icon: Wallet, key: "accounts", to: "/accounts" },
  { icon: CreditCard, key: "credit_cards", featureKey: "credit_cards", to: "/credit-cards" },
  { icon: Briefcase, key: "investments", featureKey: "investments", to: "/investments" },
  { icon: Coins, key: "assets", featureKey: "assets", to: "/assets" },
  { icon: Calculator, key: "simulators", featureKey: "simulators", to: "/simulators" },
  { icon: ArrowLeftRight, key: "transactions", to: "/transactions" },
  { icon: InboxIcon, key: "inbox", to: "/inbox" },
  { icon: PieChart, key: "budget", to: "/budget" },
  { icon: Scale, key: "rule503020", to: "/rule-503020" },
  { icon: Target, key: "goals", to: "/goals" },
  { icon: BarChart3, key: "reports", featureKey: "reports", to: "/reports" },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { hiddenItems } = useSidebarStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const activeNavItems = navItems.filter((item) => !hiddenItems.includes(item.key));

  const handleLogout = () => {
    logout();
    toast.info("Sessão encerrada.");
    navigate("/auth");
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-out shrink-0",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
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
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {activeNavItems.map((item) => {
          const Icon = item.icon;
          const label = t(`navigation.${item.key}`);
          const description = t(`nav_descriptions.${item.key}`);
          return (
            <HelpTooltip key={item.key} content={description} side="right">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group relative flex flex-row items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
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
                    {!collapsed && <span className="truncate">{label}</span>}
                  </>
                )}
              </NavLink>
            </HelpTooltip>
          );
        })}

        {/* Edit Sidebar Button */}
        <HelpTooltip content={t("navigation.edit_sidebar", "Editar Atalhos")} side="right">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className={cn(
              "group relative flex flex-row items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 mt-2",
              "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <Pencil className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!collapsed && <span className="truncate">{t("navigation.edit_sidebar", "Editar Menu")}</span>}
          </button>
        </HelpTooltip>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <HelpTooltip content={t("nav_descriptions.help")} side="right">
          <NavLink
            to="/help"
            className={({ isActive }) => cn(
              "group relative flex flex-row items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full gradient-primary" />
                )}
                <HelpCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!collapsed && <span className="truncate">{t("navigation.help")}</span>}
              </>
            )}
          </NavLink>
        </HelpTooltip>

        <HelpTooltip content={t("nav_descriptions.settings")} side="right">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              "group relative flex flex-row items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full gradient-primary" />
                )}
                <SettingsIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {!collapsed && <span className="truncate">{t("navigation.settings")}</span>}
              </>
            )}
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
      <HelpTooltip content={collapsed ? t("nav_descriptions.collapse_collapsed") : t("nav_descriptions.collapse_expand")} side="right">
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

      <EditSidebarModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
    </aside>
  );
};
