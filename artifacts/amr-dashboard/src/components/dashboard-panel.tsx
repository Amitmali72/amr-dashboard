import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface DashboardPanelProps {
  title: string;
  tooltipInfo: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function DashboardPanel({ title, tooltipInfo, children, className = "", delay = 0 }: DashboardPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`h-full ${className}`}
    >
      <Card className="h-full glass-card flex flex-col border-white/5 bg-background/40">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground uppercase flex items-center gap-2">
            {title}
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground/50 hover:text-primary transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="bg-popover/90 backdrop-blur-sm border-primary/20 text-xs">
                <p className="max-w-xs">{tooltipInfo}</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden relative">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
