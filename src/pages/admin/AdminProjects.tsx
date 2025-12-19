import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, FolderKanban, Loader2, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  status: string;
  progress: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Client {
  user_id: string;
  full_name: string;
  company: string | null;
}

const AdminProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    client_id: "",
    due_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch clients
      const { data: clientRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");

      if (clientRoles && clientRoles.length > 0) {
        const clientIds = clientRoles.map((r) => r.user_id);
        const { data: clientProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, company")
          .in("user_id", clientIds);
        setClients(clientProfiles || []);
      }

      setProjects(projectsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.user_id === clientId);
    return client?.full_name || client?.company || "Unknown Client";
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(project.client_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.client_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in project name and select a client.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: newProject.name,
          description: newProject.description || null,
          client_id: newProject.client_id,
          due_date: newProject.due_date || null,
          status: "not-started",
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activities").insert({
          user_id: user.id,
          project_id: data.id,
          action: `Created new project: ${newProject.name}`,
          action_type: "create",
        });
      }

      setProjects([data, ...projects]);
      setNewProject({ name: "", description: "", client_id: "", due_date: "" });
      setIsDialogOpen(false);
      toast({
        title: "Project Created",
        description: `${data.name} has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const projectsByStatus = {
    all: filteredProjects,
    active: filteredProjects.filter((p) => p.status === "in-progress"),
    review: filteredProjects.filter((p) => p.status === "on-hold"),
    pending: filteredProjects.filter((p) => p.status === "not-started"),
    completed: filteredProjects.filter((p) => p.status === "completed"),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
      case "on-hold":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">On Hold</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Not Started</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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
                    Add a new project for a client.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
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
                    <Label htmlFor="client">Client *</Label>
                    <Select
                      value={newProject.client_id}
                      onValueChange={(value) =>
                        setNewProject({ ...newProject, client_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length > 0 ? (
                          clients.map((client) => (
                            <SelectItem key={client.user_id} value={client.user_id}>
                              {client.full_name} {client.company && `(${client.company})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No clients available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newProject.due_date}
                      onChange={(e) =>
                        setNewProject({ ...newProject, due_date: e.target.value })
                      }
                    />
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
                  <Button variant="gradient" onClick={handleCreateProject} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Project"}
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
                  {projectsByStatus.pending.length}
                </p>
                <p className="text-xs text-muted-foreground">Not Started</p>
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
            <TabsTrigger value="pending">Not Started ({projectsByStatus.pending.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({projectsByStatus.completed.length})</TabsTrigger>
          </TabsList>

          {Object.entries(projectsByStatus).map(([key, projectList]) => (
            <TabsContent key={key} value={key} className="mt-6">
              {projectList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectList.map((project, index) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => navigate(`/admin/project/${project.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          {getStatusBadge(project.status)}
                          <span className="text-sm font-bold text-primary">{project.progress}%</span>
                        </div>
                        <h3 className="font-semibold mb-1 line-clamp-1">{project.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {getClientName(project.client_id)}
                        </p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <Progress value={project.progress} size="sm" className="mb-3" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                          </span>
                          {project.due_date && (
                            <span>Due: {new Date(project.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
