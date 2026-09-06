import { cn } from "@/lib/utils";

interface ShineBorderProps {
  className?: string;
  /** Border thickness in px */
  borderWidth?: number;
  /** Seconds per full revolution */
  duration?: number;
  /** Shine colors — defaults to restrained slate tones */
  shineColor?: string[];
}

/**
 * ShineBorder — two subtle highlights orbiting the border of their parent,
 * 180° apart. Parent must be `relative`. Kept low-contrast to match the
 * institutional palette; honours prefers-reduced-motion.
 */
export const ShineBorder = ({
  className,
  borderWidth = 1,
  duration = 14,
  shineColor = ["hsl(var(--muted-foreground) / 0.7)", "hsl(var(--muted-foreground) / 0.25)"],
}: ShineBorderProps) => {
  const [a, b] = shineColor;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden motion-reduce:hidden",
        className,
      )}
      style={{
        padding: borderWidth,
        WebkitMask:
          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    >
      <div
        className="absolute aspect-square"
        style={{
          width: "300%",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          background: `conic-gradient(from 0deg, transparent 0deg, ${a} 40deg, transparent 80deg, transparent 180deg, ${b} 220deg, transparent 260deg)`,
          animation: `border-beam-spin ${duration}s linear infinite`,
        }}
      />
    </div>
  );
};
