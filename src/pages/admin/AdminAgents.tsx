import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Crown, Users, Target, Scale, FileText, DollarSign, 
  Palette, PenTool, Package, Server, Code, Brain,
  TestTube, Shield, Rocket, Handshake, HeadphonesIcon, TrendingUp,
  ArrowRight
} from "lucide-react";
import { useState } from "react";

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
  status: "idle" | "working" | "completed" | "waiting";
}

const agents: Agent[] = [
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
    status: "working"
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
    status: "completed"
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
    status: "working"
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
  waiting: { label: "Waiting", color: "bg-yellow-500/20 text-yellow-400", pulse: true }
};

const AdminAgents = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const groupedAgents = agents.reduce((acc, agent) => {
    if (!acc[agent.phase]) {
      acc[agent.phase] = { name: agent.phaseName, agents: [] };
    }
    acc[agent.phase].agents.push(agent);
    return acc;
  }, {} as Record<number, { name: string; agents: Agent[] }>);

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Agency Agents</h1>
          <p className="text-muted-foreground mt-1">
            Your digital consulting firm with institutional memory and process discipline
          </p>
        </div>

        {/* Orchestrator - Phase 0 */}
        <div className="flex justify-center">
          {groupedAgents[0]?.agents.map((agent) => (
            <Card 
              key={agent.id}
              className="w-full max-w-md cursor-pointer transition-all hover:scale-[1.02] border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10"
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
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Output:</span> {agent.output}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Flow Arrow */}
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.agents.map((agent) => (
                  <Card 
                    key={agent.id}
                    className="cursor-pointer transition-all hover:scale-[1.02] hover:border-primary/50"
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
                      <p className="text-xs text-muted-foreground line-clamp-2">{agent.persona}</p>
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

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAgent(null)}
          >
            <Card 
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
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
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <h4 className="font-medium text-foreground mb-1">Output</h4>
                  <p className="text-sm text-muted-foreground">{selectedAgent.output}</p>
                </div>

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

