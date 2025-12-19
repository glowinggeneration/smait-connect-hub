import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Calendar, ArrowRight } from "lucide-react";
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
  compact?: boolean;
}

const statusConfig = {
  pending: { label: "Pending", variant: "pending" as const },
  "in-progress": { label: "In Progress", variant: "inProgress" as const },
  review: { label: "In Review", variant: "warning" as const },
  completed: { label: "Completed", variant: "completed" as const },
};

export const ProjectCard = ({ project, onClick, compact = false }: ProjectCardProps) => {
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
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const isAdmin = window.location.pathname.startsWith("/admin");
      navigate(isAdmin ? `/admin/project/${project.id}` : `/client/project/${project.id}`);
    }
  };

  if (compact) {
    return (
      <Card
        className={cn(
          "cursor-pointer group border hover:border-primary/30 transition-colors",
          isOverdue && "border-destructive/20"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header: Name + Status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1">{project.name}</h3>
            <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 h-5 shrink-0">
              {status.label}
            </Badge>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} variant="gradient" size="sm" className="h-1.5" />
          </div>

          {/* Due Date */}
          {project.dueDate && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{format(parseISO(project.dueDate), "MMM d, yyyy")}</span>
              </div>
              {isOverdue && (
                <span className="text-[10px] text-destructive/80 font-medium">
                  {Math.abs(daysRemaining)} days overdue
                </span>
              )}
            </div>
          )}

          {/* Hover indicator */}
          <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity pt-1">
            View details
            <ArrowRight className="w-3 h-3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full card for other views
  return (
    <Card
      className={cn(
        "cursor-pointer group border hover:border-primary/30 transition-colors"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base line-clamp-1">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{project.progress}%</span>
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
              variant={isOverdue ? "destructive" : daysRemaining !== null && daysRemaining <= 7 ? "warning" : "secondary"}
              className="text-xs"
            >
              {isOverdue
                ? `${Math.abs(daysRemaining!)} days overdue`
                : daysRemaining === 0 
                  ? "Due today"
                  : `${daysRemaining} days left`}
            </Badge>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-border/50">
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
