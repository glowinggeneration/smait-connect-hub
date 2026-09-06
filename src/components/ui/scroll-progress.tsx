import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Native scroll progress bar — a hairline that fills left-to-right with
 * reading progress inside a scrolling container (or the window).
 * Uses requestAnimationFrame-throttled scroll listening; no dependencies.
 */

interface ScrollProgressProps {
  className?: string;
  /** Ref to the scrolling element; defaults to window scroll */
  containerRef?: React.RefObject<HTMLElement>;
}

export function ScrollProgress({ className, containerRef }: ScrollProgressProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const getTarget = () => containerRef?.current ?? null;

    const update = () => {
      const el = getTarget();
      let progress = 0;
      if (el) {
        const max = el.scrollHeight - el.clientHeight;
        progress = max > 0 ? el.scrollTop / max : 0;
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress = max > 0 ? window.scrollY / max : 0;
      }
      setActive(progress > 0.005);
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    const el = getTarget();
    (el ?? window).addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    return () => {
      (el ?? window).removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [containerRef]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none h-px w-full overflow-hidden bg-transparent transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-foreground/40 will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
