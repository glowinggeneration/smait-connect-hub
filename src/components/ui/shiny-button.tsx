import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Native shiny button — a restrained light sweep crosses the surface
 * periodically. Uses the institutional palette (foreground-on-background
 * primary), CSS-only animation, no dependencies. Reduced-motion safe.
 */

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-md",
          "bg-foreground text-background text-sm font-medium",
          "transition-colors hover:bg-foreground/90",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {/* Light sweep */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -translate-x-full",
            "bg-gradient-to-r from-transparent via-background/25 to-transparent",
            "motion-safe:animate-[shine-sweep_3.5s_ease-in-out_infinite]",
            "motion-reduce:hidden"
          )}
        />
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);
ShinyButton.displayName = "ShinyButton";
