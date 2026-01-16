import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, Users, Target, Scale, FileText, DollarSign, 
  Palette, PenTool, Package, Server, Code, Brain,
  TestTube, Shield, Rocket, Handshake, HeadphonesIcon, TrendingUp,
  Play, Download, X, MessageSquare, Loader2, FileDown,
  Sparkles, Clock, CheckCircle2, AlertCircle, Eye, Zap, 
  Lightbulb, History, StopCircle
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { AgentRunHistory } from "@/components/agents/AgentRunHistory";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  role: string;
  persona: string;
  phase: number;
  phaseName: string;
  icon: React.ElementType;
  color: string;
  responsibilities: string[];
  output: string;
  status: "idle" | "working" | "completed" | "waiting" | "error";
  result?: string;
}

interface Message {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: string;
  type: "working" | "output" | "handoff";
}

const initialAgents: Agent[] = [
  { id: "managing-partner", name: "Atlas", role: "Managing Partner", persona: "The Orchestrator - Controls the entire agency with absolute authority", phase: 0, phaseName: "Orchestration", icon: Crown, color: "from-amber-500 to-orange-600", responsibilities: ["Receives client requests", "Breaks jobs into phases", "Assigns work to agents", "Enforces quality gates", "Resolves conflicts"], output: "Phase assignments & approvals", status: "idle" },
  { id: "client-discovery", name: "Echo", role: "Client Discovery Agent", persona: "Account Manager - Interviews clients and extracts project requirements", phase: 1, phaseName: "Client & Strategy", icon: Users, color: "from-blue-500 to-cyan-600", responsibilities: ["Interviews the client", "Extracts goals & constraints", "Clarifies budget & timelines"], output: "Approved Project Brief", status: "idle" },
  { id: "strategy-feasibility", name: "Sage", role: "Strategy & Feasibility Agent", persona: "Strategy Consultant - Tests viability and recommends approach", phase: 1, phaseName: "Client & Strategy", icon: Target, color: "from-indigo-500 to-purple-600", responsibilities: ["Tests idea viability", "Identifies risks", "Suggests best approach"], output: "Go/No-Go recommendation", status: "idle" },
  { id: "legal-compliance", name: "Justice", role: "Legal & Compliance Agent", persona: "Legal Counsel - Drafts contracts and ensures compliance", phase: 2, phaseName: "Legal & Commercial", icon: Scale, color: "from-slate-500 to-gray-600", responsibilities: ["Drafts contracts & NDAs", "Defines IP ownership", "Flags legal red zones"], output: "Legal pack ready for approval", status: "idle" },
  { id: "proposal-scope", name: "Blueprint", role: "Proposal & Scope Agent", persona: "Commercial Strategist - Converts strategy into deliverables", phase: 2, phaseName: "Legal & Commercial", icon: FileText, color: "from-emerald-500 to-teal-600", responsibilities: ["Converts strategy into scope", "Defines deliverables", "Sets milestones"], output: "Final proposal document", status: "idle" },
  { id: "finance-commercial", name: "Ledger", role: "Finance & Commercial Agent", persona: "CFO - Structures pricing and controls commercial risk", phase: 2, phaseName: "Legal & Commercial", icon: DollarSign, color: "from-green-500 to-emerald-600", responsibilities: ["Structures pricing", "Breaks cost by phase", "Controls commercial risk"], output: "Commercial approval", status: "idle" },
  { id: "brand-strategy", name: "Muse", role: "Brand Strategy Agent", persona: "Brand Director - Defines voice, tone, and visual direction", phase: 3, phaseName: "Brand & Design", icon: Palette, color: "from-pink-500 to-rose-600", responsibilities: ["Defines brand voice", "Establishes visual direction", "Sets UX principles"], output: "Brand & UX strategy", status: "idle" },
  { id: "design-production", name: "Canvas", role: "Design Production Agent", persona: "Creative Studio - Produces UI/UX designs and visual assets", phase: 3, phaseName: "Brand & Design", icon: PenTool, color: "from-fuchsia-500 to-pink-600", responsibilities: ["Produces UI/UX designs", "Creates visual assets", "Iterates on feedback"], output: "Design system & mockups", status: "idle" },
  { id: "product-management", name: "Navigator", role: "Product Management Agent", persona: "Product Owner - Converts designs into features and user stories", phase: 4, phaseName: "Product & Engineering", icon: Package, color: "from-violet-500 to-purple-600", responsibilities: ["Converts designs to features", "Writes user stories", "Prioritises backlog"], output: "Product requirements & roadmap", status: "idle" },
  { id: "technical-architecture", name: "Architect", role: "Technical Architecture Agent", persona: "Technical Lead - Designs system architecture and data flows", phase: 4, phaseName: "Product & Engineering", icon: Server, color: "from-cyan-500 to-blue-600", responsibilities: ["Designs system architecture", "Defines data flows", "Sets security standards"], output: "Technical blueprint", status: "idle" },
  { id: "build-agent", name: "Forge", role: "Build Agent", persona: "Software Engineer - Implements the product and builds interfaces", phase: 4, phaseName: "Product & Engineering", icon: Code, color: "from-orange-500 to-red-600", responsibilities: ["Implements the product", "Builds logic & interfaces", "Integrates AI functionality"], output: "Working application", status: "idle" },
  { id: "ai-systems", name: "Synapse", role: "AI Systems Agent", persona: "AI Engineer - Designs AI behaviour and agent logic", phase: 4, phaseName: "Product & Engineering", icon: Brain, color: "from-purple-500 to-indigo-600", responsibilities: ["Designs AI behaviour", "Writes prompts & rules", "Builds agent logic"], output: "AI logic & behaviour layer", status: "idle" },
  { id: "quality-assurance", name: "Inspector", role: "Quality Assurance Agent", persona: "QA Lead - Tests functionality and validates UX flows", phase: 5, phaseName: "Quality, Risk & Release", icon: TestTube, color: "from-yellow-500 to-amber-600", responsibilities: ["Tests functionality", "Checks edge cases", "Validates UX flows"], output: "QA approval or rejection", status: "idle" },
  { id: "security-risk", name: "Sentinel", role: "Security & Risk Agent", persona: "Risk Officer - Reviews data handling and flags vulnerabilities", phase: 5, phaseName: "Quality, Risk & Release", icon: Shield, color: "from-red-500 to-rose-600", responsibilities: ["Reviews data handling", "Checks permissions", "Flags vulnerabilities"], output: "Security clearance", status: "idle" },
  { id: "release-deployment", name: "Launch", role: "Release & Deployment Agent", persona: "Release Manager - Prepares and executes deployment", phase: 5, phaseName: "Quality, Risk & Release", icon: Rocket, color: "from-sky-500 to-blue-600", responsibilities: ["Prepares launch", "Final checks", "Version control"], output: "Live product", status: "idle" },
  { id: "client-handover", name: "Bridge", role: "Client Handover Agent", persona: "Client Success - Creates documentation and onboards client", phase: 6, phaseName: "Handover, Support & Growth", icon: Handshake, color: "from-teal-500 to-cyan-600", responsibilities: ["Creates manuals", "Prepares onboarding", "Formal handover"], output: "Client-ready documentation", status: "idle" },
  { id: "support-maintenance", name: "Guardian", role: "Support & Maintenance Agent", persona: "Support Desk - Handles issues and monitors performance", phase: 6, phaseName: "Handover, Support & Growth", icon: HeadphonesIcon, color: "from-lime-500 to-green-600", responsibilities: ["Handles issues", "Logs bugs", "Monitors performance"], output: "Ongoing stability", status: "idle" },
  { id: "growth-optimisation", name: "Catalyst", role: "Growth & Optimisation Agent", persona: "Strategy & Scale - Analyses usage and recommends improvements", phase: 6, phaseName: "Handover, Support & Growth", icon: TrendingUp, color: "from-amber-500 to-yellow-600", responsibilities: ["Analyses usage", "Recommends improvements", "Identifies upsell opportunities"], output: "Continuous improvement roadmap", status: "idle" }
];

const phaseInfo = [
  { name: "Orchestration", icon: Crown, color: "from-amber-500/20 to-orange-500/20 border-amber-500/30" },
  { name: "Client & Strategy", icon: Target, color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
  { name: "Legal & Commercial", icon: FileText, color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30" },
  { name: "Brand & Design", icon: Palette, color: "from-pink-500/20 to-rose-500/20 border-pink-500/30" },
  { name: "Product & Engineering", icon: Code, color: "from-violet-500/20 to-purple-500/20 border-violet-500/30" },
  { name: "Quality, Risk & Release", icon: TestTube, color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30" },
  { name: "Handover, Support & Growth", icon: Handshake, color: "from-teal-500/20 to-cyan-500/20 border-teal-500/30" }
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  idle: { label: "Ready", color: "bg-muted/50 text-muted-foreground border-muted", icon: Clock },
  working: { label: "Working", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: Loader2 },
  completed: { label: "Done", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle2 },
  waiting: { label: "Queued", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  error: { label: "Error", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle }
};

const briefTemplates = [
  { label: "Mobile App", value: "Build a mobile-first application that..." },
  { label: "SaaS Platform", value: "Create a SaaS platform for businesses to..." },
  { label: "E-commerce", value: "Develop an e-commerce solution that allows..." },
  { label: "AI Tool", value: "Design an AI-powered tool that helps users..." }
];

const AdminAgents = () => {
  const { activeRun, isRunning, startRun, cancelRun, fetchHistory, runHistory } = useAgentRun();
  const [brief, setBrief] = useState("");
  const [activeTab, setActiveTab] = useState("new");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleStartRun = async () => {
    if (!brief.trim()) {
      toast.error("Please enter a project brief");
      return;
    }
    await startRun(brief);
    setBrief("");
    toast.success("Agents started! You can navigate away - they'll continue in the background.");
  };

  const progress = activeRun?.progress || 0;

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Agency</h1>
              <p className="text-muted-foreground text-sm">
                18 specialized agents • Runs in background
              </p>
            </div>
          </div>

          {isRunning && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{activeRun?.current_agent || "Starting..."}</p>
                <Progress value={progress} className="h-1 mt-1" />
              </div>
              <Badge className="bg-primary/20 text-primary">{progress}%</Badge>
              <Button size="sm" variant="ghost" onClick={cancelRun}>
                <StopCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/30 border border-white/10">
            <TabsTrigger value="new" className="gap-2 data-[state=active]:bg-white/10">
              <Play className="h-4 w-4" />
              New Run
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white/10">
              <History className="h-4 w-4" />
              History
              {runHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{runHistory.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2 data-[state=active]:bg-white/10">
              <Users className="h-4 w-4" />
              All Agents
            </TabsTrigger>
          </TabsList>

          {/* New Run Tab */}
          <TabsContent value="new" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Brief Input */}
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Project Brief
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {briefTemplates.map(template => (
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
                    placeholder="Describe your project in detail... What do you want to build? Who is it for? What problem does it solve?"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    className="min-h-[200px] resize-none"
                    disabled={isRunning}
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{brief.length} characters</span>
                    <Button 
                      onClick={handleStartRun}
                      disabled={isRunning || !brief.trim()}
                      className="bg-gradient-to-r from-primary to-primary/80"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Running ({progress}%)
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Agency
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Phase Overview */}
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Agency Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {phaseInfo.map((phase, i) => {
                      const PhaseIcon = phase.icon;
                      const phaseAgents = initialAgents.filter(a => a.phase === i);
                      return (
                        <div
                          key={i}
                          className={cn(
                            "p-3 rounded-lg border bg-gradient-to-r",
                            phase.color
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <PhaseIcon className="h-4 w-4" />
                              <span className="font-medium text-sm">Phase {i}</span>
                              <span className="text-sm text-muted-foreground">{phase.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {phaseAgents.length} agents
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {phaseAgents.map(agent => (
                              <Badge 
                                key={agent.id} 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover:bg-white/20"
                                onClick={() => setSelectedAgent(agent)}
                              >
                                {agent.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <AgentRunHistory />
          </TabsContent>

          {/* All Agents Tab */}
          <TabsContent value="agents" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {initialAgents.map(agent => (
                <Card 
                  key={agent.id}
                  className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedAgent(agent)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className={cn("h-12 w-12 bg-gradient-to-br", agent.color, "ring-2 ring-white/10 group-hover:ring-white/20")}>
                        <AvatarFallback className="bg-transparent text-white">
                          <agent.icon className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{agent.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Phase {agent.phase}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                      {agent.persona}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAgent(null)}
          >
            <Card 
              className="w-full max-w-lg max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className={cn("h-12 w-12 bg-gradient-to-br", selectedAgent.color)}>
                      <AvatarFallback className="bg-transparent text-white">
                        <selectedAgent.icon className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{selectedAgent.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedAgent.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" /> Persona
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {selectedAgent.persona}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Responsibilities
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedAgent.responsibilities.map((resp, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Expected Output
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {selectedAgent.output}
                  </p>
                </div>
                <Badge className="border" variant="outline">
                  Phase {selectedAgent.phase}: {selectedAgent.phaseName}
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAgents;
