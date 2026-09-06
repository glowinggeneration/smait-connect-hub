import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectPhasesView } from "@/components/projects/ProjectPhasesView";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectMilestones } from "@/components/projects/ProjectMilestones";
import { mockProject, Project, defaultPhases } from "@/types/project";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Layers, FileText, MessageSquare, Loader2, Milestone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";

const AdminProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data: projectData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Get client name
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name, company")
        .eq("user_id", projectData.client_id)
        .single();

      // Build project with phases (using default phases structure)
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
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    setProject(updatedProject);
    
    // Calculate overall progress from phases
    const overallProgress = Math.round(
      updatedProject.phases.reduce((acc, phase) => acc + phase.progress, 0) /
        updatedProject.phases.length
    );

    // Determine status
    const completedPhases = updatedProject.phases.filter(p => p.status === "completed").length;
    let status = "in-progress";
    if (overallProgress === 100) {
      status = "completed";
    } else if (overallProgress === 0) {
      status = "not-started";
    }

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          progress: overallProgress,
          status,
          current_phase: updatedProject.currentPhase,
          updated_at: new Date().toISOString(),
        })
        .eq("id", updatedProject.id);

      if (error) throw error;

      // Log activity
      const user = await getCurrentUser();
      if (user) {
        await supabase.from("activities").insert({
          user_id: user.id,
          project_id: updatedProject.id,
          action: `Updated project progress to ${overallProgress}%`,
          action_type: "update",
        });

        // Notify client
        await supabase.from("notifications").insert({
          user_id: updatedProject.clientId,
          title: "Project Updated",
          message: `${updatedProject.name} progress updated to ${overallProgress}%`,
          type: overallProgress === 100 ? "success" : "info",
        });
      }

      toast.success("Project Updated", { description: `Progress saved: ${overallProgress}%` });
    } catch (error: any) {
      toast.error("Error saving changes", { description: error.message });
    }
  };

  const handleUploadBrief = () => {
    toast.success("Upload Brief", { description: "Brief upload functionality coming soon." });
  };

  const handleOpenChat = () => {
    toast.success("Project Chat", { description: "Chat functionality coming soon." });
  };

  const handleViewDeliverables = () => {
    toast.success("Deliverables", { description: "Deliverables view coming soon." });
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          Project not found
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
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
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Phases
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProjectOverview
              project={project}
              isAdmin={true}
              onBack={() => navigate("/admin/projects")}
              onProjectUpdate={(updated) => setProject(updated)}
            />
          </TabsContent>

          <TabsContent value="milestones">
            <ProjectMilestones projectId={project.id} isAdmin={true} />
          </TabsContent>

          <TabsContent value="phases">
            <ProjectPhasesView
              project={project}
              isAdmin={true}
              onBack={() => setActiveTab("overview")}
              onUpdateProject={handleUpdateProject}
            />
          </TabsContent>

          <TabsContent value="documents">
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Documents section coming soon...
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Project messages coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminProjectDetail;