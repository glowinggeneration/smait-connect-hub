import { cn } from "@/lib/utils";
import { ProjectPhase, PhaseStatus } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Edit3,
} from "lucide-react";

interface PhaseCardProps {
  phase: ProjectPhase;
  isActive: boolean;
  isAdmin: boolean;
  onClick?: () => void;
  onEdit?: () => void;
}

const statusConfig: Record<PhaseStatus, { icon: typeof Circle; label: string; color: string }> = {
  "not-started": { icon: Circle, label: "Not Started", color: "text-muted-foreground" },
  "in-progress": { icon: Clock, label: "In Progress", color: "text-primary" },
  "completed": { icon: CheckCircle2, label: "Completed", color: "text-emerald-500" },
  "blocked": { icon: AlertCircle, label: "Blocked", color: "text-destructive" },
};

export const PhaseCard = ({ phase, isActive, isAdmin, onClick, onEdit }: PhaseCardProps) => {
  const status = statusConfig[phase.status];
  const StatusIcon = status.icon;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 relative overflow-hidden group",
        isActive && "ring-2 ring-primary shadow-lg",
        phase.status === "completed" && "bg-emerald-50/50 dark:bg-emerald-950/20"
      )}
      onClick={onClick}
    >
      {/* Progress indicator on left */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-colors",
          phase.status === "completed" && "bg-emerald-500",
          phase.status === "in-progress" && "bg-primary",
          phase.status === "blocked" && "bg-destructive",
          phase.status === "not-started" && "bg-muted"
        )}
      />

      <CardHeader className="pb-3 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                phase.status === "completed" && "bg-emerald-500 text-primary-foreground",
                phase.status === "in-progress" && "bg-primary text-primary-foreground",
                phase.status === "not-started" && "bg-muted text-muted-foreground",
                phase.status === "blocked" && "bg-destructive text-primary-foreground"
              )}
            >
              {phase.order}
            </div>
            <div>
              <CardTitle className="text-base">
                {phase.customName || phase.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {phase.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
            )}
            {isAdmin && (
              <div className="text-muted-foreground">
                {phase.isVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pl-5 space-y-3">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("w-4 h-4", status.color)} />
          <span className={cn("text-sm font-medium", status.color)}>{status.label}</span>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{phase.progress}%</span>
          </div>
          <Progress 
            value={phase.progress} 
            variant={phase.status === "completed" ? "success" : "gradient"} 
            size="sm" 
          />
        </div>

        {/* View details indicator */}
        <div className="flex items-center justify-end text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View details
          <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
};
