import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban } from "lucide-react";

import { Project } from "@/components/projects/ProjectCard";

const mockProjects: Project[] = [
  {
    id: "1",
    name: "E-commerce Platform Redesign",
    description: "Complete redesign of your online shopping experience with modern UI/UX",
    status: "in-progress",
    progress: 65,
    lastUpdated: "2 hours ago",
    dueDate: "2025-01-15",
  },
  {
    id: "2",
    name: "Mobile Banking App",
    description: "Native mobile application for digital banking services",
    status: "review",
    progress: 90,
    lastUpdated: "1 day ago",
    dueDate: "2025-01-05",
  },
];

const ClientProjects = () => {
  return (
    <DashboardLayout userType="client">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            Track progress and view details of your projects
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{mockProjects.length}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {mockProjects.filter((p) => p.status === "in-progress").length}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">
                {mockProjects.filter((p) => p.status === "review").length}
              </p>
              <p className="text-sm text-muted-foreground">Awaiting Review</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockProjects.map((project, index) => (
            <div
              key={project.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mockProjects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{project.name}</span>
                    <Badge
                      variant={
                        project.status === "in-progress"
                          ? "inProgress"
                          : project.status === "review"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {project.status === "in-progress"
                        ? "In Progress"
                        : project.status === "review"
                        ? "In Review"
                        : project.status}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} variant="gradient" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientProjects;
