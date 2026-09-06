import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { Terminal, AnimatedSpan, TypingAnimation } from "@/components/ui/terminal";
import { cn } from "@/lib/utils";

interface ConsoleOutput {
  id: string;
  agent_name: string;
  agent_role: string;
  phase_name: string;
  status: string;
  output: string | null;
  created_at: string;
}

const statusTone = (status: string) => {
  if (status === "completed") return "text-state-stable";
  if (status === "running") return "text-state-active";
  if (status === "failed") return "text-state-blocked";
  return "text-muted-foreground";
};

const statusMark = (status: string) => {
  if (status === "completed") return "✔";
  if (status === "running") return "▸";
  if (status === "failed") return "✕";
  return "•";
};

/**
 * Live execution console for the operator fleet. Streams operator outputs for
 * the most recent run without replacing the existing status or history views.
 */
export const OperatorConsole = () => {
  const { activeRun, isRunning, runHistory } = useAgentRun();
  const [outputs, setOutputs] = useState<ConsoleOutput[]>([]);

  const runId = activeRun?.id ?? runHistory[0]?.id ?? null;
  const runBrief = activeRun?.brief ?? runHistory[0]?.brief ?? null;

  useEffect(() => {
    if (!runId) {
      setOutputs([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("agent_outputs")
        .select("id, agent_name, agent_role, phase_name, status, output, created_at")
        .eq("run_id", runId)
        .order("created_at", { ascending: true });
      if (!cancelled) setOutputs((data as ConsoleOutput[]) || []);
    };

    load();

    const channel = supabase
      .channel(`operator-console-${runId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_outputs", filter: `run_id=eq.${runId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [runId]);

  if (!runId) {
    return (
      <Terminal title="operators — idle">
        <AnimatedSpan className="text-muted-foreground">
          <span>No directive dispatched yet.</span>
        </AnimatedSpan>
        <AnimatedSpan delay={200} className="text-muted-foreground">
          <span>Dispatch a directive to stream operator activity here.</span>
        </AnimatedSpan>
      </Terminal>
    );
  }

  return (
    <Terminal title={isRunning ? "operators — executing" : "operators — last run"}>
      <TypingAnimation duration={16}>
        {`> dispatch "${(runBrief || "").slice(0, 72)}${(runBrief || "").length > 72 ? "…" : ""}"`}
      </TypingAnimation>

      {outputs.map((item) => (
        <AnimatedSpan key={item.id} className={cn(statusTone(item.status))}>
          <span>
            {statusMark(item.status)} {item.agent_name} — {item.agent_role}
          </span>
          <span className="pl-4 text-muted-foreground">
            {item.phase_name}
            {item.output ? ` · ${item.output.replace(/\s+/g, " ").slice(0, 110)}…` : " · awaiting output"}
          </span>
        </AnimatedSpan>
      ))}

      {isRunning && (
        <TypingAnimation className="text-muted-foreground" duration={22}>
          {`${activeRun?.current_agent || "Atlas"} is working… ${activeRun?.progress ?? 0}% complete`}
        </TypingAnimation>
      )}

      {!isRunning && outputs.length > 0 && (
        <AnimatedSpan delay={150} className="text-state-stable">
          <span>✔ Run complete — {outputs.length} operator outputs recorded.</span>
        </AnimatedSpan>
      )}
    </Terminal>
  );
};

export default OperatorConsole;
