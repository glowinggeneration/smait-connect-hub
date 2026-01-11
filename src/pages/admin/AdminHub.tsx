import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Wrench, Link2, Settings, Loader2 } from "lucide-react";

// Lazy load tab content components
const UsersContent = lazy(() => import("@/components/hub/UsersContent"));
const ToolsContent = lazy(() => import("@/components/hub/ToolsContent"));
const IntegrationsContent = lazy(() => import("@/components/hub/IntegrationsContent"));
const SettingsContent = lazy(() => import("@/components/hub/SettingsContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const AdminHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-muted-foreground">
            Users, tools, integrations, and settings
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-black/30 border border-white/10 p-1">
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-white/10">
              <UserCog className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2 data-[state=active]:bg-white/10">
              <Wrench className="w-4 h-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-white/10">
              <Link2 className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-white/10">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="users" className="mt-0">
              <UsersContent />
            </TabsContent>
            <TabsContent value="tools" className="mt-0">
              <ToolsContent />
            </TabsContent>
            <TabsContent value="integrations" className="mt-0">
              <IntegrationsContent />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <SettingsContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminHub;
