import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectMilestones } from "@/components/projects/ProjectMilestones";
import { Project, defaultPhases } from "@/types/project";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, LayoutDashboard, Milestone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClientProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      fetchProject();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`project-${id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${id}` },
          (payload) => {
            updateProjectFromPayload(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const updateProjectFromPayload = async (projectData: any) => {
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name, company")
      .eq("user_id", projectData.client_id)
      .single();

    const projectWithPhases: Project = {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description || "",
      clientId: projectData.client_id,
      clientName: clientProfile?.full_name || clientProfile?.company || "Unknown",
      currentPhase: projectData.current_phase,
      phases: defaultPhases.map((phase, index) => ({
        ...phase,
        id: `phase-${index + 1}`,
        status: index < projectData.current_phase - 1 
          ? "completed" 
          : index === projectData.current_phase - 1 
            ? "in-progress" 
            : "not-started",
        progress: index < projectData.current_phase - 1 
          ? 100 
          : index === projectData.current_phase - 1 
            ? projectData.progress 
            : 0,
      })),
      createdAt: projectData.created_at,
      updatedAt: projectData.updated_at,
    };

    setProject(projectWithPhases);
  };

  const fetchProject = async () => {
    try {
      const { data: projectData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      await updateProjectFromPayload(projectData);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setLoading(false);
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

  if (!project) {
    return (
      <DashboardLayout userType="client">
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          Project not found
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="client">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center gap-2">
              <Milestone className="w-4 h-4" />
              Milestones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProjectOverview
              project={project}
              isAdmin={false}
              onBack={() => navigate("/client/projects")}
            />
          </TabsContent>

          <TabsContent value="milestones">
            <ProjectMilestones projectId={project.id} isAdmin={false} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClientProjectDetail;
