import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProjectCard, Project } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderKanban,
  Users,
  Clock,
  CheckCircle2,
  Plus,
  Bell,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const mockProjects: Project[] = [
  {
    id: "1",
    name: "E-commerce Platform Redesign",
    description: "Complete redesign of the online shopping experience with modern UI/UX principles",
    status: "in-progress",
    progress: 65,
    lastUpdated: "2 hours ago",
    client: "TechCorp Ltd",
  },
  {
    id: "2",
    name: "Mobile Banking App",
    description: "Native mobile application for digital banking services",
    status: "review",
    progress: 90,
    lastUpdated: "1 day ago",
    client: "FinanceHub",
  },
  {
    id: "3",
    name: "Brand Identity Package",
    description: "Complete brand refresh including logo, guidelines, and marketing materials",
    status: "pending",
    progress: 15,
    lastUpdated: "3 days ago",
    client: "StartupX",
  },
  {
    id: "4",
    name: "Corporate Website",
    description: "Professional website development with CMS integration",
    status: "completed",
    progress: 100,
    lastUpdated: "1 week ago",
    client: "GlobalTech",
  },
];

const mockActivities = [
  { id: "1", action: "Status updated to Review", project: "Mobile Banking App", time: "10 minutes ago", type: "status" as const },
  { id: "2", action: "New file uploaded", project: "E-commerce Platform", time: "1 hour ago", type: "file" as const },
  { id: "3", action: "Client feedback received", project: "Brand Identity", time: "2 hours ago", type: "message" as const },
  { id: "4", action: "Milestone completed", project: "Corporate Website", time: "Yesterday", type: "update" as const },
  { id: "5", action: "New comment added", project: "E-commerce Platform", time: "Yesterday", type: "message" as const },
];

const AdminDashboard = () => {
  return (
    <DashboardLayout userType="admin">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, Admin</h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-10 w-64" />
          </div>
          
          <Button variant="outline" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          
          <Button variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Projects"
          value={12}
          description="Active and completed"
          icon={FolderKanban}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Clients"
          value={8}
          description="Currently engaged"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="In Progress"
          value={5}
          description="Ongoing projects"
          icon={Clock}
        />
        <StatsCard
          title="Completed"
          value={7}
          description="This month"
          icon={CheckCircle2}
          trend={{ value: 20, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          
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

        {/* Activity & Quick Actions */}
        <div className="space-y-6">
          <ActivityFeed activities={mockActivities} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FolderKanban className="w-4 h-4 mr-2" />
                Create Project
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bell className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
