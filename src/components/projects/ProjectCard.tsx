import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format, parseISO } from "date-fns";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in-progress" | "review" | "completed";
  progress: number;
  lastUpdated: string;
  dueDate?: string;
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
  const navigate = useNavigate();
  const status = statusConfig[project.status];

  const getDaysRemaining = () => {
    if (!project.dueDate) return null;
    const dueDate = parseISO(project.dueDate);
    const today = new Date();
    const days = differenceInDays(dueDate, today);
    return days;
  };

  const daysRemaining = getDaysRemaining();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const isAdmin = window.location.pathname.startsWith("/admin");
      navigate(isAdmin ? `/admin/project/${project.id}` : `/client/project/${project.id}`);
    }
  };

  return (
    <Card
      variant="gradient"
      className={cn(
        "cursor-pointer group",
        "hover:border-primary/30"
      )}
      onClick={handleClick}
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

        {/* Due Date */}
        {project.dueDate && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Due: {format(parseISO(project.dueDate), "MMM d, yyyy")}</span>
            </div>
            <Badge 
              variant={daysRemaining !== null && daysRemaining < 0 ? "destructive" : daysRemaining !== null && daysRemaining <= 7 ? "warning" : "secondary"}
              className="text-xs"
            >
              {daysRemaining !== null && daysRemaining < 0 
                ? `${Math.abs(daysRemaining)} days overdue`
                : daysRemaining === 0 
                  ? "Due today"
                  : `${daysRemaining} days left`}
            </Badge>
          </div>
        )}

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
