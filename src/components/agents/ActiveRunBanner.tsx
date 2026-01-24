import { useAgentRun } from "@/contexts/AgentRunContext";
import { Button } from "@/components/ui/button";
import { X, Circle } from "lucide-react";
import { Link } from "react-router-dom";

export const ActiveRunBanner = () => {
  const { activeRun, isRunning, cancelRun } = useAgentRun();

  if (!isRunning || !activeRun) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 lg:bottom-4 lg:left-60 z-40">
      <div className="bg-card border border-border rounded-md p-3 shadow-soft">
        <div className="flex items-center gap-3">
          <Circle className="h-2 w-2 fill-state-active text-state-active shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Operators active</span>
              <span className="text-xs text-muted-foreground">
                {activeRun.current_agent} • {activeRun.progress}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/intelligence?tab=operators">
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                View
              </Button>
            </Link>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={cancelRun}
              className="h-7 w-7 text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
