import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, CheckSquare, FileText, Clock, Calendar, Loader2 } from "lucide-react";

// Lazy load tab content components
const ProjectsContent = lazy(() => import("@/components/hub/ProjectsContent"));
const TasksContent = lazy(() => import("@/components/hub/TasksContent"));
const BriefsContent = lazy(() => import("@/components/hub/BriefsContent"));
const StandupsContent = lazy(() => import("@/components/hub/StandupsContent"));
const MeetingsContent = lazy(() => import("@/components/hub/MeetingsContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work</h1>
          <p className="text-muted-foreground text-sm">
            Initiatives, assignments, and execution artifacts
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-black/30 border border-white/10 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="initiatives" className="gap-2 data-[state=active]:bg-white/10">
              <Target className="w-4 h-4" />
              Initiatives
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2 data-[state=active]:bg-white/10">
              <CheckSquare className="w-4 h-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="briefs" className="gap-2 data-[state=active]:bg-white/10">
              <FileText className="w-4 h-4" />
              Briefs
            </TabsTrigger>
            <TabsTrigger value="standups" className="gap-2 data-[state=active]:bg-white/10">
              <Clock className="w-4 h-4" />
              Standups
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-white/10">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="initiatives" className="mt-0">
              <ProjectsContent />
            </TabsContent>
            <TabsContent value="assignments" className="mt-0">
              <TasksContent />
            </TabsContent>
            <TabsContent value="briefs" className="mt-0">
              <BriefsContent />
            </TabsContent>
            <TabsContent value="standups" className="mt-0">
              <StandupsContent />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <MeetingsContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Work;
