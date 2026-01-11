import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderKanban, ListTodo, FileText, Loader2 } from "lucide-react";

// Lazy load tab content components
const ProjectsContent = lazy(() => import("@/components/hub/ProjectsContent"));
const TasksContent = lazy(() => import("@/components/hub/TasksContent"));
const BriefsContent = lazy(() => import("@/components/hub/BriefsContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const AdminWorkHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Work</h1>
          <p className="text-muted-foreground">
            Manage projects, tasks, and briefs
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-black/30 border border-white/10 p-1">
            <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-white/10">
              <FolderKanban className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-white/10">
              <ListTodo className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="briefs" className="gap-2 data-[state=active]:bg-white/10">
              <FileText className="w-4 h-4" />
              Briefs
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="projects" className="mt-0">
              <ProjectsContent />
            </TabsContent>
            <TabsContent value="tasks" className="mt-0">
              <TasksContent />
            </TabsContent>
            <TabsContent value="briefs" className="mt-0">
              <BriefsContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminWorkHub;
