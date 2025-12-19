import { cn } from "@/lib/utils";

interface AvatarStackProps {
  avatars: { name: string; color?: string }[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

const colors = [
  "bg-primary",
  "bg-smait-teal",
  "bg-amber-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
];

export const AvatarStack = ({ avatars, max = 3, size = "md" }: AvatarStackProps) => {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            "rounded-full flex items-center justify-center text-primary-foreground font-medium ring-2 ring-card",
            sizeClasses[size],
            avatar.color || colors[index % colors.length]
          )}
        >
          {avatar.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center bg-muted text-muted-foreground font-medium ring-2 ring-card",
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
