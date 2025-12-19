import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  FolderKanban,
  MessageSquare,
  CheckCircle2,
  Plus,
  Clock,
  Loader2,
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

  useEffect(() => {
    fetchData();

    // Subscribe to realtime project changes
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
            // Refetch to check if it's for this client
            fetchProjects();
          }
        }
      )
      .subscribe();

    // Subscribe to realtime activity changes
    const activityChannel = supabase
      .channel("client-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(activityChannel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchProjects(), fetchActivities()]);
    setLoading(false);
  };

  const fetchProjects = async () => {
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
  };

  const fetchActivities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("activities")
      .select("id, action, action_type, created_at, project_id, projects(name)")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setActivities(data as Activity[]);
    }
  };

  const completedMilestones = projects.reduce(
    (acc, p) => acc + Math.floor(p.progress / 25),
    0
  );

  if (loading) {
    return (
      <DashboardLayout userType="client">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="client">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="text-muted-foreground mt-1">
                Track your project progress and communicate with our team.
              </p>
            </div>

            <Button variant="gradient" onClick={() => navigate("/client/new-brief")}>
              <Plus className="w-4 h-4 mr-2" />
              New Brief
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Active Projects", value: projects.length.toString(), icon: FolderKanban, color: "text-primary" },
              { label: "Messages", value: "5", icon: MessageSquare, color: "text-blue-500" },
              { label: "Milestones", value: completedMilestones.toString(), icon: CheckCircle2, color: "text-emerald-500" },
            ].map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projects */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            {projects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No projects yet</p>
                  <Button
                    variant="gradient"
                    className="mt-4"
                    onClick={() => navigate("/client/new-brief")}
                  >
                    Submit a Brief
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project, index) => {
                  // Map database status to ProjectCard status
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
                      style={{ animationDelay: `${index * 100}ms` }}
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
          </div>

          {/* Overall Progress */}
          {projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {projects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{project.name}</span>
                      <span className="text-sm text-muted-foreground">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} variant="gradient" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent updates</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.action}</span>
                        {activity.projects?.name && (
                          <>
                            {" in "}
                            <span className="text-primary font-medium">{activity.projects.name}</span>
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;