import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Users, Loader2 } from "lucide-react";

// Lazy load tab content components
const LeadsContent = lazy(() => import("@/components/hub/LeadsContent"));
const ClientsContent = lazy(() => import("@/components/hub/ClientsContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const AdminPeopleHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "leads";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="text-muted-foreground">
            Manage leads and clients
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-black/30 border border-white/10 p-1">
            <TabsTrigger value="leads" className="gap-2 data-[state=active]:bg-white/10">
              <Target className="w-4 h-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2 data-[state=active]:bg-white/10">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="leads" className="mt-0">
              <LeadsContent />
            </TabsContent>
            <TabsContent value="clients" className="mt-0">
              <ClientsContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPeopleHub;
