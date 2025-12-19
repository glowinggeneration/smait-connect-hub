import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    { label: "Projects", value: projects.length.toString(), icon: FolderKanban, color: "text-primary bg-primary/10", href: "/client/projects" },
    { label: "Messages", value: "5", icon: MessageSquare, color: "text-blue-500 bg-blue-500/10", href: "/client/messages" },
    { label: "Milestones", value: completedMilestones.toString(), icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10", href: "/client/projects" },
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
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm">
              Track your projects and stay connected.
            </p>
          </div>

          <Button 
            variant="gradient" 
            size="sm"
            onClick={() => navigate("/client/new-brief")}
            className="shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Brief
          </Button>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((stat, index) => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.href)}
              className={`flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl border border-border/50 bg-card hover:bg-muted/30 transition-all text-center sm:text-left group animate-fade-in stagger-${index + 1}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold leading-none">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
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
            <Card className="border-dashed border-2">
              <CardContent className="py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm mb-4">No projects yet</p>
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
            <div className="grid grid-cols-1 gap-3">
              {projects.slice(0, 3).map((project, index) => {
                const statusMap: Record<string, "pending" | "in-progress" | "review" | "completed"> = {
                  "not-started": "pending",
                  "in-progress": "in-progress",
                  "on-hold": "review",
                  "completed": "completed",
                };
                
                return (
                  <div
                    key={project.id}
                    className={`animate-fade-in stagger-${index + 1}`}
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

        {/* Recent Updates */}
        {activities.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recent Activity
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/client/notifications")} className="text-muted-foreground hover:text-foreground h-8 px-2">
                View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-3 sm:p-4 divide-y divide-border/50">
                {activities.slice(0, 4).map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className={`flex items-start gap-3 py-3 first:pt-0 last:pb-0 animate-fade-in stagger-${index + 1}`}
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
