import { useAgentRun } from "@/contexts/AgentRunContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const ActiveRunBanner = () => {
  const { activeRun, isRunning, cancelRun } = useAgentRun();

  if (!isRunning || !activeRun) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-72 z-40">
      <div className="bg-black/80 backdrop-blur-xl border border-primary/30 rounded-xl p-4 shadow-lg shadow-primary/10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="font-medium text-sm">AI Agents Running</span>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                {activeRun.progress}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Progress value={activeRun.progress} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activeRun.current_agent && `${activeRun.current_agent} working...`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/admin/agents">
              <Button size="sm" variant="secondary">
                View
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={cancelRun}
              className="text-muted-foreground hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
