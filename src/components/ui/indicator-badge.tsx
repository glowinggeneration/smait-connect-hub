import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IndicatorBadgeProps {
  children: ReactNode;
  /** Badge text; when undefined/null, no badge is rendered */
  badge?: string | null;
  tone?: "active" | "stable" | "risk";
  className?: string;
}

const tones: Record<NonNullable<IndicatorBadgeProps["tone"]>, string> = {
  active: "bg-state-active text-state-active border-state-active/30",
  stable: "bg-state-stable text-state-stable border-state-stable/30",
  risk: "bg-state-risk text-state-risk border-state-risk/30",
};

/**
 * Corner indicator badge (e.g. "New") anchored to the top-right of its child.
 */
export const IndicatorBadge = ({
  children,
  badge,
  tone = "active",
  className,
}: IndicatorBadgeProps) => {
  if (!badge) return <>{children}</>;
  return (
    <span className={cn("relative inline-flex min-w-0 max-w-full", className)}>
      {children}
      <span
        className={cn(
          "absolute -top-1.5 right-0 translate-x-1/2 rounded-full border px-1.5 py-px",
          "text-[9px] font-medium uppercase tracking-wider leading-none",
          tones[tone]
        )}
      >
        {badge}
      </span>
    </span>
  );
};
