import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Native timeline primitives — ordered steps with a marker, label, and
 * content, connected by rules. Institutional palette, no dependencies.
 * Vertical by default; `horizontal` for compact phase strips.
 */

interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  horizontal?: boolean;
}

function Root({ horizontal, className, children, ...props }: TimelineProps) {
  return (
    <ol
      className={cn(
        horizontal
          ? "flex items-stretch w-full"
          : "relative space-y-0",
        className
      )}
      {...props}
    >
      {children}
    </ol>
  );
}

interface ItemProps extends React.HTMLAttributes<HTMLLIElement> {
  /** Label rendered before the marker (date, step number) */
  start?: React.ReactNode;
  /** Icon or node rendered as the marker */
  marker?: React.ReactNode;
  /** Semantic tone for the marker and connector */
  tone?: "default" | "stable" | "active" | "risk";
  /** Whether a connector follows this item */
  last?: boolean;
  horizontal?: boolean;
}

const markerTone: Record<NonNullable<ItemProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  stable: "bg-state-stable/15 text-state-stable",
  active: "bg-state-active/15 text-state-active",
  risk: "bg-state-risk/15 text-state-risk",
};

const ruleTone: Record<NonNullable<ItemProps["tone"]>, string> = {
  default: "bg-border",
  stable: "bg-state-stable/40",
  active: "bg-state-active/40",
  risk: "bg-state-risk/40",
};

function Item({ start, marker, tone = "default", last, horizontal, className, children, ...props }: ItemProps) {
  if (horizontal) {
    return (
      <li className={cn("flex flex-1 items-center min-w-0", className)} {...props}>
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full [&>svg]:h-3.5 [&>svg]:w-3.5",
              markerTone[tone]
            )}
          >
            {marker}
          </span>
          <div className="text-center">
            {start && (
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {start}
              </p>
            )}
            <div className="text-xs font-medium whitespace-nowrap">{children}</div>
          </div>
        </div>
        {!last && <div className={cn("h-px flex-1 mx-2 mb-6", ruleTone[tone])} aria-hidden />}
      </li>
    );
  }

  return (
    <li className={cn("relative flex gap-3 pb-6", last && "pb-0", className)} {...props}>
      {!last && (
        <div className={cn("absolute left-[13px] top-7 bottom-0 w-px", ruleTone[tone])} aria-hidden />
      )}
      <span
        className={cn(
          "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full [&>svg]:h-3.5 [&>svg]:w-3.5",
          markerTone[tone]
        )}
      >
        {marker}
      </span>
      <div className="min-w-0 pt-0.5">
        {start && (
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{start}</p>
        )}
        <div className="text-sm">{children}</div>
      </div>
    </li>
  );
}

export const Timeline = { Root, Item };
