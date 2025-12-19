import { useState } from "react";
import { Project, ProjectPhase } from "@/types/project";
import { PhaseCard } from "./PhaseCard";
import { PhaseDetail } from "./PhaseDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectPhasesViewProps {
  project: Project;
  isAdmin: boolean;
  onBack?: () => void;
  onUpdateProject?: (project: Project) => void;
}

export const ProjectPhasesView = ({
  project,
  isAdmin,
  onBack,
  onUpdateProject,
}: ProjectPhasesViewProps) => {
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null);
  const [localProject, setLocalProject] = useState<Project>(project);

  const overallProgress = Math.round(
    localProject.phases.reduce((acc, phase) => acc + phase.progress, 0) /
      localProject.phases.length
  );

  const completedPhases = localProject.phases.filter(
    (p) => p.status === "completed"
  ).length;

  const handlePhaseUpdate = (updatedPhase: ProjectPhase) => {
    const updatedProject = {
      ...localProject,
      phases: localProject.phases.map((p) =>
        p.id === updatedPhase.id ? updatedPhase : p
      ),
      updatedAt: new Date().toISOString(),
    };
    setLocalProject(updatedProject);
    onUpdateProject?.(updatedProject);
    setSelectedPhase(updatedPhase);
  };

  const handleMovePhase = (direction: "forward" | "backward") => {
    if (!selectedPhase) return;

    const currentIndex = localProject.phases.findIndex(
      (p) => p.id === selectedPhase.id
    );
    const newIndex =
      direction === "forward" ? currentIndex + 1 : currentIndex - 1;

    if (newIndex < 0 || newIndex >= localProject.phases.length) return;

    const updatedProject = {
      ...localProject,
      currentPhase: newIndex + 1,
    };
    setLocalProject(updatedProject);
    onUpdateProject?.(updatedProject);
  };

  // Filter phases for client view (only visible ones)
  const visiblePhases = isAdmin
    ? localProject.phases
    : localProject.phases.filter((p) => p.isVisible);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{localProject.name}</h1>
            <p className="text-muted-foreground mt-1">
              {localProject.description}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {localProject.clientName}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Started {new Date(localProject.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Updated {new Date(localProject.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Card */}
      <Card variant="gradient">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Overall Project Progress</h3>
              <p className="text-sm text-muted-foreground">
                {completedPhases} of {localProject.phases.length} phases completed
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-3xl font-bold">{overallProgress}%</span>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
              <div className="w-48">
                <Progress value={overallProgress} variant="gradient" size="lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <div className="relative">
        <h2 className="text-xl font-semibold mb-4">Project Phases</h2>

        {/* Timeline connector */}
        <div className="absolute left-[19px] top-16 bottom-4 w-0.5 bg-border hidden md:block" />

        <div className="grid gap-4">
          {visiblePhases.map((phase, index) => (
            <div
              key={phase.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PhaseCard
                phase={phase}
                isActive={phase.order === localProject.currentPhase}
                isAdmin={isAdmin}
                onClick={() => setSelectedPhase(phase)}
                onEdit={() => setSelectedPhase(phase)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Phase Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-muted-foreground">Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Detail Sheet */}
      <Sheet open={!!selectedPhase} onOpenChange={() => setSelectedPhase(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Phase Details</SheetTitle>
          </SheetHeader>
          {selectedPhase && (
            <PhaseDetail
              phase={selectedPhase}
              isAdmin={isAdmin}
              onUpdate={handlePhaseUpdate}
              onMovePhase={handleMovePhase}
              onClose={() => setSelectedPhase(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
