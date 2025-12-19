import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, FolderKanban } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SimpleProject {
  id: string;
  name: string;
  description: string;
  status: "pending" | "in-progress" | "review" | "completed";
  progress: number;
  lastUpdated: string;
  client: string;
}

const mockProjects: SimpleProject[] = [
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
  {
    id: "5",
    name: "Social Media Dashboard",
    description: "Analytics dashboard for social media management",
    status: "in-progress",
    progress: 45,
    lastUpdated: "5 hours ago",
    client: "MediaCo",
  },
  {
    id: "6",
    name: "HR Management System",
    description: "Internal tool for employee management and payroll",
    status: "pending",
    progress: 5,
    lastUpdated: "2 days ago",
    client: "TechCorp Ltd",
  },
];

const AdminProjects = () => {
  const [projects, setProjects] = useState<SimpleProject[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    client: "",
  });

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.client) {
      toast({
        title: "Missing Information",
        description: "Please fill in project name and client.",
        variant: "destructive",
      });
      return;
    }

    const project: SimpleProject = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      status: "pending",
      progress: 0,
      lastUpdated: "Just now",
      client: newProject.client,
    };

    setProjects([project, ...projects]);
    setNewProject({ name: "", description: "", client: "" });
    setIsDialogOpen(false);
    toast({
      title: "Project Created",
      description: `${project.name} has been created successfully.`,
    });
  };

  const projectsByStatus = {
    all: filteredProjects,
    active: filteredProjects.filter((p) => p.status === "in-progress"),
    review: filteredProjects.filter((p) => p.status === "review"),
    pending: filteredProjects.filter((p) => p.status === "pending"),
    completed: filteredProjects.filter((p) => p.status === "completed"),
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage and track all client projects
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project for a client. You can configure phases after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter project name"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    <Select
                      value={newProject.client}
                      onValueChange={(value) =>
                        setNewProject({ ...newProject, client: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TechCorp Ltd">TechCorp Ltd</SelectItem>
                        <SelectItem value="FinanceHub">FinanceHub</SelectItem>
                        <SelectItem value="StartupX">StartupX</SelectItem>
                        <SelectItem value="GlobalTech">GlobalTech</SelectItem>
                        <SelectItem value="MediaCo">MediaCo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief project description"
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({ ...newProject, description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="gradient" onClick={handleCreateProject}>
                    Create Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {projectsByStatus.active.length}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {projectsByStatus.review.length}
                </p>
                <p className="text-xs text-muted-foreground">In Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-500">
                  {projectsByStatus.completed.length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({projectsByStatus.all.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({projectsByStatus.active.length})</TabsTrigger>
            <TabsTrigger value="review">Review ({projectsByStatus.review.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({projectsByStatus.pending.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({projectsByStatus.completed.length})</TabsTrigger>
          </TabsList>

          {Object.entries(projectsByStatus).map(([key, projectList]) => (
            <TabsContent key={key} value={key} className="mt-6">
              {projectList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectList.map((project, index) => (
                    <div
                      key={project.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-1">No projects found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "Create a new project to get started"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminProjects;
