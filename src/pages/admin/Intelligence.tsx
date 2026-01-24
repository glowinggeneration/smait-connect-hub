import { useState, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIntelligence } from "@/contexts/IntelligenceContext";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { AgentRunHistory } from "@/components/agents/AgentRunHistory";
import { 
  Brain, Sparkles, Bot, ClipboardList, Loader2, 
  Activity, CheckCircle2, AlertCircle, Radio, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Lazy load components
const AdminAgentsContent = lazy(() => import("@/components/intelligence/OperatorsContent"));
const PlannerContent = lazy(() => import("@/components/intelligence/PlannerContent"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "risk": return AlertCircle;
      case "opportunity": return Activity;
      case "decision": return CheckCircle2;
      default: return Brain;
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Intelligence</h1>
              <p className="text-muted-foreground text-sm">
                Always-on system analysis and operator coordination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <Badge className="bg-primary/20 text-primary gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                {activeRun?.current_agent || "Operators Active"}
              </Badge>
            )}
            <Badge variant="outline" className={cn(
              "gap-1",
              isMonitoring && "border-green-500/30 text-green-400"
            )}>
              <Radio className="h-3 w-3" />
              {isMonitoring ? "Monitoring" : "Idle"}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-black/30 border border-white/10 p-1">
            <TabsTrigger value="signals" className="gap-2 data-[state=active]:bg-white/10">
              <Activity className="w-4 h-4" />
              Signals
              {signals.filter(s => !s.acknowledged).length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {signals.filter(s => !s.acknowledged).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="operators" className="gap-2 data-[state=active]:bg-white/10">
              <Bot className="w-4 h-4" />
              Operators
            </TabsTrigger>
            <TabsTrigger value="planner" className="gap-2 data-[state=active]:bg-white/10">
              <ClipboardList className="w-4 h-4" />
              Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signals" className="mt-0">
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  System Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mb-3 text-green-500" />
                    <p className="font-medium">System operating normally</p>
                    <p className="text-sm">No signals requiring attention</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {signals.map(signal => {
                        const Icon = getTypeIcon(signal.type);
                        return (
                          <div
                            key={signal.id}
                            className={cn(
                              "flex items-start gap-4 p-4 rounded-lg border transition-all",
                              signal.acknowledged 
                                ? "bg-white/5 border-white/10 opacity-60" 
                                : "bg-white/5 border-white/20 hover:border-primary/30"
                            )}
                          >
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                              getSeverityColor(signal.severity)
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium">{signal.title}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {signal.description}
                                  </p>
                                </div>
                                {!signal.acknowledged && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => acknowledgeSignal(signal.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs capitalize">{signal.type}</Badge>
                                <Badge variant="outline" className={cn("text-xs", getSeverityColor(signal.severity))}>
                                  {signal.severity}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(signal.createdAt), "MMM d, h:mm a")}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <Suspense fallback={<TabLoader />}>
            <TabsContent value="operators" className="mt-0">
              <AdminAgentsContent />
            </TabsContent>
            <TabsContent value="planner" className="mt-0">
              <PlannerContent />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Intelligence;
