import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgentOutput {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_role: string;
  phase: number;
  phase_name: string;
  output: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

interface AgentRun {
  id: string;
  brief: string;
  status: string;
  progress: number;
  current_agent: string | null;
  created_at: string;
  completed_at: string | null;
  total_agents: number;
  completed_agents: number;
  outputs?: AgentOutput[];
}

interface AgentRunContextType {
  activeRun: AgentRun | null;
  runHistory: AgentRun[];
  isRunning: boolean;
  startRun: (brief: string) => Promise<string | null>;
  cancelRun: () => void;
  fetchHistory: () => Promise<void>;
  getRunOutputs: (runId: string) => Promise<AgentOutput[]>;
}

const AgentRunContext = createContext<AgentRunContextType | undefined>(undefined);

const agentOrder = [
  { id: "managing-partner", name: "Atlas", role: "Managing Partner", phase: 0, phaseName: "Orchestration" },
  { id: "client-discovery", name: "Echo", role: "Client Discovery Agent", phase: 1, phaseName: "Client & Strategy" },
  { id: "strategy-feasibility", name: "Sage", role: "Strategy & Feasibility Agent", phase: 1, phaseName: "Client & Strategy" },
  { id: "legal-compliance", name: "Justice", role: "Legal & Compliance Agent", phase: 2, phaseName: "Legal & Commercial" },
  { id: "proposal-scope", name: "Blueprint", role: "Proposal & Scope Agent", phase: 2, phaseName: "Legal & Commercial" },
  { id: "finance-commercial", name: "Ledger", role: "Finance & Commercial Agent", phase: 2, phaseName: "Legal & Commercial" },
  { id: "brand-strategy", name: "Muse", role: "Brand Strategy Agent", phase: 3, phaseName: "Brand & Design" },
  { id: "design-production", name: "Canvas", role: "Design Production Agent", phase: 3, phaseName: "Brand & Design" },
  { id: "product-management", name: "Navigator", role: "Product Management Agent", phase: 4, phaseName: "Product & Engineering" },
  { id: "technical-architecture", name: "Architect", role: "Technical Architecture Agent", phase: 4, phaseName: "Product & Engineering" },
  { id: "build-agent", name: "Forge", role: "Build Agent", phase: 4, phaseName: "Product & Engineering" },
  { id: "ai-systems", name: "Synapse", role: "AI Systems Agent", phase: 4, phaseName: "Product & Engineering" },
  { id: "quality-assurance", name: "Inspector", role: "Quality Assurance Agent", phase: 5, phaseName: "Quality, Risk & Release" },
  { id: "security-risk", name: "Sentinel", role: "Security & Risk Agent", phase: 5, phaseName: "Quality, Risk & Release" },
  { id: "release-deployment", name: "Launch", role: "Release & Deployment Agent", phase: 5, phaseName: "Quality, Risk & Release" },
  { id: "client-handover", name: "Bridge", role: "Client Handover Agent", phase: 6, phaseName: "Handover, Support & Growth" },
  { id: "support-maintenance", name: "Guardian", role: "Support & Maintenance Agent", phase: 6, phaseName: "Handover, Support & Growth" },
  { id: "growth-optimisation", name: "Catalyst", role: "Growth & Optimisation Agent", phase: 6, phaseName: "Handover, Support & Growth" },
];

export const AgentRunProvider = ({ children }: { children: ReactNode }) => {
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [runHistory, setRunHistory] = useState<AgentRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  // Subscribe to realtime updates for active run
  useEffect(() => {
    if (!activeRun?.id) return;

    const channel = supabase
      .channel(`agent-run-${activeRun.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_runs", filter: `id=eq.${activeRun.id}` },
        (payload) => {
          if (payload.new) {
            setActiveRun(payload.new as AgentRun);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRun?.id]);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("agent_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setRunHistory(data);
      // Check if there's an active run
      const running = data.find((r) => r.status === "running");
      if (running) {
        setActiveRun(running);
        setIsRunning(true);
      }
    }
  }, []);

  const getRunOutputs = useCallback(async (runId: string): Promise<AgentOutput[]> => {
    const { data, error } = await supabase
      .from("agent_outputs")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching outputs:", error);
      return [];
    }
    return data || [];
  }, []);

  const processAgent = async (
    runId: string,
    agent: typeof agentOrder[0],
    brief: string,
    previousOutputs: string
  ): Promise<string> => {
    // Update agent status to working
    await supabase
      .from("agent_outputs")
      .update({ status: "working", started_at: new Date().toISOString() })
      .eq("run_id", runId)
      .eq("agent_id", agent.id);

    // Update run current agent
    await supabase
      .from("agent_runs")
      .update({ current_agent: agent.name })
      .eq("id", runId);

    try {
      const { data, error } = await supabase.functions.invoke("agent-orchestrator", {
        body: { brief, agentId: agent.id, previousOutputs },
      });

      if (error) throw error;

      const output = data.output || "No output generated";

      // Update agent output
      await supabase
        .from("agent_outputs")
        .update({
          output,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("run_id", runId)
        .eq("agent_id", agent.id);

      return output;
    } catch (error) {
      await supabase
        .from("agent_outputs")
        .update({ status: "error", completed_at: new Date().toISOString() })
        .eq("run_id", runId)
        .eq("agent_id", agent.id);
      throw error;
    }
  };

  const runAgentsInBackground = async (runId: string, brief: string) => {
    let previousOutputs = "";
    let completedCount = 0;

    for (const agent of agentOrder) {
      // Check if cancelled
      if (cancelRequested) {
        await supabase
          .from("agent_runs")
          .update({ status: "cancelled", completed_at: new Date().toISOString() })
          .eq("id", runId);
        setCancelRequested(false);
        setIsRunning(false);
        setActiveRun(null);
        toast.info("Agent run cancelled");
        return;
      }

      try {
        const output = await processAgent(runId, agent, brief, previousOutputs);
        previousOutputs += `\n\n### ${agent.name} (${agent.role}) Output:\n${output}`;
        completedCount++;

        // Update progress
        const progress = Math.round((completedCount / agentOrder.length) * 100);
        await supabase
          .from("agent_runs")
          .update({ progress, completed_agents: completedCount })
          .eq("id", runId);

        // Update local state
        setActiveRun((prev) =>
          prev ? { ...prev, progress, completed_agents: completedCount } : prev
        );
      } catch (error) {
        console.error(`Error processing ${agent.name}:`, error);
        await supabase
          .from("agent_runs")
          .update({ status: "error", completed_at: new Date().toISOString() })
          .eq("id", runId);
        setIsRunning(false);
        toast.error("Agent run failed");
        return;
      }
    }

    // Mark as completed
    await supabase
      .from("agent_runs")
      .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        current_agent: null,
      })
      .eq("id", runId);

    setIsRunning(false);
    toast.success("All agents completed!");
    fetchHistory();
  };

  const startRun = useCallback(async (brief: string): Promise<string | null> => {
    if (isRunning) {
      toast.error("An agent run is already in progress");
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return null;
    }

    // Create run record
    const { data: run, error: runError } = await supabase
      .from("agent_runs")
      .insert({ brief, created_by: user.id, status: "running" })
      .select()
      .single();

    if (runError || !run) {
      toast.error("Failed to start agent run");
      return null;
    }

    // Create agent output records
    const outputs = agentOrder.map((agent) => ({
      run_id: run.id,
      agent_id: agent.id,
      agent_name: agent.name,
      agent_role: agent.role,
      phase: agent.phase,
      phase_name: agent.phaseName,
      status: "pending",
    }));

    await supabase.from("agent_outputs").insert(outputs);

    setActiveRun(run);
    setIsRunning(true);
    setCancelRequested(false);

    // Start background processing
    runAgentsInBackground(run.id, brief);

    return run.id;
  }, [isRunning]);

  const cancelRun = useCallback(() => {
    setCancelRequested(true);
  }, []);

  return (
    <AgentRunContext.Provider
      value={{
        activeRun,
        runHistory,
        isRunning,
        startRun,
        cancelRun,
        fetchHistory,
        getRunOutputs,
      }}
    >
      {children}
    </AgentRunContext.Provider>
  );
};

export const useAgentRun = () => {
  const context = useContext(AgentRunContext);
  if (!context) {
    throw new Error("useAgentRun must be used within an AgentRunProvider");
  }
  return context;
};
