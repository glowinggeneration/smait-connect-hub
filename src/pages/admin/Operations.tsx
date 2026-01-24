import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const UsersContent = lazy(() => import("@/components/hub/UsersContent"));
const ToolsContent = lazy(() => import("@/components/hub/ToolsContent"));
const IntegrationsContent = lazy(() => import("@/components/hub/IntegrationsContent"));
const SettingsContent = lazy(() => import("@/components/hub/SettingsContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  </div>
);

const Operations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "team";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6 max-w-6xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
          <p className="text-sm text-muted-foreground">
            System configuration and team management
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
            <TabsTrigger 
              value="team" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Team
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Tools
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Integrations
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="team" className="mt-6">
              <UsersContent />
            </TabsContent>
            <TabsContent value="tools" className="mt-6">
              <ToolsContent />
            </TabsContent>
            <TabsContent value="integrations" className="mt-6">
              <IntegrationsContent />
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <SettingsContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Operations;
