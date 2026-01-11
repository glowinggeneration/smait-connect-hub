import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, Clock, Calendar, Loader2 } from "lucide-react";

// Lazy load tab content components
const InboxContent = lazy(() => import("@/components/hub/InboxContent"));
const StandupsContent = lazy(() => import("@/components/hub/StandupsContent"));
const MeetingsContent = lazy(() => import("@/components/hub/MeetingsContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const AdminCommsHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "inbox";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Communication</h1>
          <p className="text-muted-foreground">
            Inbox, standups, and meetings
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-black/30 border border-white/10 p-1">
            <TabsTrigger value="inbox" className="gap-2 data-[state=active]:bg-white/10">
              <Inbox className="w-4 h-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="standups" className="gap-2 data-[state=active]:bg-white/10">
              <Clock className="w-4 h-4" />
              Standups
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2 data-[state=active]:bg-white/10">
              <Calendar className="w-4 h-4" />
              Meetings
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="inbox" className="mt-0">
              <InboxContent />
            </TabsContent>
            <TabsContent value="standups" className="mt-0">
              <StandupsContent />
            </TabsContent>
            <TabsContent value="meetings" className="mt-0">
              <MeetingsContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminCommsHub;
