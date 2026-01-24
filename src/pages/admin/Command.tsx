import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIntelligence } from "@/contexts/IntelligenceContext";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, AlertTriangle, ArrowRight, Bell, 
  CheckCircle2, Clock, Compass, Eye, Loader2,
  Radio, Shield, Sparkles, Target, TrendingUp, Zap
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

const Command = () => {
  const navigate = useNavigate();
  const { signals, metrics, getDecisionBriefs, getActiveRisks, acknowledgeSignal, actOnSignal } = useIntelligence();
  const { activeRun, isRunning } = useAgentRun();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("projects")
        .select(`*, profiles:client_id(full_name)`)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (data) {
        setInitiatives(data.map(p => ({
          ...p,
          client_name: p.profiles?.full_name,
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const decisionBriefs = useMemo(() => getDecisionBriefs(), [getDecisionBriefs]);
  const activeRisks = useMemo(() => getActiveRisks(), [getActiveRisks]);
  const unacknowledgedSignals = useMemo(() => 
    signals.filter(s => !s.acknowledged).length,
  [signals]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "risk": return AlertTriangle;
      case "escalation": return Shield;
      case "opportunity": return TrendingUp;
      case "decision": return Compass;
      default: return Bell;
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Command Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg border border-white/10">
              <Radio className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Command</h1>
              <p className="text-muted-foreground text-sm">
                System state • {unacknowledgedSignals} signals awaiting acknowledgment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <Badge className="bg-primary/20 text-primary gap-1">
                <Sparkles className="h-3 w-3" />
                Operators Active
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              Monitoring
            </Badge>
          </div>
        </div>

        {/* Execution Load Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{metrics.activeInitiatives}</span>
              </div>
              <p className="text-xs text-muted-foreground">Active Initiatives</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{metrics.pendingAssignments}</span>
              </div>
              <p className="text-xs text-muted-foreground">Open Assignments</p>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "backdrop-blur-sm border-white/10",
            metrics.overdueItems > 0 ? "bg-red-500/10" : "bg-card/50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className={cn(
                  "h-4 w-4",
                  metrics.overdueItems > 0 ? "text-red-400" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-2xl font-bold",
                  metrics.overdueItems > 0 && "text-red-400"
                )}>{metrics.overdueItems}</span>
              </div>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "backdrop-blur-sm border-white/10",
            metrics.atRiskInitiatives > 0 ? "bg-orange-500/10" : "bg-card/50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Shield className={cn(
                  "h-4 w-4",
                  metrics.atRiskInitiatives > 0 ? "text-orange-400" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-2xl font-bold",
                  metrics.atRiskInitiatives > 0 && "text-orange-400"
                )}>{metrics.atRiskInitiatives}</span>
              </div>
              <p className="text-xs text-muted-foreground">At Risk</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{metrics.networkExposure}</span>
              </div>
              <p className="text-xs text-muted-foreground">Network Exposure</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <Progress value={metrics.operatorLoad} className="h-2 w-12" />
              </div>
              <p className="text-xs text-muted-foreground">Operator Load</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Decision Queue */}
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Compass className="h-5 w-5 text-primary" />
                  Decision Queue
                </CardTitle>
                <Badge variant="secondary">{decisionBriefs.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {decisionBriefs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                  <p className="text-sm">No decisions pending</p>
                </div>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {decisionBriefs.map(signal => {
                      const Icon = getSignalIcon(signal.type);
                      return (
                        <div
                          key={signal.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center",
                            getSeverityColor(signal.severity)
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{signal.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{signal.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{signal.source}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(signal.createdAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                          {signal.action && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => actOnSignal(signal.id, signal.action!.type)}
                              className="shrink-0"
                            >
                              {signal.action.label}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Risk Signals */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  Active Risks
                </CardTitle>
                <Badge variant="secondary" className={cn(
                  activeRisks.length > 0 && "bg-orange-500/20 text-orange-400"
                )}>{activeRisks.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activeRisks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mb-2 text-green-500" />
                  <p className="text-sm">No active risks</p>
                </div>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {activeRisks.map(risk => (
                      <div
                        key={risk.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          getSeverityColor(risk.severity)
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{risk.title}</p>
                            <p className="text-xs opacity-80 mt-1">{risk.description}</p>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 shrink-0"
                            onClick={() => acknowledgeSignal(risk.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Initiatives */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Active Initiatives
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/work?tab=initiatives")}
                className="gap-1"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {initiatives.map(initiative => (
                <div
                  key={initiative.id}
                  onClick={() => navigate(`/admin/project/${initiative.id}`)}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {initiative.name}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {initiative.progress}%
                    </Badge>
                  </div>
                  <Progress value={initiative.progress} className="h-1 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {initiative.client_name || "No client"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Command;
