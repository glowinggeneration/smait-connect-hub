import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ClientDashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import {
  FolderKanban,
  MessageSquare,
  CheckCircle2,
  Plus,
  Clock,
  ArrowRight,
} from "lucide-react";

interface Activity {
  id: string;
  action: string;
  action_type: string;
  created_at: string;
  project_id: string | null;
  projects: { name: string } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  due_date: string | null;
  updated_at: string;
}

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, status, progress, due_date, updated_at")
      .eq("client_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("activities")
      .select("id, action, action_type, created_at, project_id, projects(name)")
      .order("created_at", { ascending: false })
      .limit(8);

    if (!error && data) {
      setActivities(data as Activity[]);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchProjects(), fetchActivities()]);
      setLoading(false);
    };
    
    fetchData();

    const projectChannel = supabase
      .channel("client-projects")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Project) : p
              )
            );
          } else if (payload.eventType === "INSERT") {
            fetchProjects();
          }
        }
      )
      .subscribe();

    const activityChannel = supabase
      .channel("client-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [fetchProjects, fetchActivities]);

  const completedMilestones = useMemo(
    () => projects.reduce((acc, p) => acc + Math.floor(p.progress / 25), 0),
    [projects]
  );

  const stats = useMemo(() => [
    { label: "Active Projects", value: projects.length.toString(), icon: FolderKanban, color: "text-primary" },
    { label: "Messages", value: "5", icon: MessageSquare, color: "text-blue-500" },
    { label: "Milestones", value: completedMilestones.toString(), icon: CheckCircle2, color: "text-emerald-500" },
  ], [projects.length, completedMilestones]);

  if (loading) {
    return (
      <DashboardLayout userType="client">
        <ClientDashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="client">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="space-y-6 lg:space-y-8">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                Welcome back
              </h1>
              <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                Track your project progress and communicate with our team.
              </p>
            </div>

            <Button 
              variant="gradient" 
              onClick={() => navigate("/client/new-brief")}
              className="shrink-0 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Brief
            </Button>
          </header>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            {stats.map((stat, index) => (
              <Card 
                key={stat.label} 
                className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-3 lg:p-4 flex items-center gap-3 lg:gap-4">
                  <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color} shrink-0`}>
                    <stat.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl lg:text-2xl font-bold leading-none">{stat.value}</p>
                    <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projects */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg lg:text-xl font-semibold">Your Projects</h2>
              {projects.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/client/projects")} className="text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
            
            {projects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <FolderKanban className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <Button
                    variant="gradient"
                    onClick={() => navigate("/client/new-brief")}
                  >
                    Submit a Brief
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project, index) => {
                  const statusMap: Record<string, "pending" | "in-progress" | "review" | "completed"> = {
                    "not-started": "pending",
                    "in-progress": "in-progress",
                    "on-hold": "review",
                    "completed": "completed",
                  };
                  
                  return (
                    <div
                      key={project.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 75}ms` }}
                    >
                      <ProjectCard
                        project={{
                          id: project.id,
                          name: project.name,
                          description: project.description || "",
                          status: statusMap[project.status] || "pending",
                          progress: project.progress,
                          lastUpdated: formatDistanceToNow(new Date(project.updated_at), { addSuffix: true }),
                          dueDate: project.due_date || undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Overall Progress */}
          {projects.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base lg:text-lg">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {projects.slice(0, 4).map((project, index) => (
                  <div 
                    key={project.id} 
                    className="space-y-2 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm truncate pr-4">{project.name}</span>
                      <span className="text-sm text-muted-foreground font-medium shrink-0">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} variant="gradient" className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <aside className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No recent updates</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">
                          <span className="font-medium">{activity.action}</span>
                          {activity.projects?.name && (
                            <>
                              {" in "}
                              <span className="text-primary font-medium">{activity.projects.name}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
