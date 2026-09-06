import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Native stat primitives — a ledger-strip group of metrics, each with a
 * title, value, and optional description / figure. Institutional palette,
 * no dependencies.
 */

function Group({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "panel grid grid-cols-2 md:grid-cols-4 divide-x divide-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metric label, rendered above the value */
  title: string;
  /** Optional supporting line, rendered below the value */
  desc?: React.ReactNode;
  /** Optional icon/figure rendered to the right */
  figure?: React.ReactNode;
  /** Small action buttons rendered below the value */
  actions?: React.ReactNode;
  /** Semantic tone for the value */
  tone?: "default" | "stable" | "active" | "risk" | "blocked";
}

const toneClass: Record<NonNullable<ItemProps["tone"]>, string> = {
  default: "",
  stable: "state-stable",
  active: "state-active",
  risk: "state-risk",
  blocked: "state-blocked",
};

function Item({ title, desc, figure, actions, tone = "default", className, children, ...props }: ItemProps) {
  return (
    <div className={cn("p-4 flex items-start justify-between gap-3", className)} {...props}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">{title}</p>
        <p className={cn("text-2xl font-semibold mt-1 tabular-nums", toneClass[tone])}>
          {children}
        </p>
        {desc && <p className="text-[11px] text-muted-foreground mt-1">{desc}</p>}
        {actions && (
          <div className="flex items-center gap-1.5 mt-2">{actions}</div>
        )}
      </div>
      {figure && (
        <div className="shrink-0 text-muted-foreground/60">{figure}</div>
      )}
    </div>
  );
}

export const Stat = { Group, Item };
