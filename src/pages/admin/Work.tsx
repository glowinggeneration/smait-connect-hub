import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Lazy load tab content components
const ProjectsContent = lazy(() => import("@/components/hub/ProjectsContent"));
const TasksContent = lazy(() => import("@/components/hub/TasksContent"));
const BriefsContent = lazy(() => import("@/components/hub/BriefsContent"));
const StandupsContent = lazy(() => import("@/components/hub/StandupsContent"));
const MeetingsContent = lazy(() => import("@/components/hub/MeetingsContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  </div>
);

const Work = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "initiatives";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6 max-w-6xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Work</h1>
          <p className="text-sm text-muted-foreground">
            Initiatives, assignments, and execution artifacts
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
            <TabsTrigger 
              value="initiatives" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Initiatives
            </TabsTrigger>
            <TabsTrigger 
              value="assignments" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Assignments
            </TabsTrigger>
            <TabsTrigger 
              value="briefs" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Briefs
            </TabsTrigger>
            <TabsTrigger 
              value="standups" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Standups
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Calendar
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="initiatives" className="mt-6">
              <ProjectsContent />
            </TabsContent>
            <TabsContent value="assignments" className="mt-6">
              <TasksContent />
            </TabsContent>
            <TabsContent value="briefs" className="mt-6">
              <BriefsContent />
            </TabsContent>
            <TabsContent value="standups" className="mt-6">
              <StandupsContent />
            </TabsContent>
            <TabsContent value="calendar" className="mt-6">
              <MeetingsContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Work;
