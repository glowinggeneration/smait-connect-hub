import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useIntelligence } from "@/contexts/IntelligenceContext";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { AgentRunHistory } from "@/components/agents/AgentRunHistory";
import { Circle, Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Lazy load components
const OperatorsContent = lazy(() => import("@/components/intelligence/OperatorsContent"));
const PlannerContent = lazy(() => import("@/components/intelligence/PlannerContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  </div>
);

const Intelligence = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "signals";
  const { signals, acknowledgeSignal, isMonitoring } = useIntelligence();
  const { isRunning, activeRun } = useAgentRun();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "critical": return "state-blocked";
      case "high": return "state-risk";
      case "medium": return "state-active";
      default: return "text-muted-foreground";
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Intelligence</h1>
            <p className="text-sm text-muted-foreground">
              System analysis and operator coordination
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isRunning && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Circle className="h-2 w-2 fill-state-active text-state-active" />
                {activeRun?.current_agent || "Processing"}
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Circle className={cn(
                "h-2 w-2",
                isMonitoring ? "fill-state-stable text-state-stable" : "fill-muted text-muted"
              )} />
              {isMonitoring ? "Monitoring" : "Idle"}
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
            <TabsTrigger 
              value="signals" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm gap-2"
            >
              Signals
              {signals.filter(s => !s.acknowledged).length > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {signals.filter(s => !s.acknowledged).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="operators" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Operators
            </TabsTrigger>
            <TabsTrigger 
              value="planner" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signals" className="mt-6">
            <div className="panel">
              {signals.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <div className="text-center">
                    <Check className="h-5 w-5 mx-auto mb-2 state-stable" />
                    <p className="text-sm">System operating normally</p>
                    <p className="text-xs mt-1">No signals requiring attention</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[480px]">
                  <div className="divide-y divide-border">
                    {signals.map(signal => (
                      <div
                        key={signal.id}
                        className={cn(
                          "ledger-row",
                          signal.acknowledged && "opacity-50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Circle className={cn(
                              "h-2 w-2 shrink-0",
                              signal.acknowledged 
                                ? "fill-muted text-muted"
                                : signal.type === "risk" 
                                  ? "fill-state-risk text-state-risk"
                                  : "fill-state-active text-state-active"
                            )} />
                            <span className="text-sm font-medium">{signal.title}</span>
                            <span className={cn(
                              "text-xs capitalize",
                              getSeverityClass(signal.severity)
                            )}>
                              {signal.severity}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-4">
                            {signal.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(signal.createdAt), "MMM d, h:mm a")}
                          </span>
                          {!signal.acknowledged && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => acknowledgeSignal(signal.id)}
                              className="h-7 text-xs"
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="operators" className="mt-6">
              <OperatorsContent />
            </TabsContent>
            <TabsContent value="planner" className="mt-6">
              <PlannerContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Intelligence;
