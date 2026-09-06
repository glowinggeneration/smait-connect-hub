import { CSSProperties, ComponentPropsWithoutRef, FC } from "react";
import { cn } from "@/lib/utils";

interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}

/**
 * Subtle shimmer sweep across muted text. Uses the platform's foreground token
 * for the highlight so it stays inside the institutional palette.
 */
export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 90,
  style,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
          ...style,
        } as CSSProperties
      }
      className={cn(
        "mx-auto max-w-md text-muted-foreground",
        "animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shiny-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",
        "bg-gradient-to-r from-transparent via-foreground/80 via-50% to-transparent",
        "motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
