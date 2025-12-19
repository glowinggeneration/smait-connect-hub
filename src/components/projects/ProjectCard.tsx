import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in-progress" | "review" | "completed";
  progress: number;
  lastUpdated: string;
  client?: string;
  team?: string[];
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const statusConfig = {
  pending: { label: "Pending", variant: "pending" as const },
  "in-progress": { label: "In Progress", variant: "inProgress" as const },
  review: { label: "In Review", variant: "warning" as const },
  completed: { label: "Completed", variant: "completed" as const },
};

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const status = statusConfig[project.status];

  return (
    <Card
      variant="gradient"
      className={cn(
        "cursor-pointer group",
        "hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {project.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} variant="gradient" size="default" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{project.lastUpdated}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            View details
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Client info for admin view */}
        {project.client && (
          <div className="text-xs text-muted-foreground">
            Client: <span className="text-foreground font-medium">{project.client}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
