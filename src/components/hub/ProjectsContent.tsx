import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectProgressSlider } from "@/components/projects/ProjectProgressSlider";
import { Plus, Search, FolderKanban, Loader2, Calendar, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, differenceInDays, parseISO } from "date-fns";

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

const ProjectsContent = () => {
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
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setProjects((prev) => [payload.new as Project, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Project) : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            setProjects((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

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

  const updateProjectProgress = async (projectId: string, progress: number) => {
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      let status = project.status;
      if (progress === 100) {
        status = "completed";
      } else if (progress > 0 && status === "not-started") {
        status = "in-progress";
      }

      const { error } = await supabase
        .from("projects")
        .update({ progress, status, updated_at: new Date().toISOString() })
        .eq("id", projectId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activities").insert({
          user_id: user.id,
          project_id: projectId,
          action: `Updated progress to ${progress}%`,
          action_type: "update",
        });

        await supabase.from("notifications").insert({
          user_id: project.client_id,
          title: "Project Progress Updated",
          message: `${project.name} is now ${progress}% complete`,
          type: progress === 100 ? "success" : "info",
        });
      }

      toast({
        title: "Progress Updated",
        description: `Project is now ${progress}% complete`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activities").insert({
          user_id: user.id,
          project_id: data.id,
          action: `Created new project: ${newProject.name}`,
          action_type: "create",
        });

        await supabase.from("notifications").insert({
          user_id: newProject.client_id,
          title: "New Project Created",
          message: `A new project "${newProject.name}" has been created for you`,
          type: "success",
        });
      }

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

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    setDeletingProjectId(projectId);
    try {
      await supabase.from("project_milestones").delete().eq("project_id", projectId);
      await supabase.from("activities").delete().eq("project_id", projectId);
      await supabase.from("tasks").delete().eq("project_id", projectId);
      await supabase.from("project_team").delete().eq("project_id", projectId);

      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;

      toast({
        title: "Project Deleted",
        description: `${projectName} has been deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingProjectId(null);
    }
  };

  const projectsByStatus = {
    all: filteredProjects,
    active: filteredProjects.filter((p) => p.status === "in-progress"),
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

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = differenceInDays(parseISO(dueDate), new Date());
    if (days < 0) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-amber-500/10 text-amber-500 text-xs">{days}d left</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{days}d left</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
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
              <DialogDescription>Add a new project for a client.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={newProject.client_id}
                  onValueChange={(value) => setNewProject({ ...newProject, client_id: value })}
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
                      <SelectItem value="" disabled>No clients available</SelectItem>
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
                  onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief project description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button variant="gradient" onClick={handleCreateProject} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{projectsByStatus.active.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{projectsByStatus.pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{projectsByStatus.completed.length}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({projectsByStatus.all.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({projectsByStatus.active.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({projectsByStatus.pending.length})</TabsTrigger>
          <TabsTrigger value="completed">Done ({projectsByStatus.completed.length})</TabsTrigger>
        </TabsList>

        {Object.entries(projectsByStatus).map(([key, projectList]) => (
          <TabsContent key={key} value={key} className="mt-6">
            {projectList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectList.map((project) => (
                  <Card
                    key={project.id}
                    className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/admin/project/${project.id}`)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{project.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {getClientName(project.client_id)}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{project.name}" and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                disabled={deletingProjectId === project.id}
                              >
                                {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(project.status)}
                        {getDueDateBadge(project.due_date)}
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <ProjectProgressSlider
                          progress={project.progress}
                          onChange={(value) => updateProjectProgress(project.id, value)}
                        />
                      </div>

                      {project.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Due {new Date(project.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-1">No projects found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search" : "Create your first project"}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ProjectsContent;
