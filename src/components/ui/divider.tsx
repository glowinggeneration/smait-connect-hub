import { cn } from "@/lib/utils";

interface DividerProps {
  label?: string;
  className?: string;
}

/**
 * Horizontal rule with an optional centered label — quiet, ledger-appropriate.
 */
export const Divider = ({ label, className }: DividerProps) => {
  if (!label) {
    return <hr className={cn("border-border", className)} />;
  }
  return (
    <div className={cn("flex items-center gap-3", className)} role="separator">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
};
