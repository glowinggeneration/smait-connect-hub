import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Plus, Search, ListTodo, Loader2, Trash2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
  assigned_to: string | null;
  assigned_name?: string;
}

interface AdminUser {
  user_id: string;
  full_name: string;
  email: string;
}

const TasksContent = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", adminIds);
        setAdminUsers(profiles || []);
      }

      const { data: tasksData, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const tasksWithNames = (tasksData || []).map((task) => {
        const assignee = adminUsers.find((u) => u.user_id === task.assigned_to);
        return { ...task, assigned_name: assignee?.full_name };
      });

      setTasks(tasksWithNames);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tasksByStatus = {
    all: filteredTasks,
    pending: filteredTasks.filter((t) => t.status === "pending"),
    "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  };

  const handleCreateTask = async () => {
    if (!newTask.title) {
      toast({ title: "Missing Information", description: "Please enter a task title.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tasks").insert({
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to || null,
        created_by: user.id,
        status: "pending",
      });

      if (error) throw error;

      setNewTask({ title: "", description: "", priority: "medium", due_date: "", assigned_to: "" });
      setIsDialogOpen(false);
      fetchData();
      toast({ title: "Task Created", description: "Task has been added successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast({ title: "Deleted", description: "Task has been deleted." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500/10 text-red-500">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/10 text-amber-500">Medium</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Low</Badge>;
    }
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

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
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to your list.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select value={newTask.assigned_to} onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v })}>
                  <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                  <SelectContent>
                    {adminUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>{user.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button variant="gradient" onClick={handleCreateTask} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Task"}
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
                <ListTodo className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{tasksByStatus.pending.length}</p>
            <p className="text-xs text-muted-foreground">To Do</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{tasksByStatus["in-progress"].length}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{tasksByStatus.completed.length}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({tasksByStatus.all.length})</TabsTrigger>
          <TabsTrigger value="pending">To Do ({tasksByStatus.pending.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({tasksByStatus["in-progress"].length})</TabsTrigger>
          <TabsTrigger value="completed">Done ({tasksByStatus.completed.length})</TabsTrigger>
        </TabsList>

        {Object.entries(tasksByStatus).map(([key, taskList]) => (
          <TabsContent key={key} value={key} className="mt-6">
            {taskList.length > 0 ? (
              <div className="space-y-2">
                {taskList.map((task) => (
                  <Card key={task.id} className="hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleTaskStatus(task.id, task.status)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            task.status === "completed"
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-muted-foreground hover:border-primary"
                          }`}
                        >
                          {task.status === "completed" && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </h3>
                            {getPriorityBadge(task.priority)}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(task.due_date), "MMM d")}
                              </span>
                            )}
                            {task.assigned_name && (
                              <span className="flex items-center gap-1">
                                <Avatar className="w-4 h-4">
                                  <AvatarFallback className="text-[8px]">{getInitials(task.assigned_name)}</AvatarFallback>
                                </Avatar>
                                {task.assigned_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-1">No tasks found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search" : "Create your first task"}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TasksContent;
