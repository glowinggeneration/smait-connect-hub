import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

import { Project } from "@/components/projects/ProjectCard";

const ClientProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("client-projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mappedProjects: Project[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        status: mapStatus(p.status),
        progress: p.progress,
        lastUpdated: formatDistanceToNow(new Date(p.updated_at), { addSuffix: true }),
        dueDate: p.due_date || undefined,
      }));

      setProjects(mappedProjects);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mapStatus = (status: string): Project["status"] => {
    switch (status) {
      case "in-progress":
        return "in-progress";
      case "completed":
        return "completed";
      case "on-hold":
        return "review";
      default:
        return "pending";
    }
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            Track progress and view details of your projects
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {projects.filter((p) => p.status === "in-progress").length}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-500">
                {projects.filter((p) => p.status === "completed").length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No projects yet. Your projects will appear here once created.
            </CardContent>
          </Card>
        )}

        {/* Overall Progress */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.name}</span>
                      <Badge
                        variant={
                          project.status === "in-progress"
                            ? "inProgress"
                            : project.status === "completed"
                            ? "success"
                            : project.status === "review"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {project.status === "in-progress"
                          ? "In Progress"
                          : project.status === "review"
                          ? "On Hold"
                          : project.status === "completed"
                          ? "Completed"
                          : "Not Started"}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} variant="gradient" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientProjects;