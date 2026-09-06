import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NumberTickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  startValue?: number;
  duration?: number;
  delay?: number;
  decimalPlaces?: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts up to `value` when scrolled into view. Native rAF implementation —
 * no animation dependencies, respects reduced-motion preferences.
 */
export function NumberTicker({
  value,
  startValue = 0,
  duration = 900,
  delay = 0,
  decimalPlaces = 0,
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(startValue);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let timeout: ReturnType<typeof setTimeout>;
    let started = false;

    const run = () => {
      const from = display;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutExpo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setDisplay(from + (value - from) * eased);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          timeout = setTimeout(run, delay);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, delay]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums tracking-tight", className)}
      {...props}
    >
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })}
    </span>
  );
}
