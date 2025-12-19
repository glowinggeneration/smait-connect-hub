import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { MoreHorizontal, Lightbulb, Target } from "lucide-react";

interface FeaturedProjectCardProps {
  title: string;
  icon: "lightbulb" | "target";
  gradient: "primary" | "teal";
  team: { name: string }[];
  onClick?: () => void;
}

const gradientClasses = {
  primary: "bg-gradient-to-br from-primary to-primary/80",
  teal: "bg-gradient-to-br from-smait-teal to-emerald-400",
};

const iconComponents = {
  lightbulb: Lightbulb,
  target: Target,
};

export const FeaturedProjectCard = ({
  title,
  icon,
  gradient,
  team,
  onClick,
}: FeaturedProjectCardProps) => {
  const IconComponent = iconComponents[icon];

  return (
    <Card
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-0 min-h-[180px]",
        gradientClasses[gradient]
      )}
      onClick={onClick}
    >
      <CardContent className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-primary-foreground" />
          </div>
          <button className="w-8 h-8 rounded-lg bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors">
            <MoreHorizontal className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>

        <div className="mt-auto">
          <h3 className="text-lg font-semibold text-primary-foreground leading-tight mb-4">
            {title}
          </h3>
          <AvatarStack avatars={team} size="sm" />
        </div>
      </CardContent>
    </Card>
  );
};
