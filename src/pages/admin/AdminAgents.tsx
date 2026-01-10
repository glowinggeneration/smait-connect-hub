import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Crown, Users, Target, Scale, FileText, DollarSign, 
  Palette, PenTool, Package, Server, Code, Brain,
  TestTube, Shield, Rocket, Handshake, HeadphonesIcon, TrendingUp,
  Play, Download, X, MessageSquare, Loader2, FileDown,
  ChevronDown, ChevronUp, Sparkles, Clock, CheckCircle2,
  AlertCircle, RefreshCw, Eye, Zap, Lightbulb
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const phaseIcons: Record<number, React.ElementType> = {
  0: Crown,
  1: Target,
  2: FileText,
  3: Palette,
  4: Code,
  5: TestTube,
  6: Handshake
};

const statusConfig: Record<string, { label: string; color: string; pulse: boolean; icon: React.ElementType }> = {
  idle: { label: "Ready", color: "bg-muted/50 text-muted-foreground border-muted", pulse: false, icon: Clock },
  working: { label: "Working", color: "bg-green-500/20 text-green-400 border-green-500/30", pulse: true, icon: Loader2 },
  completed: { label: "Done", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", pulse: false, icon: CheckCircle2 },
  waiting: { label: "Queued", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", pulse: true, icon: Clock },
  error: { label: "Error", color: "bg-red-500/20 text-red-400 border-red-500/30", pulse: false, icon: AlertCircle }
};

const briefTemplates = [
  { label: "Mobile App", value: "Build a mobile-first application that..." },
  { label: "SaaS Platform", value: "Create a SaaS platform for businesses to..." },
  { label: "E-commerce", value: "Develop an e-commerce solution that allows..." },
  { label: "AI Tool", value: "Design an AI-powered tool that helps users..." }
];

const AdminAgents = () => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [brief, setBrief] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [showBriefPanel, setShowBriefPanel] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Calculate overall progress
  const progress = useMemo(() => {
    const completed = agents.filter(a => a.status === "completed").length;
    return Math.round((completed / agents.length) * 100);
  }, [agents]);

  const togglePhase = (phase: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

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
    setExpandedPhases(new Set([0, 1, 2, 3, 4, 5, 6]));

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

    if (brief) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Project Brief:", margin, 110);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const briefLines = doc.splitTextToSize(brief, maxWidth);
      doc.text(briefLines, margin, 120);
    }

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

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

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
    setExpandedPhases(new Set([0, 1, 2, 3, 4, 5, 6]));
  };

  const groupedAgents = agents.reduce((acc, agent) => {
    if (!acc[agent.phase]) {
      acc[agent.phase] = { name: agent.phaseName, agents: [] };
    }
    acc[agent.phase].agents.push(agent);
    return acc;
  }, {} as Record<number, { name: string; agents: Agent[] }>);

  // Get phase status
  const getPhaseStatus = (phase: number) => {
    const phaseAgents = groupedAgents[phase]?.agents || [];
    const completed = phaseAgents.filter(a => a.status === "completed").length;
    const working = phaseAgents.some(a => a.status === "working");
    const hasError = phaseAgents.some(a => a.status === "error");
    
    if (hasError) return "error";
    if (completed === phaseAgents.length && completed > 0) return "completed";
    if (working) return "working";
    if (currentPhase === phase) return "active";
    return "idle";
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-4">
        {/* Main Agent Grid */}
        <div className="flex-1 overflow-auto">
          <div className="space-y-4 pb-6">
            {/* Header with Progress */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 -mx-4 px-4 py-4 mb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">AI Agency</h1>
                    <p className="text-sm text-muted-foreground">
                      18 specialized agents at your service
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {!showBriefPanel && (
                    <Button variant="outline" size="sm" onClick={() => setShowBriefPanel(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Brief
                    </Button>
                  )}
                  {agents.some(a => a.status === "completed") && (
                    <>
                      <Button size="sm" onClick={generatePDF} className="bg-gradient-to-r from-primary to-primary/80">
                        <FileDown className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadAllOutputs}>
                        <Download className="h-4 w-4 mr-2" />
                        Markdown
                      </Button>
                      <Button variant="ghost" size="sm" onClick={resetAgency}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {(isProcessing || progress > 0) && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Phase Timeline */}
              <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-2">
                {Object.entries(groupedAgents).map(([phase, data], index) => {
                  const status = getPhaseStatus(Number(phase));
                  const PhaseIcon = phaseIcons[Number(phase)];
                  return (
                    <div key={phase} className="flex items-center">
                      <button
                        onClick={() => togglePhase(Number(phase))}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          status === "completed" && "bg-green-500/20 text-green-400 border border-green-500/30",
                          status === "working" && "bg-primary/20 text-primary border border-primary/30 animate-pulse",
                          status === "active" && "bg-primary/10 text-primary border border-primary/20",
                          status === "error" && "bg-red-500/20 text-red-400 border border-red-500/30",
                          status === "idle" && "bg-muted/50 text-muted-foreground border border-muted"
                        )}
                      >
                        <PhaseIcon className="h-3 w-3" />
                        <span className="hidden sm:inline">{data.name}</span>
                        <span className="sm:hidden">P{phase}</span>
                        {status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                        {status === "working" && <Loader2 className="h-3 w-3 animate-spin" />}
                      </button>
                      {index < Object.entries(groupedAgents).length - 1 && (
                        <div className={cn(
                          "w-4 h-0.5 mx-1",
                          status === "completed" ? "bg-green-500/50" : "bg-muted"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orchestrator - Phase 0 */}
            <Collapsible 
              open={expandedPhases.has(0)} 
              onOpenChange={() => togglePhase(0)}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Badge className={cn(phaseColors[0], "border")}>
                      Phase 0
                    </Badge>
                    <span className="font-medium">Orchestration</span>
                    {expandedPhases.has(0) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent>
                <div className="flex justify-center mb-6">
                  {groupedAgents[0]?.agents.map((agent) => (
                    <Card 
                      key={agent.id}
                      className={cn(
                        "w-full max-w-lg cursor-pointer transition-all duration-300",
                        "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10",
                        "hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10",
                        agent.status === "working" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className={cn("h-14 w-14 bg-gradient-to-br", agent.color, "ring-2 ring-white/10")}>
                              <AvatarFallback className="bg-transparent text-white">
                                <agent.icon className="h-7 w-7" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-xl">{agent.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{agent.role}</p>
                            </div>
                          </div>
                          <Badge className={cn(
                            statusConfig[agent.status].color, 
                            "border",
                            statusConfig[agent.status].pulse && "animate-pulse"
                          )}>
                            {statusConfig[agent.status].label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{agent.persona}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent); }}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            View Details
                          </Button>
                          {agent.result && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={(e) => { e.stopPropagation(); downloadAgentOutput(agent); }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Other Phases */}
            {Object.entries(groupedAgents)
              .filter(([phase]) => Number(phase) > 0)
              .map(([phase, data]) => {
                const phaseNum = Number(phase);
                const phaseStatus = getPhaseStatus(phaseNum);
                
                return (
                  <Collapsible 
                    key={phase} 
                    open={expandedPhases.has(phaseNum)}
                    onOpenChange={() => togglePhase(phaseNum)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card transition-colors mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={cn(phaseColors[phaseNum], "border")}>
                            Phase {phase}
                          </Badge>
                          <h2 className="text-lg font-semibold text-foreground">{data.name}</h2>
                          {phaseStatus === "working" && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {phaseStatus === "completed" && (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {data.agents.filter(a => a.status === "completed").length}/{data.agents.length}
                          </span>
                          {expandedPhases.has(phaseNum) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
                        {data.agents.map((agent) => {
                          const StatusIcon = statusConfig[agent.status].icon;
                          return (
                            <Card 
                              key={agent.id}
                              className={cn(
                                "cursor-pointer transition-all duration-200 group",
                                "hover:scale-[1.02] hover:border-primary/50 hover:shadow-md",
                                agent.status === "working" && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                agent.status === "completed" && "border-green-500/30"
                              )}
                              onClick={() => setSelectedAgent(agent)}
                            >
                              <CardHeader className="pb-2 pt-4">
                                <div className="flex items-start justify-between mb-3">
                                  <Avatar className={cn("h-10 w-10 bg-gradient-to-br", agent.color, "ring-2 ring-white/10 group-hover:ring-white/20 transition-all")}>
                                    <AvatarFallback className="bg-transparent text-white">
                                      <agent.icon className="h-5 w-5" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <Badge className={cn(
                                    statusConfig[agent.status].color, 
                                    "border text-[10px] gap-1",
                                    statusConfig[agent.status].pulse && "animate-pulse"
                                  )}>
                                    <StatusIcon className={cn("h-2.5 w-2.5", agent.status === "working" && "animate-spin")} />
                                    {statusConfig[agent.status].label}
                                  </Badge>
                                </div>
                                <CardTitle className="text-sm">{agent.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">{agent.role}</p>
                              </CardHeader>
                              <CardContent className="pt-0 pb-4">
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{agent.persona}</p>
                                {agent.result && (
                                  <div className="flex gap-1.5">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="flex-1 text-[10px] h-7"
                                      onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent); }}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-[10px] h-7"
                                      onClick={(e) => { e.stopPropagation(); downloadAgentOutput(agent); }}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </div>
        </div>

        {/* Brief & Communication Panel */}
        {showBriefPanel && (
          <div className="w-full lg:w-96 flex flex-col gap-4 max-h-[calc(100vh-120px)]">
            {/* Brief Input */}
            <Card className="shrink-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Project Brief</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBriefPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Templates */}
                <div className="flex flex-wrap gap-1.5">
                  {briefTemplates.map(template => (
                    <Button
                      key={template.label}
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-6 px-2"
                      onClick={() => setBrief(template.value)}
                      disabled={isProcessing}
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {template.label}
                    </Button>
                  ))}
                </div>
                
                <div className="relative">
                  <Textarea
                    placeholder="Describe your project in detail... What do you want to build? Who is it for? What problem does it solve? What features are essential?"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    className="min-h-[120px] resize-none pr-12"
                    disabled={isProcessing}
                  />
                  <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                    {brief.length} chars
                  </span>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                  onClick={runAgency}
                  disabled={isProcessing || !brief.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing ({progress}%)
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
            <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Live Feed
                  {messages.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {messages.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-2 p-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                          Agent communication will appear here
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          Run the agency to see live updates
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const agent = agents.find(a => a.id === msg.agentId);
                        const isExpanded = expandedMessage === index;
                        
                        return (
                          <div 
                            key={index} 
                            className={cn(
                              "p-3 rounded-lg cursor-pointer transition-all",
                              msg.type === "handoff" && "bg-primary/10 border border-primary/20",
                              msg.type === "working" && "bg-muted/30 border border-muted/50",
                              msg.type === "output" && "bg-card border border-border"
                            )}
                            onClick={() => setExpandedMessage(isExpanded ? null : index)}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              {agent && (
                                <Avatar className={cn("h-5 w-5 bg-gradient-to-br", agent.color)}>
                                  <AvatarFallback className="bg-transparent text-white text-[8px]">
                                    <agent.icon className="h-2.5 w-2.5" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span className="text-xs font-medium">{msg.agentName}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className={cn(
                              "text-xs",
                              msg.type === "output" && "whitespace-pre-wrap",
                              msg.type === "handoff" && "text-primary italic",
                              !isExpanded && msg.type === "output" && "line-clamp-2"
                            )}>
                              {msg.content}
                            </p>
                            {msg.type === "output" && !isExpanded && msg.content.length > 100 && (
                              <p className="text-[10px] text-primary mt-1">Click to expand</p>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
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
              className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="shrink-0 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className={cn("h-14 w-14 bg-gradient-to-br", selectedAgent.color, "ring-2 ring-white/10")}>
                      <AvatarFallback className="bg-transparent text-white">
                        <selectedAgent.icon className="h-7 w-7" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{selectedAgent.name}</CardTitle>
                      <p className="text-muted-foreground text-sm">{selectedAgent.role}</p>
                      <Badge className={cn(phaseColors[selectedAgent.phase], "border mt-2 text-xs")}>
                        Phase {selectedAgent.phase}: {selectedAgent.phaseName}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedAgent(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 overflow-auto flex-1 py-5">
                <div>
                  <h4 className="font-medium text-foreground mb-2 text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Persona
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{selectedAgent.persona}</p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2 text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Responsibilities
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
                  <h4 className="font-medium text-foreground mb-2 text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Expected Output
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{selectedAgent.output}</p>
                </div>

                {selectedAgent.result && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Generated Output
                      </h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadAgentOutput(selectedAgent)}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="bg-card border rounded-lg p-4 max-h-60 overflow-auto">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedAgent.result}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Badge className={cn(statusConfig[selectedAgent.status].color, "border")}>
                    Status: {statusConfig[selectedAgent.status].label}
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
