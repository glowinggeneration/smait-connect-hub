import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  /** Beam length as a percentage of the border path */
  size?: number;
  /** Seconds per full revolution */
  duration?: number;
  /** Delay in seconds before the beam starts */
  delay?: number;
  /** Beam thickness in px */
  borderWidth?: number;
  /** Beam colors (HSL token values by default) */
  colorFrom?: string;
  colorTo?: string;
}

/**
 * BorderBeam — a single light beam travelling along the border of its
 * parent. Parent must be `relative` with a visible border/radius.
 * Pure CSS animation; honours prefers-reduced-motion.
 */
export const BorderBeam = ({
  className,
  size = 20,
  duration = 8,
  delay = 0,
  borderWidth = 1.5,
  colorFrom = "hsl(var(--muted-foreground) / 0.9)",
  colorTo = "hsl(var(--muted-foreground) / 0)",
}: BorderBeamProps) => {
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
          width: `${size * 4}%`,
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          background: `conic-gradient(from 0deg, transparent 0deg, ${colorFrom} ${size}deg, ${colorTo} ${size * 2}deg, transparent ${size * 2}deg)`,
          animation: `border-beam-spin ${duration}s linear ${delay}s infinite`,
        }}
      />
    </div>
  );
};
