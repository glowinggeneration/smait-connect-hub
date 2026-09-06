import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Native highlighter that draws a hand-drawn marker stroke behind text.
 * No dependencies; colors derive from the institutional state palette.
 */

type HighlighterAction = "highlight" | "underline";

interface HighlighterProps extends React.HTMLAttributes<HTMLSpanElement> {
  action?: HighlighterAction;
  /** Semantic tone — maps to institutional state colors */
  tone?: "stable" | "active" | "risk" | "blocked" | "muted";
  /** Stroke animation duration in ms */
  duration?: number;
  children: React.ReactNode;
}

const toneColors: Record<string, string> = {
  stable: "hsl(var(--state-stable) / 0.35)",
  active: "hsl(var(--state-active) / 0.3)",
  risk: "hsl(var(--state-risk) / 0.35)",
  blocked: "hsl(var(--state-blocked) / 0.35)",
  muted: "hsl(var(--muted-foreground) / 0.2)",
};

export function Highlighter({
  action = "highlight",
  tone = "stable",
  duration = 800,
  className,
  children,
  style,
  ...props
}: HighlighterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const color = toneColors[tone];

  const strokeStyle: React.CSSProperties =
    action === "highlight"
      ? {
          backgroundImage: `linear-gradient(${color}, ${color})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: visible ? "100% 88%" : "0% 88%",
          backgroundPosition: "0% 62%",
          transition: `background-size ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }
      : {
          backgroundImage: `linear-gradient(${color}, ${color})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: visible ? "100% 2px" : "0% 2px",
          backgroundPosition: "0% 96%",
          transition: `background-size ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        };

  return (
    <span
      ref={ref}
      className={cn("rounded-[2px] px-0.5 -mx-0.5 box-decoration-clone", className)}
      style={{ ...strokeStyle, ...style }}
      {...props}
    >
      {children}
    </span>
  );
}
