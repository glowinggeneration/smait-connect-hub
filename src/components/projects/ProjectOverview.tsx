import { Project, ProjectPhase } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Users,
  Target,
  MessageSquare,
  FileUp,
  FolderOpen,
  CheckCircle2,
  Circle,
  AlertCircle,
  PlayCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: "completed" | "in-progress" | "upcoming" | "overdue";
}

interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: "update" | "upload" | "comment" | "milestone";
}

interface ProjectOverviewProps {
  project: Project;
  isAdmin: boolean;
  onBack?: () => void;
  onViewPhases?: () => void;
  onOpenChat?: () => void;
  onUploadBrief?: () => void;
  onViewDeliverables?: () => void;
}

// Mock data - in a real app, this would come from the database
const mockTeam: TeamMember[] = [
  { id: "1", name: "Sarah Chen", role: "Project Lead" },
  { id: "2", name: "Mike Johnson", role: "Senior Designer" },
  { id: "3", name: "Emma Wilson", role: "Developer" },
];

const mockMilestones: Milestone[] = [
  { id: "1", title: "Discovery Complete", dueDate: "2024-01-20", status: "completed" },
  { id: "2", title: "Design Approval", dueDate: "2024-02-05", status: "completed" },
  { id: "3", title: "Development Sprint 1", dueDate: "2024-02-25", status: "in-progress" },
  { id: "4", title: "User Testing", dueDate: "2024-03-10", status: "upcoming" },
  { id: "5", title: "Final Delivery", dueDate: "2024-03-25", status: "upcoming" },
];

const mockActivities: Activity[] = [
  { id: "1", user: "Sarah Chen", action: "Updated phase progress to 65%", timestamp: "2 hours ago", type: "update" },
  { id: "2", user: "Mike Johnson", action: "Uploaded new design mockups", timestamp: "5 hours ago", type: "upload" },
  { id: "3", user: "Client", action: "Approved wireframes for homepage", timestamp: "1 day ago", type: "milestone" },
  { id: "4", user: "Emma Wilson", action: "Completed responsive layout implementation", timestamp: "2 days ago", type: "update" },
  { id: "5", user: "Sarah Chen", action: "Added comment on design review", timestamp: "3 days ago", type: "comment" },
];

export const ProjectOverview = ({
  project,
  isAdmin,
  onBack,
  onViewPhases,
  onOpenChat,
  onUploadBrief,
  onViewDeliverables,
}: ProjectOverviewProps) => {
  const overallProgress = Math.round(
    project.phases.reduce((acc, phase) => acc + phase.progress, 0) /
      project.phases.length
  );

  const completedPhases = project.phases.filter(
    (p) => p.status === "completed"
  ).length;

  const currentPhase = project.phases.find(
    (p) => p.order === project.currentPhase
  );

  const getPhaseStatusIcon = (phase: ProjectPhase) => {
    switch (phase.status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "in-progress":
        return <PlayCircle className="w-4 h-4 text-primary" />;
      case "blocked":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMilestoneStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "in-progress":
        return "bg-primary/10 text-primary border-primary/20";
      case "overdue":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "upload":
        return <FileUp className="w-4 h-4" />;
      case "comment":
        return <MessageSquare className="w-4 h-4" />;
      case "milestone":
        return <Target className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getProjectStatus = () => {
    if (overallProgress === 100) return { label: "Completed", color: "bg-emerald-500/10 text-emerald-500" };
    if (project.phases.some(p => p.status === "blocked")) return { label: "Blocked", color: "bg-destructive/10 text-destructive" };
    return { label: "In Progress", color: "bg-primary/10 text-primary" };
  };

  const projectStatus = getProjectStatus();

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge className={cn("border", projectStatus.color)}>
                {projectStatus.label}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span className="font-medium text-foreground">{project.clientName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                Phase {project.currentPhase}: {currentPhase?.name || "Unknown"}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Started {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Team Members */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                SMAIT Team:
              </span>
              <div className="flex -space-x-2">
                {mockTeam.map((member) => (
                  <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {mockTeam.map(m => m.name).join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Progress Visualization */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Project Progress</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-primary">{overallProgress}%</span>
              <span className="text-sm text-muted-foreground">Complete</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <Progress value={overallProgress} variant="gradient" size="lg" />
          
          {/* Phase Indicators */}
          <div className="grid grid-cols-5 gap-2">
            {project.phases.map((phase, index) => (
              <div
                key={phase.id}
                className={cn(
                  "relative p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                  phase.status === "completed" && "bg-emerald-500/5 border-emerald-500/30",
                  phase.status === "in-progress" && "bg-primary/5 border-primary/30 ring-2 ring-primary/20",
                  phase.status === "blocked" && "bg-destructive/5 border-destructive/30",
                  phase.status === "not-started" && "bg-muted/50 border-border"
                )}
                onClick={onViewPhases}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getPhaseStatusIcon(phase)}
                  <span className="text-xs font-medium">Phase {index + 1}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{phase.name}</p>
                <div className="mt-2">
                  <Progress value={phase.progress} size="sm" className="h-1" />
                  <span className="text-xs text-muted-foreground">{phase.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Summary & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Project Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Objectives</h4>
                <p className="text-sm">{project.description}</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Scope</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Complete UI/UX redesign
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Responsive implementation
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                    Performance optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                    User testing & feedback
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Key Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Key Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : milestone.status === "in-progress" ? (
                        <PlayCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "text-sm font-medium",
                        milestone.status === "completed" && "line-through text-muted-foreground"
                      )}>
                        {milestone.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(milestone.dueDate).toLocaleDateString()}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getMilestoneStatusColor(milestone.status))}
                      >
                        {milestone.status === "in-progress" ? "In Progress" : 
                         milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={onViewDeliverables}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  View Deliverables
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={onUploadBrief}
              >
                <span className="flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  Upload Brief
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={onOpenChat}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Project Chat
                </span>
                <Badge className="bg-primary/10 text-primary text-xs">3 new</Badge>
              </Button>
              <Button
                variant="gradient"
                className="w-full"
                onClick={onViewPhases}
              >
                View All Phases
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
