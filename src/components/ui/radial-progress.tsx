import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RadialProgressProps {
  /** 0-100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  tone?: "default" | "stable" | "active" | "risk";
  className?: string;
  label?: string;
}

const toneVars: Record<NonNullable<RadialProgressProps["tone"]>, string> = {
  default: "hsl(var(--primary))",
  stable: "hsl(var(--state-stable))",
  active: "hsl(var(--state-active))",
  risk: "hsl(var(--state-risk))",
};

/**
 * Radial progress ring (native, SVG-based). Animates when scrolled into view
 * and whenever the value changes; respects prefers-reduced-motion.
 */
export const RadialProgress = ({
  value,
  size = 32,
  strokeWidth = 3,
  showLabel = false,
  tone = "default",
  className,
  label,
}: RadialProgressProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(clamped);
      return;
    }
    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const from = 0;
        const duration = 900;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(from + (clamped - from) * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [clamped]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - display / 100);

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progress: ${clamped}%`}
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={toneVars[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showLabel && (
        <span className="absolute inset-0 grid place-items-center text-[9px] font-medium text-muted-foreground tabular-nums">
          {display}%
        </span>
      )}
    </div>
  );
};
