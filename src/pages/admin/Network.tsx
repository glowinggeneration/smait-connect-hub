import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const LeadsContent = lazy(() => import("@/components/hub/LeadsContent"));
const ClientsContent = lazy(() => import("@/components/hub/ClientsContent"));
const InboxContent = lazy(() => import("@/components/hub/InboxContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
      <div className="space-y-6 max-w-6xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Network</h1>
          <p className="text-sm text-muted-foreground">
            Relationships, prospects, and communication
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
            <TabsTrigger 
              value="relationships" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Relationships
            </TabsTrigger>
            <TabsTrigger 
              value="prospects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Prospects
            </TabsTrigger>
            <TabsTrigger 
              value="communication" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Communication
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="relationships" className="mt-6">
              <ClientsContent />
            </TabsContent>
            <TabsContent value="prospects" className="mt-6">
              <LeadsContent />
            </TabsContent>
            <TabsContent value="communication" className="mt-6">
              <InboxContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Network;
