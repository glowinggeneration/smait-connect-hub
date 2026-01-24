import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Target, Building2, MessageSquare, Loader2 } from "lucide-react";

// Lazy load tab content components
const LeadsContent = lazy(() => import("@/components/hub/LeadsContent"));
const ClientsContent = lazy(() => import("@/components/hub/ClientsContent"));
const InboxContent = lazy(() => import("@/components/hub/InboxContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const Network = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "relationships";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Network</h1>
          <p className="text-muted-foreground text-sm">
            Relationships, exposure, and communication
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-black/30 border border-white/10 p-1">
            <TabsTrigger value="relationships" className="gap-2 data-[state=active]:bg-white/10">
              <Building2 className="w-4 h-4" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="prospects" className="gap-2 data-[state=active]:bg-white/10">
              <Target className="w-4 h-4" />
              Prospects
            </TabsTrigger>
            <TabsTrigger value="communication" className="gap-2 data-[state=active]:bg-white/10">
              <MessageSquare className="w-4 h-4" />
              Communication
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="relationships" className="mt-0">
              <ClientsContent />
            </TabsContent>
            <TabsContent value="prospects" className="mt-0">
              <LeadsContent />
            </TabsContent>
            <TabsContent value="communication" className="mt-0">
              <InboxContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Network;
