import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectPhasesView } from "@/components/projects/ProjectPhasesView";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { mockProject, Project } from "@/types/project";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Layers, FileText, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ClientProjectDetail = () => {
  const navigate = useNavigate();
  const [project] = useState<Project>(mockProject);
  const [activeTab, setActiveTab] = useState("overview");

  const handleUploadBrief = () => {
    toast({
      title: "Upload Brief",
      description: "Brief upload functionality coming soon.",
    });
  };

  const handleOpenChat = () => {
    toast({
      title: "Project Chat",
      description: "Chat functionality coming soon.",
    });
  };

  const handleViewDeliverables = () => {
    toast({
      title: "Deliverables",
      description: "Deliverables view coming soon.",
    });
  };

  return (
    <DashboardLayout userType="client">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
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
              isAdmin={false}
              onBack={() => navigate("/client/projects")}
              onViewPhases={() => setActiveTab("phases")}
              onOpenChat={() => setActiveTab("messages")}
              onUploadBrief={handleUploadBrief}
              onViewDeliverables={() => setActiveTab("documents")}
            />
          </TabsContent>

          <TabsContent value="phases">
            <ProjectPhasesView
              project={project}
              isAdmin={false}
              onBack={() => setActiveTab("overview")}
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

export default ClientProjectDetail;
