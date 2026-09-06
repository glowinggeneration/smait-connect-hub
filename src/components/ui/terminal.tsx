import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Terminal — a console-styled surface for streaming execution logs.
 *
 * Native implementation (no animation library): timing is handled with
 * timeouts and CSS transitions so it stays light and respects
 * `prefers-reduced-motion`.
 */

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
};

interface TerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label rendered in the terminal chrome. */
  title?: string;
  /** Keeps the view pinned to the newest line as content streams in. */
  autoScroll?: boolean;
}

export const Terminal = ({
  title = "console",
  autoScroll = true,
  className,
  children,
  ...props
}: TerminalProps) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!autoScroll || !viewportRef.current) return;
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [children, autoScroll]);

  return (
    <div
      className={cn(
        "panel overflow-hidden bg-muted/20",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-state-blocked/60" />
          <span className="h-2 w-2 rounded-full bg-state-risk/60" />
          <span className="h-2 w-2 rounded-full bg-state-stable/60" />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{title}</span>
      </div>

      <div
        ref={viewportRef}
        role="log"
        aria-live="polite"
        className="h-full max-h-[420px] overflow-y-auto p-4 font-mono text-xs leading-relaxed"
      >
        <div className="space-y-1">{children}</div>
      </div>
    </div>
  );
};

interface AnimatedSpanProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay in ms before the line reveals. */
  delay?: number;
}

export const AnimatedSpan = ({
  delay = 0,
  className,
  children,
  ...props
}: AnimatedSpanProps) => {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = React.useState(delay === 0);

  React.useEffect(() => {
    if (reduced || delay === 0) {
      setVisible(true);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay, reduced]);

  return (
    <div
      className={cn(
        "grid text-foreground transition-all duration-300 ease-out",
        visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface TypingAnimationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children: string;
  /** Milliseconds per character. */
  duration?: number;
  /** Delay in ms before typing starts. */
  delay?: number;
  /** Show a blinking caret while typing. */
  caret?: boolean;
}

export const TypingAnimation = ({
  children,
  duration = 28,
  delay = 0,
  caret = true,
  className,
  ...props
}: TypingAnimationProps) => {
  const reduced = usePrefersReducedMotion();
  const [typed, setTyped] = React.useState("");
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    if (reduced) {
      setTyped(children);
      setStarted(true);
      return;
    }
    setTyped("");
    setStarted(false);
    const startTimer = window.setTimeout(() => setStarted(true), delay);
    return () => window.clearTimeout(startTimer);
  }, [children, delay, reduced]);

  React.useEffect(() => {
    if (!started || reduced) return;
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setTyped(children.slice(0, index));
      if (index >= children.length) window.clearInterval(interval);
    }, duration);
    return () => window.clearInterval(interval);
  }, [started, children, duration, reduced]);

  const done = typed.length >= children.length;

  return (
    <div className={cn("text-foreground", className)} {...props}>
      {typed}
      {caret && !done && (
        <span className="ml-0.5 inline-block h-3 w-[6px] translate-y-[1px] animate-pulse bg-foreground/70" />
      )}
    </div>
  );
};

export default Terminal;
