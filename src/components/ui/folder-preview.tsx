import * as React from "react";
import { cn } from "@/lib/utils";

export type FolderTone = "neutral" | "active" | "stable" | "risk";

export interface FolderPreviewProps
  extends Omit<React.HTMLAttributes<HTMLButtonElement>, "onSelect"> {
  /** Folder caption. */
  label: string;
  /** Secondary caption below the label. */
  meta?: string;
  /** Names of items inside; up to 3 fan out on hover. */
  items?: string[];
  /** Total item count shown on the folder tab. */
  count?: number;
  tone?: FolderTone;
  size?: "sm" | "md";
  selected?: boolean;
}

const toneClasses: Record<FolderTone, { back: string; cover: string; tab: string }> = {
  neutral: {
    back: "bg-muted",
    cover: "bg-secondary border-border",
    tab: "bg-muted",
  },
  active: {
    back: "bg-primary/25",
    cover: "bg-primary/15 border-primary/40",
    tab: "bg-primary/25",
  },
  stable: {
    back: "bg-emerald-500/20",
    cover: "bg-emerald-500/10 border-emerald-500/30",
    tab: "bg-emerald-500/20",
  },
  risk: {
    back: "bg-destructive/20",
    cover: "bg-destructive/10 border-destructive/30",
    tab: "bg-destructive/20",
  },
};

const sizeClasses = {
  sm: { root: "w-28", folder: "h-16", sheet: "w-14 h-8" },
  md: { root: "w-36", folder: "h-20", sheet: "w-20 h-11" },
};

/**
 * FolderPreview — a native, dependency-free folder tile.
 * On hover the top sheets fan out of the folder; motion is suppressed
 * for users who prefer reduced motion.
 */
export const FolderPreview = React.forwardRef<HTMLButtonElement, FolderPreviewProps>(
  (
    {
      label,
      meta,
      items = [],
      count,
      tone = "neutral",
      size = "md",
      selected = false,
      className,
      ...props
    },
    ref,
  ) => {
    const colors = toneClasses[tone];
    const s = sizeClasses[size];
    const sheets = items.slice(0, 3);
    const total = count ?? items.length;

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={cn(
          "group/folder flex flex-col items-center gap-2 rounded-md p-3 text-center outline-none transition-colors",
          "focus-visible:ring-1 focus-visible:ring-ring hover:bg-muted/40",
          selected && "bg-muted/60",
          s.root,
          className,
        )}
        {...props}
      >
        <div className={cn("relative w-full", s.folder)}>
          {/* Fanned sheets */}
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            {sheets.map((name, i) => {
              const offset = i - (sheets.length - 1) / 2;
              return (
                <div
                  key={`${name}-${i}`}
                  title={name}
                  className={cn(
                    "absolute rounded-sm border border-border bg-card px-1.5 py-1 text-[9px] leading-tight text-muted-foreground",
                    "origin-bottom overflow-hidden shadow-sm transition-transform duration-300 ease-out",
                    "motion-reduce:transition-none motion-reduce:!translate-y-0 motion-reduce:!rotate-0",
                    s.sheet,
                  )}
                  style={{
                    transform: "translateY(0) rotate(0deg)",
                    ["--fan-x" as string]: `${offset * 26}px`,
                    ["--fan-r" as string]: `${offset * 10}deg`,
                  }}
                  data-fan
                >
                  <span className="line-clamp-2 break-all">{name}</span>
                </div>
              );
            })}
          </div>

          {/* Folder back + tab */}
          <div className={cn("absolute inset-x-1 bottom-0 top-2 rounded-md", colors.back)} />
          <div className={cn("absolute left-1 top-0 h-3 w-2/5 rounded-t-md", colors.tab)} />

          {/* Folder cover */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 h-[70%] rounded-md border transition-transform duration-300 ease-out",
              "origin-bottom group-hover/folder:[transform:perspective(240px)_rotateX(-22deg)]",
              "motion-reduce:transition-none motion-reduce:group-hover/folder:[transform:none]",
              colors.cover,
            )}
          >
            {typeof total === "number" && total > 0 && (
              <span className="absolute bottom-1 right-2 text-[10px] font-medium text-muted-foreground">
                {total}
              </span>
            )}
          </div>
        </div>

        <div className="w-full space-y-0.5">
          <p className="truncate text-xs font-medium text-foreground">{label}</p>
          {meta && <p className="truncate text-[10px] text-muted-foreground">{meta}</p>}
        </div>
      </button>
    );
  },
);

FolderPreview.displayName = "FolderPreview";

export default FolderPreview;
