import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { AgentRunHistory } from "@/components/agents/AgentRunHistory";
import { 
  Bot, Play, History, Loader2, Sparkles, Lightbulb,
  StopCircle, Zap, Crown, Users, Target, Scale, 
  FileText, DollarSign, Palette, PenTool, Package,
  Server, Code, Brain, TestTube, Shield, Rocket,
  Handshake, HeadphonesIcon, TrendingUp, Radio
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
  { id: "managing-partner", name: "Atlas", role: "Orchestrator", icon: Crown, state: "idle" },
  { id: "client-discovery", name: "Echo", role: "Discovery", icon: Users, state: "idle" },
  { id: "strategy-feasibility", name: "Sage", role: "Strategy", icon: Target, state: "idle" },
  { id: "legal-compliance", name: "Justice", role: "Compliance", icon: Scale, state: "idle" },
  { id: "proposal-scope", name: "Blueprint", role: "Scope", icon: FileText, state: "idle" },
  { id: "finance-commercial", name: "Ledger", role: "Commercial", icon: DollarSign, state: "idle" },
  { id: "brand-strategy", name: "Muse", role: "Brand", icon: Palette, state: "idle" },
  { id: "design-production", name: "Canvas", role: "Design", icon: PenTool, state: "idle" },
  { id: "product-management", name: "Navigator", role: "Product", icon: Package, state: "idle" },
  { id: "technical-architecture", name: "Architect", role: "Architecture", icon: Server, state: "idle" },
  { id: "build-agent", name: "Forge", role: "Engineering", icon: Code, state: "idle" },
  { id: "ai-systems", name: "Synapse", role: "AI Systems", icon: Brain, state: "idle" },
  { id: "quality-assurance", name: "Inspector", role: "QA", icon: TestTube, state: "idle" },
  { id: "security-risk", name: "Sentinel", role: "Security", icon: Shield, state: "idle" },
  { id: "release-deployment", name: "Launch", role: "Deployment", icon: Rocket, state: "idle" },
  { id: "client-handover", name: "Bridge", role: "Handover", icon: Handshake, state: "idle" },
  { id: "support-maintenance", name: "Guardian", role: "Support", icon: HeadphonesIcon, state: "idle" },
  { id: "growth-optimisation", name: "Catalyst", role: "Growth", icon: TrendingUp, state: "idle" },
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
      toast.error("Directive required to dispatch operators");
      return;
    }
    await startRun(brief);
    setBrief("");
    toast.success("Operators dispatched. Monitoring in background.");
  };

  const getOperatorState = (operatorId: string) => {
    if (!activeRun) return "idle";
    if (activeRun.current_agent === operators.find(o => o.id === operatorId)?.name) return "executing";
    // Check if completed based on progress
    const operatorIndex = operators.findIndex(o => o.id === operatorId);
    const completedCount = Math.floor(activeRun.progress / 100 * operators.length);
    if (operatorIndex < completedCount) return "completed";
    return "monitoring";
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "executing": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "monitoring": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "escalated": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-muted/50 text-muted-foreground border-muted";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/30 border border-white/10">
          <TabsTrigger value="dispatch" className="gap-2 data-[state=active]:bg-white/10">
            <Zap className="h-4 w-4" />
            Dispatch
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2 data-[state=active]:bg-white/10">
            <Radio className="h-4 w-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white/10">
            <History className="h-4 w-4" />
            History
            {runHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{runHistory.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dispatch" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Dispatch Directive
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {operatorTemplates.map(template => (
                    <Button
                      key={template.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setBrief(template.value)}
                      disabled={isRunning}
                      className="text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {template.label}
                    </Button>
                  ))}
                </div>
                
                <Textarea
                  placeholder="Define the directive for your operators. What outcome do you need? What constraints apply?"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  className="min-h-[180px] resize-none"
                  disabled={isRunning}
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{brief.length} characters</span>
                  <Button 
                    onClick={handleDispatch}
                    disabled={isRunning || !brief.trim()}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Executing ({activeRun?.progress || 0}%)
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Dispatch Operators
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isRunning && activeRun && (
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                      Active Execution
                    </span>
                    <Button size="sm" variant="ghost" onClick={cancelRun}>
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{activeRun.current_agent || "Initializing..."}</span>
                      <Badge>{activeRun.progress}%</Badge>
                    </div>
                    <Progress value={activeRun.progress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {activeRun.brief}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Operator Fleet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {operators.map(operator => {
                  const Icon = operator.icon;
                  const state = getOperatorState(operator.id);
                  return (
                    <div
                      key={operator.id}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        getStateColor(state)
                      )}
                    >
                      <Icon className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-xs font-medium truncate">{operator.name}</p>
                      <p className="text-[10px] opacity-70">{operator.role}</p>
                      <Badge variant="outline" className="mt-2 text-[10px] capitalize">
                        {state}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AgentRunHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperatorsContent;
