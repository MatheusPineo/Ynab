import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Scale,
  CreditCard,
  Inbox as InboxIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { HelpTooltip } from "@/shared/components/ui/help-tooltip";
import { useSidebarStore } from "@/shared/store/useSidebarStore";

const primaryNavItems = [
  { icon: LayoutDashboard, key: "dashboard", to: "/dashboard" },
  { icon: Wallet, key: "accounts", to: "/accounts" },
  { icon: ArrowLeftRight, key: "transactions", to: "/transactions" },
  { icon: PieChart, key: "budget", to: "/budget" },
];

const moreNavItems = [
  { icon: InboxIcon, key: "inbox", to: "/inbox" },
  { icon: Scale, key: "rule503020", to: "/rule-503020" },
  { icon: CreditCard, key: "credit_cards", to: "/credit-cards" },
  { icon: Target, key: "goals", to: "/goals" },

  { icon: SettingsIcon, key: "settings", to: "/settings" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hiddenItems } = useSidebarStore();

  const activePrimaryNavItems = primaryNavItems.filter((item) => !hiddenItems.includes(item.key));
  const activeMoreNavItems = moreNavItems.filter((item) => !hiddenItems.includes(item.key));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-sidebar-border bg-sidebar/95 backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
        {activePrimaryNavItems.map((item) => {
          const Icon = item.icon;
          const label = t(`navigation.${item.key}`);
          const description = t(`nav_descriptions.${item.key}`);
          return (
            <HelpTooltip key={item.key} content={description} side="top">
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
                    <span className="truncate w-full text-center">{label}</span>
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
              <span>{t("navigation.more", "Mais")}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={8}
            className="glass border-border/60 min-w-[160px] mb-2"
          >
            {activeMoreNavItems.map((item) => {
              const Icon = item.icon;
              const label = t(`navigation.${item.key}`);
              const description = t(`nav_descriptions.${item.key}`);
              return (
                <DropdownMenuItem
                  key={item.key}
                  className="cursor-pointer gap-3 py-3"
                  onClick={() => navigate(item.to)}
                >
                  <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                  <span className="font-medium flex-1">{label}</span>
                  <HelpTooltip content={description} side="left" />
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};
