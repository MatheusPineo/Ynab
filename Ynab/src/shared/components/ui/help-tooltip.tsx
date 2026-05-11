import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface HelpTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  delayDuration?: number;
}

export function HelpTooltip({ 
  content, 
  children, 
  side = "top", 
  className,
  delayDuration = 200
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild={!!children}>
          {children || (
            <button 
              type="button"
              className={cn(
                "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                className
              )}
              aria-label="Informação adicional"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-[280px] bg-sidebar/95 border-sidebar-border shadow-glow p-3 backdrop-blur-md text-sm leading-relaxed"
          sideOffset={6}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
