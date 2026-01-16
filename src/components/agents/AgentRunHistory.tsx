import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  History, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  FileDown,
  ChevronRight
} from "lucide-react";
import { useAgentRun } from "@/contexts/AgentRunContext";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

interface AgentOutput {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_role: string;
  phase: number;
  phase_name: string;
  output: string | null;
  status: string;
}

interface AgentRun {
  id: string;
  brief: string;
  status: string;
  progress: number;
  current_agent: string | null;
  created_at: string;
  completed_at: string | null;
}

export const AgentRunHistory = () => {
  const { runHistory, getRunOutputs } = useAgentRun();
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
  const [outputs, setOutputs] = useState<AgentOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewRun = async (run: AgentRun) => {
    setSelectedRun(run);
    setIsLoading(true);
    const data = await getRunOutputs(run.id);
    setOutputs(data);
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      running: "bg-primary/20 text-primary border-primary/30",
      error: "bg-red-500/20 text-red-400 border-red-500/30",
      cancelled: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return styles[status as keyof typeof styles] || "bg-muted text-muted-foreground";
  };

  const downloadPDF = () => {
    if (!selectedRun || outputs.length === 0) return;

    const completedOutputs = outputs.filter(o => o.status === "completed" && o.output);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("AI Agency Report", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(selectedRun.created_at), "PPpp")}`, pageWidth / 2, 55, { align: "center" });

    doc.addPage();
    yPos = margin;

    // Brief
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Project Brief:", margin, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const briefLines = doc.splitTextToSize(selectedRun.brief, maxWidth);
    doc.text(briefLines, margin, yPos);
    yPos += briefLines.length * 5 + 15;

    // Outputs
    completedOutputs.forEach((output) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${output.agent_name} - ${output.agent_role}`, margin, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(`Phase ${output.phase}: ${output.phase_name}`, margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (output.output) {
        const outputLines = doc.splitTextToSize(output.output, maxWidth);
        outputLines.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(line, margin, yPos);
          yPos += 5;
        });
      }
      yPos += 10;
    });

    doc.save(`agent-run-${format(new Date(selectedRun.created_at), "yyyy-MM-dd")}.pdf`);
  };

  if (runHistory.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardContent className="p-8 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No previous runs yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start a new agent run to see history here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Run History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-3">
              {runHistory.map((run) => (
                <button
                  key={run.id}
                  onClick={() => handleViewRun(run)}
                  className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <Badge className={cn("text-xs", getStatusBadge(run.status))}>
                        {run.status}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm line-clamp-2 text-foreground mb-1">
                    {run.brief}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(run.created_at), "MMM d, h:mm a")}</span>
                    {run.status === "running" && (
                      <span className="text-primary">{run.progress}%</span>
                    )}
                  </div>
                  {run.status === "running" && (
                    <Progress value={run.progress} className="h-1 mt-2" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>Run Details</span>
              {selectedRun?.status === "completed" && (
                <Button size="sm" onClick={downloadPDF} className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {/* Brief */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Project Brief</h4>
                  <p className="text-sm text-muted-foreground">{selectedRun?.brief}</p>
                </div>

                {/* Outputs */}
                <div className="space-y-3">
                  {outputs.map((output) => (
                    <div
                      key={output.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        output.status === "completed"
                          ? "bg-green-500/5 border-green-500/20"
                          : output.status === "error"
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-muted/30 border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(output.status)}
                        <span className="font-medium">{output.agent_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {output.agent_role}
                        </span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          Phase {output.phase}
                        </Badge>
                      </div>
                      {output.output ? (
                        <p className="text-sm whitespace-pre-wrap">{output.output}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {output.status === "pending" ? "Pending..." : "No output"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
