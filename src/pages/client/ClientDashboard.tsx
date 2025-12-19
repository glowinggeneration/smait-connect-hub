import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProjectCard, Project } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  MessageSquare,
  FileText,
  CheckCircle2,
  Send,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

const mockActivities = [
  { id: "1", action: "Design mockups uploaded", project: "E-commerce Platform", time: "2 hours ago", type: "file" as const },
  { id: "2", action: "Status updated to Review", project: "Mobile Banking App", time: "1 day ago", type: "status" as const },
  { id: "3", action: "New message from team", project: "E-commerce Platform", time: "2 days ago", type: "message" as const },
];

const ClientDashboard = () => {
  return (
    <DashboardLayout userType="client">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
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
            Send Message
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Active Projects"
          value={2}
          description="Currently in progress"
          icon={FolderKanban}
        />
        <StatsCard
          title="Messages"
          value={5}
          description="Unread messages"
          icon={MessageSquare}
        />
        <StatsCard
          title="Documents"
          value={12}
          description="Shared files"
          icon={FileText}
        />
        <StatsCard
          title="Milestones"
          value={8}
          description="Completed"
          icon={CheckCircle2}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Section */}
        <div className="lg:col-span-2 space-y-6">
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

        {/* Activity & Quick Message */}
        <div className="space-y-6">
          <ActivityFeed activities={mockActivities} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Type your message..." />
              <Button variant="gradient" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Send to Team
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
