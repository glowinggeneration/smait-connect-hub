import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronRight,
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
      .limit(4);

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
    { label: "Active Projects", value: projects.length.toString(), icon: FolderKanban, color: "text-primary", href: "/client/projects" },
    { label: "Messages", value: "5", icon: MessageSquare, color: "text-blue-500", href: "/client/messages" },
    { label: "Milestones", value: completedMilestones.toString(), icon: CheckCircle2, color: "text-emerald-500", href: "/client/projects" },
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
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Main Content */}
        <div className="space-y-5">
          {/* Compact Header */}
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                Welcome back
              </h1>
              <p className="text-muted-foreground text-sm">
                Track your project progress and communicate with our team.
              </p>
            </div>

            <Button 
              variant="gradient" 
              size="sm"
              onClick={() => navigate("/client/new-brief")}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Brief
            </Button>
          </header>

          {/* Compact Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <button
                key={stat.label}
                onClick={() => navigate(stat.href)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left group"
              >
                <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${stat.color} shrink-0`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-none">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          {/* Projects */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Your Projects</h2>
              {projects.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/client/projects")} className="text-muted-foreground hover:text-foreground h-8 px-2">
                  View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
            
            {projects.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <FolderKanban className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">No projects yet</p>
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => navigate("/client/new-brief")}
                  >
                    Submit a Brief
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      style={{ animationDelay: `${index * 50}ms` }}
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
                        compact
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Panel - Recent Updates */}
        <aside>
          <Card className="sticky top-6">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Recent Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activities.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground">No recent updates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 4).map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-2.5 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed">
                          <span className="font-medium">{activity.action}</span>
                          {activity.projects?.name && (
                            <>
                              {" in "}
                              <span className="text-primary font-medium">{activity.projects.name}</span>
                            </>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground mt-2"
                    onClick={() => navigate("/client/notifications")}
                  >
                    View all activity
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
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
