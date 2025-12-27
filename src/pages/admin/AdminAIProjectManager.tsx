import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TopHeader } from "@/components/layout/TopHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, Clock, Target, FolderKanban, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore, addDays, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const AdminAIProjectManager = () => {
  const { toast } = useToast();
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Fetch tasks for reminders
  const { data: tasks } = useQuery({
    queryKey: ["tasks-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .neq("status", "completed")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch projects for reminders
  const { data: projects } = useQuery({
    queryKey: ["projects-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .neq("status", "completed")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch leads
  const { data: leads } = useQuery({
    queryKey: ["leads-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const today = new Date();
  const threeDaysFromNow = addDays(today, 3);

  const overdueTasks = tasks?.filter(
    (t) => t.due_date && isBefore(parseISO(t.due_date), today)
  ) || [];

  const upcomingTasks = tasks?.filter(
    (t) => t.due_date && 
    isAfter(parseISO(t.due_date), today) && 
    isBefore(parseISO(t.due_date), threeDaysFromNow)
  ) || [];

  const overdueProjects = projects?.filter(
    (p) => p.due_date && isBefore(parseISO(p.due_date), today)
  ) || [];

  const leadsByStage = {
    new: leads?.filter((l) => l.stage === "new").length || 0,
    contacted: leads?.filter((l) => l.stage === "contacted").length || 0,
    qualified: leads?.filter((l) => l.stage === "qualified").length || 0,
    proposal: leads?.filter((l) => l.stage === "proposal").length || 0,
    negotiation: leads?.filter((l) => l.stage === "negotiation").length || 0,
  };

  const runAIAnalysis = async () => {
    setIsLoading(true);
    setAiResponse("");
    setHasAnalyzed(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to use AI analysis",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-project-manager`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI analysis");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setAiResponse((prev) => prev + content);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Failed to analyze",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format markdown to basic HTML
  const formatMarkdown = (text: string) => {
    return text
      .replace(/### (.*?)(\n|$)/g, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-white/80">$1</em>')
      .replace(/- (.*?)(\n|$)/g, '<li class="text-white/80 ml-4">$1</li>')
      .replace(/\n/g, "<br />");
  };

  return (
    <DashboardLayout userType="admin">
      <TopHeader userType="admin" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-2xl">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Project Manager</h1>
              <p className="text-white/60">Your intelligent assistant for managing work</p>
            </div>
          </div>
          <Button
            onClick={runAIAnalysis}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{overdueTasks.length}</p>
                  <p className="text-xs text-white/60">Overdue Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-xl">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{upcomingTasks.length}</p>
                  <p className="text-xs text-white/60">Due Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{leads?.length || 0}</p>
                  <p className="text-xs text-white/60">Active Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-xl">
                  <FolderKanban className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{projects?.length || 0}</p>
                  <p className="text-xs text-white/60">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Analysis Panel */}
          <Card className="lg:col-span-2 bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Analysis & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-white/10" />
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-5/6 bg-white/10" />
                  <Skeleton className="h-4 w-2/3 bg-white/10" />
                </div>
              ) : aiResponse ? (
                <div
                  className="prose prose-invert max-w-none text-white/80"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(aiResponse) }}
                />
              ) : (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 mb-2">
                    Click "Run AI Analysis" to get personalized insights
                  </p>
                  <p className="text-white/40 text-sm">
                    The AI will analyze your tasks, projects, and leads to give you actionable recommendations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminders Sidebar */}
          <div className="space-y-6">
            {/* Overdue Tasks */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueTasks.length === 0 ? (
                  <p className="text-white/40 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    No overdue tasks!
                  </p>
                ) : (
                  overdueTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"
                    >
                      <p className="text-white text-sm font-medium truncate">{task.title}</p>
                      <p className="text-red-400 text-xs">
                        Due: {format(parseISO(task.due_date!), "MMM d")}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  Due in 3 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingTasks.length === 0 ? (
                  <p className="text-white/40 text-sm">No upcoming deadlines</p>
                ) : (
                  upcomingTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20"
                    >
                      <p className="text-white text-sm font-medium truncate">{task.title}</p>
                      <p className="text-yellow-400 text-xs">
                        Due: {format(parseISO(task.due_date!), "MMM d")}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Lead Pipeline Summary */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Lead Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">New</span>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {leadsByStage.new}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Contacted</span>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                    {leadsByStage.contacted}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Qualified</span>
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                    {leadsByStage.qualified}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Proposal</span>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                    {leadsByStage.proposal}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Negotiation</span>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                    {leadsByStage.negotiation}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAIProjectManager;
