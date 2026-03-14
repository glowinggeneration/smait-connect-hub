import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIntelligence } from "@/contexts/IntelligenceContext";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight, Check, ChevronRight, Circle, 
  Loader2, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Initiative {
  id: string;
  name: string;
  status: string;
  progress: number;
  due_date: string | null;
  client_name?: string;
}

interface Brief {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  client_name?: string;
}

const Command = () => {
  const navigate = useNavigate();
  const { signals, metrics, getDecisionBriefs, getActiveRisks, acknowledgeSignal, actOnSignal } = useIntelligence();
  const { isRunning } = useAgentRun();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [projectsRes, briefsRes] = await Promise.all([
        supabase
          .from("projects")
          .select(`*, profiles:client_id(full_name)`)
          .order("updated_at", { ascending: false })
          .limit(8),
        supabase
          .from("project_briefs")
          .select(`*`)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (projectsRes.data) {
        setInitiatives(projectsRes.data.map(p => ({
          ...p,
          client_name: p.profiles?.full_name,
        })));
      }
      if (briefsRes.data) {
        setBriefs(briefsRes.data.map(b => ({
          id: b.id,
          title: b.title,
          category: b.category,
          status: b.status,
          created_at: b.created_at,
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const decisionBriefs = useMemo(() => getDecisionBriefs(), [getDecisionBriefs]);
  const activeRisks = useMemo(() => getActiveRisks(), [getActiveRisks]);

  const getStatusLabel = (status: string, progress: number) => {
    if (status === "completed") return { label: "Complete", className: "state-stable" };
    if (progress >= 80) return { label: "On Track", className: "state-stable" };
    if (progress >= 40) return { label: "In Progress", className: "state-active" };
    return { label: "Starting", className: "text-muted-foreground" };
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-8 max-w-6xl">
        {/* Header - minimal */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Command</h1>
          <p className="text-sm text-muted-foreground">
            System overview and pending decisions
          </p>
        </div>

        {/* System State - compact ledger style */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              System State
            </h2>
            {isRunning && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Circle className="h-2 w-2 fill-state-active text-state-active" />
                Operators active
              </span>
            )}
          </div>
          
          <div className="panel">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              <div className="p-4">
                <p className="text-2xl font-semibold">{metrics.activeInitiatives}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Initiatives</p>
              </div>
              <div className="p-4">
                <p className="text-2xl font-semibold">{metrics.pendingAssignments}</p>
                <p className="text-xs text-muted-foreground mt-1">Open Assignments</p>
              </div>
              <div className="p-4">
                <p className={cn(
                  "text-2xl font-semibold",
                  metrics.overdueItems > 0 && "state-risk"
                )}>{metrics.overdueItems}</p>
                <p className="text-xs text-muted-foreground mt-1">Overdue</p>
              </div>
              <div className="p-4">
                <p className={cn(
                  "text-2xl font-semibold",
                  metrics.atRiskInitiatives > 0 && "state-risk"
                )}>{metrics.atRiskInitiatives}</p>
                <p className="text-xs text-muted-foreground mt-1">At Risk</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Decision Queue - Primary focus */}
          <section className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Pending Decisions
              </h2>
              <span className="text-xs text-muted-foreground">
                {decisionBriefs.length + activeRisks.length} items
              </span>
            </div>
            
            <div className="panel">
              {(decisionBriefs.length === 0 && activeRisks.length === 0) ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="text-center">
                    <Check className="h-5 w-5 mx-auto mb-2 state-stable" />
                    <p className="text-sm">No decisions pending</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[320px]">
                  <div className="divide-y divide-border">
                    {[...activeRisks, ...decisionBriefs].map(signal => (
                      <div
                        key={signal.id}
                        className="ledger-row"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Circle className={cn(
                              "h-2 w-2 shrink-0",
                              signal.type === "risk" || signal.type === "escalation" 
                                ? "fill-state-risk text-state-risk" 
                                : "fill-state-active text-state-active"
                            )} />
                            <span className="text-sm font-medium truncate">{signal.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-4 line-clamp-1">
                            {signal.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {format(new Date(signal.createdAt), "MMM d")}
                          </span>
                          {signal.action && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => actOnSignal(signal.id, signal.action!.type)}
                              className="h-7 text-xs"
                            >
                              {signal.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </section>

          {/* Initiatives - Compact list */}
          <section className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Initiatives
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/work?tab=initiatives")}
                className="h-7 text-xs gap-1"
              >
                View All
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="panel">
              <ScrollArea className="h-[320px]">
                <div className="divide-y divide-border">
                  {initiatives.map(initiative => {
                    const status = getStatusLabel(initiative.status, initiative.progress);
                    return (
                      <div
                        key={initiative.id}
                        onClick={() => navigate(`/admin/project/${initiative.id}`)}
                        className="ledger-row cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {initiative.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {initiative.client_name || "No principal"}
                          </p>
                        </div>
                        <span className={cn("text-xs shrink-0", status.className)}>
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </section>
        </div>

        {/* Recent Intake - Briefs */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Recent Intake
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/work?tab=briefs")}
              className="h-7 text-xs gap-1"
            >
              View All
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="panel">
            {briefs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">No briefs submitted</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {briefs.map(brief => {
                  const briefStatusStyle = brief.status === "approved" 
                    ? "state-stable" 
                    : brief.status === "rejected" 
                      ? "state-risk" 
                      : "state-active";
                  return (
                    <div
                      key={brief.id}
                      className="ledger-row cursor-pointer"
                      onClick={() => navigate("/work?tab=briefs")}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {brief.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {brief.category} · {format(new Date(brief.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <span className={cn("text-xs shrink-0 capitalize", briefStatusStyle)}>
                        {brief.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Command;
