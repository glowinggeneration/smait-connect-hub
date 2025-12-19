import { useEffect, useState } from "react";
import { Project, ProjectPhase } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Users,
  Target,
  MessageSquare,
  FileUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
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
}

export const ProjectOverview = ({
  project,
  isAdmin,
  onBack,
}: ProjectOverviewProps) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchTeam();
    fetchActivities();
  }, [project.id]);

  const fetchTeam = async () => {
    const { data, error } = await supabase
      .from("project_team")
      .select("id, role, user_id, profiles:user_id(full_name, avatar_url)")
      .eq("project_id", project.id);

    if (!error && data) {
      const teamMembers: TeamMember[] = data.map((member: any) => ({
        id: member.id,
        name: member.profiles?.full_name || "Unknown",
        role: member.role || "Team Member",
        avatar: member.profiles?.avatar_url,
      }));
      setTeam(teamMembers);
    }
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("activities")
      .select("id, action, action_type, created_at, user_id, profiles:user_id(full_name)")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      const formattedActivities: Activity[] = data.map((activity: any) => ({
        id: activity.id,
        user: activity.profiles?.full_name || "Team Member",
        action: activity.action,
        timestamp: formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }),
        type: activity.action_type as Activity["type"] || "update",
      }));
      setActivities(formattedActivities);
    }
  };

  const overallProgress = Math.round(
    project.phases.reduce((acc, phase) => acc + phase.progress, 0) /
      project.phases.length
  );

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
                Started {format(parseISO(project.createdAt), "MMM d, yyyy")}
              </div>
            </div>

            {/* Team Members */}
            {team.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Team:
                </span>
                <div className="flex -space-x-2">
                  {team.slice(0, 4).map((member) => (
                    <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {team.slice(0, 3).map(m => m.name).join(", ")}
                  {team.length > 3 && ` +${team.length - 3} more`}
                </span>
              </div>
            )}
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
                  "relative p-3 rounded-lg border transition-all",
                  phase.status === "completed" && "bg-emerald-500/5 border-emerald-500/30",
                  phase.status === "in-progress" && "bg-primary/5 border-primary/30 ring-2 ring-primary/20",
                  phase.status === "blocked" && "bg-destructive/5 border-destructive/30",
                  phase.status === "not-started" && "bg-muted/50 border-border"
                )}
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
        {/* Left Column - Summary & Phases Overview */}
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
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-sm">{project.description || "No description provided."}</p>
              </div>
              
              {/* Phase Status Overview */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Phase Status</h4>
                <div className="space-y-2">
                  {project.phases.map((phase) => (
                    <div key={phase.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        {getPhaseStatusIcon(phase)}
                        <span className="text-sm">{phase.name}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          phase.status === "completed" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          phase.status === "in-progress" && "bg-primary/10 text-primary border-primary/20",
                          phase.status === "blocked" && "bg-destructive/10 text-destructive border-destructive/20",
                          phase.status === "not-started" && "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {phase.status === "in-progress" ? "In Progress" : 
                         phase.status === "not-started" ? "Not Started" :
                         phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity yet for this project.
                </p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
