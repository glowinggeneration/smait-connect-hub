import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemSignal {
  id: string;
  type: "risk" | "opportunity" | "escalation" | "insight" | "decision";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  source: string;
  sourceId?: string;
  createdAt: string;
  acknowledged: boolean;
  action?: {
    label: string;
    type: "approve" | "reject" | "review" | "defer";
  };
}

interface ExecutionMetrics {
  activeInitiatives: number;
  pendingAssignments: number;
  overdueItems: number;
  atRiskInitiatives: number;
  networkExposure: number;
  operatorLoad: number;
}

interface IntelligenceContextType {
  signals: SystemSignal[];
  metrics: ExecutionMetrics;
  isMonitoring: boolean;
  acknowledgeSignal: (signalId: string) => void;
  actOnSignal: (signalId: string, action: string) => void;
  refreshIntelligence: () => Promise<void>;
  getDecisionBriefs: () => SystemSignal[];
  getActiveRisks: () => SystemSignal[];
}

const IntelligenceContext = createContext<IntelligenceContextType | undefined>(undefined);

export const IntelligenceProvider = ({ children }: { children: ReactNode }) => {
  const [signals, setSignals] = useState<SystemSignal[]>([]);
  const [metrics, setMetrics] = useState<ExecutionMetrics>({
    activeInitiatives: 0,
    pendingAssignments: 0,
    overdueItems: 0,
    atRiskInitiatives: 0,
    networkExposure: 0,
    operatorLoad: 0,
  });
  const [isMonitoring, setIsMonitoring] = useState(true);

  const analyzeSystemState = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all relevant data for analysis
      const [
        { data: projects },
        { data: tasks },
        { data: leads },
        { data: briefs },
      ] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("tasks").select("*"),
        supabase.from("leads").select("*"),
        supabase.from("project_briefs").select("*"),
      ]);

      const now = new Date();
      const newSignals: SystemSignal[] = [];

      // Analyze projects for risks
      const activeProjects = projects?.filter(p => p.status === "in-progress") || [];
      const overdueProjects = activeProjects.filter(p =>
        p.due_date && new Date(p.due_date) < now
      );

      overdueProjects.forEach(p => {
        newSignals.push({
          id: `risk-project-${p.id}`,
          type: "risk",
          severity: "high",
          title: "Initiative at Risk",
          description: `"${p.name}" has exceeded its deadline. Current progress: ${p.progress}%`,
          source: "Initiative",
          sourceId: p.id,
          createdAt: new Date().toISOString(),
          acknowledged: false,
          action: { label: "Review Timeline", type: "review" },
        });
      });

      // Analyze tasks for bottlenecks
      const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
      const overdueTasks = pendingTasks.filter(t =>
        t.due_date && new Date(t.due_date) < now
      );

      if (overdueTasks.length > 3) {
        newSignals.push({
          id: `bottleneck-tasks-${Date.now()}`,
          type: "escalation",
          severity: "medium",
          title: "Assignment Bottleneck Detected",
          description: `${overdueTasks.length} assignments are past due. Consider reassigning or adjusting priorities.`,
          source: "Assignments",
          createdAt: new Date().toISOString(),
          acknowledged: false,
          action: { label: "Reprioritize", type: "review" },
        });
      }

      // Analyze leads for opportunities
      const hotLeads = leads?.filter(l => l.stage === "qualified") || [];
      if (hotLeads.length > 0) {
        newSignals.push({
          id: `opportunity-leads-${Date.now()}`,
          type: "opportunity",
          severity: "low",
          title: "Qualified Leads Awaiting Action",
          description: `${hotLeads.length} qualified leads ready for proposal. Consider converting to initiatives.`,
          source: "Network",
          createdAt: new Date().toISOString(),
          acknowledged: false,
          action: { label: "Convert", type: "approve" },
        });
      }

      // Analyze briefs for decisions needed
      const pendingBriefs = briefs?.filter(b => b.status === "pending") || [];
      pendingBriefs.forEach(b => {
        newSignals.push({
          id: `decision-brief-${b.id}`,
          type: "decision",
          severity: "medium",
          title: "Brief Requires Review",
          description: `"${b.title}" submitted and awaiting your decision.`,
          source: "Briefs",
          sourceId: b.id,
          createdAt: b.created_at,
          acknowledged: false,
          action: { label: "Approve", type: "approve" },
        });
      });

      // Calculate metrics
      setMetrics({
        activeInitiatives: activeProjects.length,
        pendingAssignments: pendingTasks.length,
        overdueItems: overdueProjects.length + overdueTasks.length,
        atRiskInitiatives: overdueProjects.length,
        networkExposure: leads?.length || 0,
        operatorLoad: Math.round((activeProjects.length + pendingTasks.length) / 10 * 100),
      });

      setSignals(prev => {
        // Merge new signals, keeping acknowledged state
        const acknowledged = new Set(prev.filter(s => s.acknowledged).map(s => s.id));
        return newSignals.map(s => ({
          ...s,
          acknowledged: acknowledged.has(s.id),
        }));
      });

    } catch (error) {
      console.error("Intelligence analysis error:", error);
    }
  }, []);

  // Passive monitoring - runs on mount and periodically
  useEffect(() => {
    analyzeSystemState();
    
    // Refresh every 5 minutes for passive monitoring
    const interval = setInterval(analyzeSystemState, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [analyzeSystemState]);

  const acknowledgeSignal = useCallback((signalId: string) => {
    setSignals(prev => 
      prev.map(s => s.id === signalId ? { ...s, acknowledged: true } : s)
    );
  }, []);

  const actOnSignal = useCallback((signalId: string, action: string) => {
    // Handle action based on type
    console.log(`Acting on signal ${signalId} with action ${action}`);
    acknowledgeSignal(signalId);
  }, [acknowledgeSignal]);

  const refreshIntelligence = useCallback(async () => {
    await analyzeSystemState();
  }, [analyzeSystemState]);

  const getDecisionBriefs = useCallback(() => {
    return signals.filter(s => s.type === "decision" && !s.acknowledged);
  }, [signals]);

  const getActiveRisks = useCallback(() => {
    return signals.filter(s => 
      (s.type === "risk" || s.type === "escalation") && !s.acknowledged
    );
  }, [signals]);

  return (
    <IntelligenceContext.Provider
      value={{
        signals,
        metrics,
        isMonitoring,
        acknowledgeSignal,
        actOnSignal,
        refreshIntelligence,
        getDecisionBriefs,
        getActiveRisks,
      }}
    >
      {children}
    </IntelligenceContext.Provider>
  );
};

// Default fallback for when context is not available
const defaultContext: IntelligenceContextType = {
  signals: [],
  metrics: {
    activeInitiatives: 0,
    pendingAssignments: 0,
    overdueItems: 0,
    atRiskInitiatives: 0,
    networkExposure: 0,
    operatorLoad: 0,
  },
  isMonitoring: false,
  acknowledgeSignal: () => {},
  actOnSignal: () => {},
  refreshIntelligence: async () => {},
  getDecisionBriefs: () => [],
  getActiveRisks: () => [],
};

export const useIntelligence = () => {
  const context = useContext(IntelligenceContext);
  // Return default context if not within provider (graceful fallback)
  return context || defaultContext;
};
