import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard, Project } from "@/components/projects/ProjectCard";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AvatarStack } from "@/components/ui/avatar-stack";
import {
  FolderKanban,
  MessageSquare,
  FileText,
  CheckCircle2,
  Send,
  Upload,
  Clock,
} from "lucide-react";

const mockProjects: Project[] = [
  {
    id: "1",
    name: "E-commerce Platform Redesign",
    description: "Complete redesign of your online shopping experience with modern UI/UX",
    status: "in-progress",
    progress: 65,
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "Mobile Banking App",
    description: "Native mobile application for digital banking services",
    status: "review",
    progress: 90,
    lastUpdated: "1 day ago",
  },
];

const schedules = [
  {
    label: "Weekly sync with SMAIT",
    title: "Project Review Call",
    time: "15:00",
    participants: [
      { name: "Admin" },
      { name: "Designer" },
      { name: "You" },
    ],
  },
];

const recentUpdates = [
  { id: "1", action: "Design mockups uploaded", project: "E-commerce Platform", time: "2 hours ago", type: "file" },
  { id: "2", action: "Status updated to Review", project: "Mobile Banking App", time: "1 day ago", type: "status" },
  { id: "3", action: "New message from team", project: "E-commerce Platform", time: "2 days ago", type: "message" },
];

const ClientDashboard = () => {
  return (
    <DashboardLayout userType="client">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="text-muted-foreground mt-1">
                Track your project progress and communicate with our team.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
              <Button variant="gradient">
                <Send className="w-4 h-4 mr-2" />
                Message Team
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active Projects", value: "2", icon: FolderKanban, color: "text-primary" },
              { label: "Messages", value: "5", icon: MessageSquare, color: "text-blue-500" },
              { label: "Documents", value: "12", icon: FileText, color: "text-amber-500" },
              { label: "Milestones", value: "8", icon: CheckCircle2, color: "text-emerald-500" },
            ].map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projects */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Projects</h2>
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
          </div>

          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockProjects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{project.name}</span>
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} variant="gradient" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <TodaySchedule schedules={schedules} />
          
          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentUpdates.map((update) => (
                <div key={update.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{update.action}</span>
                      {" in "}
                      <span className="text-primary font-medium">{update.project}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {update.time}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
