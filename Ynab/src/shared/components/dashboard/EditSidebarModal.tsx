import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Switch } from "@/shared/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useSidebarStore } from "@/shared/store/useSidebarStore";
import { navItems } from "./Sidebar";

interface EditSidebarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSidebarModal({ open, onOpenChange }: EditSidebarModalProps) {
  const { t } = useTranslation();
  const { hiddenItems, toggleItem } = useSidebarStore();

  const activeNavItems = navItems;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("navigation.edit_sidebar", "Editar Atalhos")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isHidden = hiddenItems.includes(item.key);
            return (
              <div
                key={item.key}
                className="flex items-center justify-between space-x-2 border border-border/50 rounded-xl p-3 bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sidebar-accent rounded-lg">
                    <Icon className="w-4 h-4 text-sidebar-foreground" />
                  </div>
                  <span className="text-sm font-medium">{t(`navigation.${item.key}`)}</span>
                </div>
                <Switch
                  checked={!isHidden}
                  onCheckedChange={() => toggleItem(item.key)}
                />
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
