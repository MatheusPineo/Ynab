import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center h-64 text-center px-4 animate-in fade-in duration-500">
    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-bold text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} variant="outline" className="rounded-xl">
        {actionLabel}
      </Button>
    )}
  </div>
);
