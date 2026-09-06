import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type DotTone = "active" | "stable" | "risk";

const toneClasses: Record<DotTone, string> = {
  active: "bg-primary",
  stable: "bg-emerald-500",
  risk: "bg-red-500",
};

interface DotBadgeProps extends React.ComponentProps<typeof Badge> {
  tone?: DotTone;
  pulse?: boolean;
}

/**
 * DotBadge — restrained status badge with a colored dot, matching the
 * institutional palette. Use to signal live state (unread, active, risk).
 */
const DotBadge = ({ tone = "active", pulse = false, className, children, ...props }: DotBadgeProps) => {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-normal", className)} {...props}>
      <span className="relative flex size-2" aria-hidden="true">
        {pulse && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", toneClasses[tone])} />
        )}
        <span className={cn("relative inline-flex size-2 rounded-full", toneClasses[tone])} />
      </span>
      {children}
    </Badge>
  );
};

export { DotBadge };
