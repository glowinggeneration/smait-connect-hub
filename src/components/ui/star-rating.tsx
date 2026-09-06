import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  className?: string;
}

/**
 * Accessible star rating. Read-only by default; pass onChange for an
 * interactive radio-group with hover preview and full keyboard support.
 * Uses token colors (foreground/active) rather than decorative yellow.
 */
export const StarRating = ({
  value,
  onChange,
  max = 5,
  size = 16,
  className,
}: StarRatingProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = typeof onChange === "function";
  const shown = hovered ?? value;

  if (!interactive) {
    return (
      <div
        className={cn("flex gap-0.5", className)}
        role="img"
        aria-label={`Rated ${value} of ${max}`}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <Star
            key={star}
            style={{ width: size, height: size }}
            className={cn(
              star <= value
                ? "fill-foreground text-foreground"
                : "text-muted-foreground/40"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("flex gap-0.5", className)}
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className="p-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange(star)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              onChange(Math.min(max, value + 1));
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              onChange(Math.max(0, value - 1));
            }
          }}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors",
              star <= shown
                ? "fill-foreground text-foreground"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
};
