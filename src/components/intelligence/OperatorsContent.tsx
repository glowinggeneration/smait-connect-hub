import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { AgentRunHistory } from "@/components/agents/AgentRunHistory";
import { 
  Play, Loader2, Circle, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const operatorTemplates = [
  { label: "Mobile App", value: "Build a mobile-first application that..." },
  { label: "SaaS Platform", value: "Create a SaaS platform for businesses to..." },
  { label: "E-commerce", value: "Develop an e-commerce solution that allows..." },
  { label: "AI Tool", value: "Design an AI-powered tool that helps users..." }
];

const operators = [
  { id: "managing-partner", name: "Atlas", role: "Orchestrator" },
  { id: "client-discovery", name: "Echo", role: "Discovery" },
  { id: "strategy-feasibility", name: "Sage", role: "Strategy" },
  { id: "legal-compliance", name: "Justice", role: "Compliance" },
  { id: "proposal-scope", name: "Blueprint", role: "Scope" },
  { id: "finance-commercial", name: "Ledger", role: "Commercial" },
  { id: "brand-strategy", name: "Muse", role: "Brand" },
  { id: "design-production", name: "Canvas", role: "Design" },
  { id: "product-management", name: "Navigator", role: "Product" },
  { id: "technical-architecture", name: "Architect", role: "Architecture" },
  { id: "build-agent", name: "Forge", role: "Engineering" },
  { id: "ai-systems", name: "Synapse", role: "AI Systems" },
  { id: "quality-assurance", name: "Inspector", role: "QA" },
  { id: "security-risk", name: "Sentinel", role: "Security" },
  { id: "release-deployment", name: "Launch", role: "Deployment" },
  { id: "client-handover", name: "Bridge", role: "Handover" },
  { id: "support-maintenance", name: "Guardian", role: "Support" },
  { id: "growth-optimisation", name: "Catalyst", role: "Growth" },
];

const OperatorsContent = () => {
  const { activeRun, isRunning, startRun, cancelRun, fetchHistory, runHistory } = useAgentRun();
  const [brief, setBrief] = useState("");
  const [activeTab, setActiveTab] = useState("dispatch");

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDispatch = async () => {
    if (!brief.trim()) {
      toast.error("Directive required");
      return;
    }
    await startRun(brief);
    setBrief("");
    toast.success("Operators dispatched");
  };

  const getOperatorState = (operatorId: string) => {
    if (!activeRun) return "idle";
    if (activeRun.current_agent === operators.find(o => o.id === operatorId)?.name) return "executing";
    const operatorIndex = operators.findIndex(o => o.id === operatorId);
    const completedCount = Math.floor(activeRun.progress / 100 * operators.length);
    if (operatorIndex < completedCount) return "completed";
    return "idle";
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
          <TabsTrigger 
            value="dispatch" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
          >
            Dispatch
          </TabsTrigger>
          <TabsTrigger 
            value="status" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
          >
            Status
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm gap-2"
          >
            History
            {runHistory.length > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {runHistory.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dispatch" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="panel p-4 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Directive</h3>
                <p className="text-xs text-muted-foreground">
                  Define the outcome you need from the operator fleet
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {operatorTemplates.map(template => (
                  <Button
                    key={template.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setBrief(template.value)}
                    disabled={isRunning}
                    className="text-xs h-7"
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
              
              <Textarea
                placeholder="Describe the initiative, constraints, and desired outcomes..."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="min-h-[160px] resize-none text-sm"
                disabled={isRunning}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{brief.length} characters</span>
                <Button 
                  onClick={handleDispatch}
                  disabled={isRunning || !brief.trim()}
                  size="sm"
                  className="gap-2"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {activeRun?.progress || 0}%
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Dispatch
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isRunning && activeRun && (
              <div className="panel p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Active Execution</h3>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={cancelRun}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-state-active text-state-active" />
                    <span className="text-sm">{activeRun.current_agent || "Initializing..."}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {activeRun.progress}%
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-foreground transition-all duration-500"
                      style={{ width: `${activeRun.progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {activeRun.brief}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <div className="panel">
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border">
                {operators.map(operator => {
                  const state = getOperatorState(operator.id);
                  return (
                    <div key={operator.id} className="ledger-row">
                      <div className="flex items-center gap-3">
                        <Circle className={cn(
                          "h-2 w-2",
                          state === "executing" 
                            ? "fill-state-active text-state-active"
                            : state === "completed"
                              ? "fill-state-stable text-state-stable"
                              : "fill-muted text-muted"
                        )} />
                        <span className="text-sm font-medium">{operator.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{operator.role}</span>
                        <span className="text-xs capitalize text-muted-foreground">
                          {state}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AgentRunHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperatorsContent;
