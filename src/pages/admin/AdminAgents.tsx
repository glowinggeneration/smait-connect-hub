import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Crown, Users, Target, Scale, FileText, DollarSign, 
  Palette, PenTool, Package, Server, Code, Brain,
  TestTube, Shield, Rocket, Handshake, HeadphonesIcon, TrendingUp,
  ArrowRight, Play, Download, X, MessageSquare, Loader2, FileDown
} from "lucide-react";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

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
  {
    id: "managing-partner",
    name: "Atlas",
    role: "Managing Partner",
    persona: "The Orchestrator - Controls the entire agency with absolute authority",
    phase: 0,
    phaseName: "Orchestration",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    responsibilities: ["Receives client requests", "Breaks jobs into phases", "Assigns work to agents", "Enforces quality gates", "Resolves conflicts"],
    output: "Phase assignments & approvals",
    status: "idle"
  },
  {
    id: "client-discovery",
    name: "Echo",
    role: "Client Discovery Agent",
    persona: "Account Manager - Interviews clients and extracts project requirements",
    phase: 1,
    phaseName: "Client & Strategy",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
    responsibilities: ["Interviews the client", "Extracts goals & constraints", "Clarifies budget & timelines"],
    output: "Approved Project Brief",
    status: "idle"
  },
  {
    id: "strategy-feasibility",
    name: "Sage",
    role: "Strategy & Feasibility Agent",
    persona: "Strategy Consultant - Tests viability and recommends approach",
    phase: 1,
    phaseName: "Client & Strategy",
    icon: Target,
    color: "from-indigo-500 to-purple-600",
    responsibilities: ["Tests idea viability", "Identifies risks", "Suggests best approach"],
    output: "Go/No-Go recommendation",
    status: "idle"
  },
  {
    id: "legal-compliance",
    name: "Justice",
    role: "Legal & Compliance Agent",
    persona: "Legal Counsel - Drafts contracts and ensures compliance",
    phase: 2,
    phaseName: "Legal & Commercial",
    icon: Scale,
    color: "from-slate-500 to-gray-600",
    responsibilities: ["Drafts contracts & NDAs", "Defines IP ownership", "Flags legal red zones"],
    output: "Legal pack ready for approval",
    status: "idle"
  },
  {
    id: "proposal-scope",
    name: "Blueprint",
    role: "Proposal & Scope Agent",
    persona: "Commercial Strategist - Converts strategy into deliverables",
    phase: 2,
    phaseName: "Legal & Commercial",
    icon: FileText,
    color: "from-emerald-500 to-teal-600",
    responsibilities: ["Converts strategy into scope", "Defines deliverables", "Sets milestones"],
    output: "Final proposal document",
    status: "idle"
  },
  {
    id: "finance-commercial",
    name: "Ledger",
    role: "Finance & Commercial Agent",
    persona: "CFO - Structures pricing and controls commercial risk",
    phase: 2,
    phaseName: "Legal & Commercial",
    icon: DollarSign,
    color: "from-green-500 to-emerald-600",
    responsibilities: ["Structures pricing", "Breaks cost by phase", "Controls commercial risk"],
    output: "Commercial approval",
    status: "idle"
  },
  {
    id: "brand-strategy",
    name: "Muse",
    role: "Brand Strategy Agent",
    persona: "Brand Director - Defines voice, tone, and visual direction",
    phase: 3,
    phaseName: "Brand & Design",
    icon: Palette,
    color: "from-pink-500 to-rose-600",
    responsibilities: ["Defines brand voice", "Establishes visual direction", "Sets UX principles"],
    output: "Brand & UX strategy",
    status: "idle"
  },
  {
    id: "design-production",
    name: "Canvas",
    role: "Design Production Agent",
    persona: "Creative Studio - Produces UI/UX designs and visual assets",
    phase: 3,
    phaseName: "Brand & Design",
    icon: PenTool,
    color: "from-fuchsia-500 to-pink-600",
    responsibilities: ["Produces UI/UX designs", "Creates visual assets", "Iterates on feedback"],
    output: "Design system & mockups",
    status: "idle"
  },
  {
    id: "product-management",
    name: "Navigator",
    role: "Product Management Agent",
    persona: "Product Owner - Converts designs into features and user stories",
    phase: 4,
    phaseName: "Product & Engineering",
    icon: Package,
    color: "from-violet-500 to-purple-600",
    responsibilities: ["Converts designs to features", "Writes user stories", "Prioritises backlog"],
    output: "Product requirements & roadmap",
    status: "idle"
  },
  {
    id: "technical-architecture",
    name: "Architect",
    role: "Technical Architecture Agent",
    persona: "Technical Lead - Designs system architecture and data flows",
    phase: 4,
    phaseName: "Product & Engineering",
    icon: Server,
    color: "from-cyan-500 to-blue-600",
    responsibilities: ["Designs system architecture", "Defines data flows", "Sets security standards"],
    output: "Technical blueprint",
    status: "idle"
  },
  {
    id: "build-agent",
    name: "Forge",
    role: "Build Agent",
    persona: "Software Engineer - Implements the product and builds interfaces",
    phase: 4,
    phaseName: "Product & Engineering",
    icon: Code,
    color: "from-orange-500 to-red-600",
    responsibilities: ["Implements the product", "Builds logic & interfaces", "Integrates AI functionality"],
    output: "Working application",
    status: "idle"
  },
  {
    id: "ai-systems",
    name: "Synapse",
    role: "AI Systems Agent",
    persona: "AI Engineer - Designs AI behaviour and agent logic",
    phase: 4,
    phaseName: "Product & Engineering",
    icon: Brain,
    color: "from-purple-500 to-indigo-600",
    responsibilities: ["Designs AI behaviour", "Writes prompts & rules", "Builds agent logic"],
    output: "AI logic & behaviour layer",
    status: "idle"
  },
  {
    id: "quality-assurance",
    name: "Inspector",
    role: "Quality Assurance Agent",
    persona: "QA Lead - Tests functionality and validates UX flows",
    phase: 5,
    phaseName: "Quality, Risk & Release",
    icon: TestTube,
    color: "from-yellow-500 to-amber-600",
    responsibilities: ["Tests functionality", "Checks edge cases", "Validates UX flows"],
    output: "QA approval or rejection",
    status: "idle"
  },
  {
    id: "security-risk",
    name: "Sentinel",
    role: "Security & Risk Agent",
    persona: "Risk Officer - Reviews data handling and flags vulnerabilities",
    phase: 5,
    phaseName: "Quality, Risk & Release",
    icon: Shield,
    color: "from-red-500 to-rose-600",
    responsibilities: ["Reviews data handling", "Checks permissions", "Flags vulnerabilities"],
    output: "Security clearance",
    status: "idle"
  },
  {
    id: "release-deployment",
    name: "Launch",
    role: "Release & Deployment Agent",
    persona: "Release Manager - Prepares and executes deployment",
    phase: 5,
    phaseName: "Quality, Risk & Release",
    icon: Rocket,
    color: "from-sky-500 to-blue-600",
    responsibilities: ["Prepares launch", "Final checks", "Version control"],
    output: "Live product",
    status: "idle"
  },
  {
    id: "client-handover",
    name: "Bridge",
    role: "Client Handover Agent",
    persona: "Client Success - Creates documentation and onboards client",
    phase: 6,
    phaseName: "Handover, Support & Growth",
    icon: Handshake,
    color: "from-teal-500 to-cyan-600",
    responsibilities: ["Creates manuals", "Prepares onboarding", "Formal handover"],
    output: "Client-ready documentation",
    status: "idle"
  },
  {
    id: "support-maintenance",
    name: "Guardian",
    role: "Support & Maintenance Agent",
    persona: "Support Desk - Handles issues and monitors performance",
    phase: 6,
    phaseName: "Handover, Support & Growth",
    icon: HeadphonesIcon,
    color: "from-lime-500 to-green-600",
    responsibilities: ["Handles issues", "Logs bugs", "Monitors performance"],
    output: "Ongoing stability",
    status: "idle"
  },
  {
    id: "growth-optimisation",
    name: "Catalyst",
    role: "Growth & Optimisation Agent",
    persona: "Strategy & Scale - Analyses usage and recommends improvements",
    phase: 6,
    phaseName: "Handover, Support & Growth",
    icon: TrendingUp,
    color: "from-amber-500 to-yellow-600",
    responsibilities: ["Analyses usage", "Recommends improvements", "Identifies upsell opportunities"],
    output: "Continuous improvement roadmap",
    status: "idle"
  }
];

const phaseColors: Record<number, string> = {
  0: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  1: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  2: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  3: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  4: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  5: "bg-red-500/20 text-red-400 border-red-500/30",
  6: "bg-teal-500/20 text-teal-400 border-teal-500/30"
};

const statusConfig: Record<string, { label: string; color: string; pulse: boolean }> = {
  idle: { label: "Idle", color: "bg-muted text-muted-foreground", pulse: false },
  working: { label: "Working", color: "bg-green-500/20 text-green-400", pulse: true },
  completed: { label: "Completed", color: "bg-blue-500/20 text-blue-400", pulse: false },
  waiting: { label: "Waiting", color: "bg-yellow-500/20 text-yellow-400", pulse: true },
  error: { label: "Error", color: "bg-red-500/20 text-red-400", pulse: false }
};

const AdminAgents = () => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [brief, setBrief] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [showBriefPanel, setShowBriefPanel] = useState(true);

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const updateAgentStatus = (agentId: string, status: Agent["status"], result?: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status, result: result || a.result } : a
    ));
  };

  const processAgent = async (agent: Agent, briefText: string, previousOutputs: string): Promise<string> => {
    updateAgentStatus(agent.id, "working");
    addMessage({
      agentId: agent.id,
      agentName: agent.name,
      content: `Starting analysis...`,
      timestamp: new Date().toISOString(),
      type: "working"
    });

    try {
      const { data, error } = await supabase.functions.invoke('agent-orchestrator', {
        body: { 
          brief: briefText, 
          agentId: agent.id,
          previousOutputs 
        }
      });

      if (error) throw error;

      const output = data.output || "No output generated";
      updateAgentStatus(agent.id, "completed", output);
      
      addMessage({
        agentId: agent.id,
        agentName: agent.name,
        content: output,
        timestamp: new Date().toISOString(),
        type: "output"
      });

      return output;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateAgentStatus(agent.id, "error");
      addMessage({
        agentId: agent.id,
        agentName: agent.name,
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        type: "output"
      });
      throw error;
    }
  };

  const runAgency = useCallback(async () => {
    if (!brief.trim()) {
      toast.error("Please enter a project brief");
      return;
    }

    setIsProcessing(true);
    setMessages([]);
    setAgents(initialAgents);
    setShowBriefPanel(false);

    const agentOrder = [
      "managing-partner",
      "client-discovery",
      "strategy-feasibility",
      "legal-compliance",
      "proposal-scope",
      "finance-commercial",
      "brand-strategy",
      "design-production",
      "product-management",
      "technical-architecture",
      "build-agent",
      "ai-systems",
      "quality-assurance",
      "security-risk",
      "release-deployment",
      "client-handover",
      "support-maintenance",
      "growth-optimisation"
    ];

    let previousOutputs = "";
    
    try {
      for (const agentId of agentOrder) {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) continue;

        setCurrentPhase(agent.phase);
        
        // Set waiting status for upcoming agents in this phase
        agents.filter(a => a.phase === agent.phase && a.id !== agentId && a.status === "idle")
          .forEach(a => updateAgentStatus(a.id, "waiting"));

        const output = await processAgent(agent, brief, previousOutputs);
        previousOutputs += `\n\n### ${agent.name} (${agent.role}) Output:\n${output}`;

        // Handoff message
        const nextIndex = agentOrder.indexOf(agentId) + 1;
        if (nextIndex < agentOrder.length) {
          const nextAgent = agents.find(a => a.id === agentOrder[nextIndex]);
          if (nextAgent) {
            addMessage({
              agentId: agent.id,
              agentName: agent.name,
              content: `Handing off to ${nextAgent.name} (${nextAgent.role})...`,
              timestamp: new Date().toISOString(),
              type: "handoff"
            });
          }
        }
      }

      toast.success("All agents have completed their work!");
    } catch (error) {
      toast.error("An error occurred during processing");
    } finally {
      setIsProcessing(false);
    }
  }, [brief, agents]);

  const generatePDF = () => {
    const completedAgents = agents.filter(a => a.status === "completed" && a.result);
    if (completedAgents.length === 0) {
      toast.error("No completed outputs to download");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Helper to add new page if needed
    const checkNewPage = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Title page
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("AI Agency Project Report", pageWidth / 2, 60, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 75, { align: "center" });
    doc.text(`Total Agents: ${completedAgents.length}`, pageWidth / 2, 85, { align: "center" });

    // Project Brief
    if (brief) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Project Brief:", margin, 110);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const briefLines = doc.splitTextToSize(brief, maxWidth);
      doc.text(briefLines, margin, 120);
    }

    // Start agent outputs on new page
    doc.addPage();
    yPos = margin;

    // Table of Contents
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Table of Contents", margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    completedAgents.forEach((agent, index) => {
      checkNewPage(8);
      doc.text(`${index + 1}. ${agent.name} - ${agent.role} (Phase ${agent.phase})`, margin, yPos);
      yPos += 8;
    });

    // Agent outputs
    completedAgents.forEach((agent, index) => {
      doc.addPage();
      yPos = margin;

      // Agent header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${agent.name}`, margin, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(agent.role, margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.text(`Phase ${agent.phase}: ${agent.phaseName}`, margin, yPos);
      yPos += 5;

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Persona
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Persona:", margin, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const personaLines = doc.splitTextToSize(agent.persona, maxWidth);
      personaLines.forEach((line: string) => {
        checkNewPage(6);
        doc.text(line, margin, yPos);
        yPos += 6;
      });
      yPos += 5;

      // Responsibilities
      checkNewPage(20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Responsibilities:", margin, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      agent.responsibilities.forEach(resp => {
        checkNewPage(6);
        doc.text(`• ${resp}`, margin + 5, yPos);
        yPos += 6;
      });
      yPos += 5;

      // Output
      checkNewPage(20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Generated Output:", margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      if (agent.result) {
        const outputLines = doc.splitTextToSize(agent.result, maxWidth);
        outputLines.forEach((line: string) => {
          checkNewPage(5);
          doc.text(line, margin, yPos);
          yPos += 5;
        });
      }
    });

    // Save the PDF
    doc.save(`ai-agency-report-${Date.now()}.pdf`);
    toast.success("Comprehensive PDF report downloaded!");
  };

  const downloadAllOutputs = () => {
    const completedAgents = agents.filter(a => a.status === "completed" && a.result);
    if (completedAgents.length === 0) {
      toast.error("No completed outputs to download");
      return;
    }

    let content = `# AI Agency Project Outputs\n\nGenerated: ${new Date().toLocaleString()}\n\n---\n\n`;
    
    completedAgents.forEach(agent => {
      content += `## ${agent.name} - ${agent.role}\n\n`;
      content += `**Phase ${agent.phase}:** ${agent.phaseName}\n\n`;
      content += agent.result + "\n\n---\n\n";
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agency-outputs-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded all outputs");
  };

  const downloadAgentOutput = (agent: Agent) => {
    if (!agent.result) {
      toast.error("No output to download");
      return;
    }

    const content = `# ${agent.name} - ${agent.role}\n\n**Phase ${agent.phase}:** ${agent.phaseName}\n\nGenerated: ${new Date().toLocaleString()}\n\n---\n\n${agent.result}`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.id}-output-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${agent.name}'s output`);
  };

  const resetAgency = () => {
    setAgents(initialAgents);
    setMessages([]);
    setCurrentPhase(-1);
    setShowBriefPanel(true);
    setBrief("");
  };

  const groupedAgents = agents.reduce((acc, agent) => {
    if (!acc[agent.phase]) {
      acc[agent.phase] = { name: agent.phaseName, agents: [] };
    }
    acc[agent.phase].agents.push(agent);
    return acc;
  }, {} as Record<number, { name: string; agents: Agent[] }>);

  return (
    <DashboardLayout userType="admin">
      <div className="flex h-[calc(100vh-120px)] gap-4">
        {/* Main Agent Grid */}
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Agency Agents</h1>
                <p className="text-muted-foreground mt-1">
                  Your digital consulting firm with institutional memory
                </p>
              </div>
              <div className="flex gap-2">
                {!showBriefPanel && (
                  <Button variant="outline" onClick={() => setShowBriefPanel(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Brief Panel
                  </Button>
                )}
                {agents.some(a => a.status === "completed") && (
                  <>
                    <Button variant="default" onClick={generatePDF}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download PDF Report
                    </Button>
                    <Button variant="outline" onClick={downloadAllOutputs}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Markdown
                    </Button>
                    <Button variant="outline" onClick={resetAgency}>
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Orchestrator - Phase 0 */}
            <div className="flex justify-center">
              {groupedAgents[0]?.agents.map((agent) => (
                <Card 
                  key={agent.id}
                  className={`w-full max-w-md cursor-pointer transition-all hover:scale-[1.02] border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 ${
                    agent.status === "working" ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background" : ""
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-12 w-12 bg-gradient-to-br ${agent.color}`}>
                          <AvatarFallback className="bg-transparent text-white">
                            <agent.icon className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{agent.role}</p>
                        </div>
                      </div>
                      <Badge className={`${statusConfig[agent.status].color} ${statusConfig[agent.status].pulse ? "animate-pulse" : ""}`}>
                        {statusConfig[agent.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{agent.persona}</p>
                    {agent.result && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => { e.stopPropagation(); downloadAgentOutput(agent); }}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Download Output
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-8 w-8 text-muted-foreground rotate-90" />
            </div>

            {/* Other Phases */}
            {Object.entries(groupedAgents)
              .filter(([phase]) => Number(phase) > 0)
              .map(([phase, data]) => (
                <div key={phase} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className={`${phaseColors[Number(phase)]} border`}>
                      Phase {phase}
                    </Badge>
                    <h2 className="text-xl font-semibold text-foreground">{data.name}</h2>
                    {currentPhase === Number(phase) && isProcessing && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {data.agents.map((agent) => (
                      <Card 
                        key={agent.id}
                        className={`cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50 ${
                          agent.status === "working" ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background" : ""
                        }`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <Avatar className={`h-10 w-10 bg-gradient-to-br ${agent.color}`}>
                              <AvatarFallback className="bg-transparent text-white">
                                <agent.icon className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <Badge className={`${statusConfig[agent.status].color} ${statusConfig[agent.status].pulse ? "animate-pulse" : ""} text-xs`}>
                              {statusConfig[agent.status].label}
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{agent.role}</p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{agent.persona}</p>
                          {agent.result && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-xs h-7"
                              onClick={(e) => { e.stopPropagation(); downloadAgentOutput(agent); }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {Number(phase) < 6 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Brief & Communication Panel */}
        {showBriefPanel && (
          <div className="w-96 flex flex-col gap-4">
            {/* Brief Input */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Project Brief</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBriefPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe your project... What do you want to build? Who is it for? What problem does it solve?"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  className="min-h-[150px] resize-none"
                  disabled={isProcessing}
                />
                <Button 
                  className="w-full" 
                  onClick={runAgency}
                  disabled={isProcessing || !brief.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Agency
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Communication Feed */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Agent Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-3 p-4">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Agent communication will appear here when you run the agency
                      </p>
                    ) : (
                      messages.map((msg, index) => {
                        const agent = agents.find(a => a.id === msg.agentId);
                        return (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg ${
                              msg.type === "handoff" 
                                ? "bg-primary/10 border border-primary/30" 
                                : msg.type === "working"
                                ? "bg-muted/50"
                                : "bg-card border"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {agent && (
                                <Avatar className={`h-6 w-6 bg-gradient-to-br ${agent.color}`}>
                                  <AvatarFallback className="bg-transparent text-white text-xs">
                                    <agent.icon className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span className="text-sm font-medium">{msg.agentName}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className={`text-xs ${msg.type === "output" ? "whitespace-pre-wrap" : ""} ${
                              msg.type === "handoff" ? "text-primary italic" : "text-muted-foreground"
                            } line-clamp-3`}>
                              {msg.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAgent(null)}
          >
            <Card 
              className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className={`h-16 w-16 bg-gradient-to-br ${selectedAgent.color}`}>
                      <AvatarFallback className="bg-transparent text-white">
                        <selectedAgent.icon className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{selectedAgent.name}</CardTitle>
                      <p className="text-muted-foreground">{selectedAgent.role}</p>
                      <Badge className={`${phaseColors[selectedAgent.phase]} border mt-2`}>
                        Phase {selectedAgent.phase}: {selectedAgent.phaseName}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 overflow-auto flex-1">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Persona</h4>
                  <p className="text-sm text-muted-foreground">{selectedAgent.persona}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-2">Responsibilities</h4>
                  <ul className="space-y-1">
                    {selectedAgent.responsibilities.map((resp, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-1">Expected Output</h4>
                  <p className="text-sm text-muted-foreground">{selectedAgent.output}</p>
                </div>

                {selectedAgent.result && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">Generated Output</h4>
                      <Button size="sm" variant="outline" onClick={() => downloadAgentOutput(selectedAgent)}>
                        <Download className="h-3 w-3 mr-2" />
                        Download
                      </Button>
                    </div>
                    <ScrollArea className="h-64 border rounded-lg p-3">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {selectedAgent.result}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  <Badge className={`${statusConfig[selectedAgent.status].color} ${statusConfig[selectedAgent.status].pulse ? "animate-pulse" : ""}`}>
                    {statusConfig[selectedAgent.status].label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAgents;
