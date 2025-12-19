import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Search, Calendar, Clock, Flag, CheckCircle2, Circle, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "completed";
  dueDate: string;
  category: "daily" | "weekly" | "monthly";
  createdAt: string;
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Review Q4 Financial Reports",
    description: "Analyze quarterly financial performance and prepare summary",
    priority: "high",
    status: "in-progress",
    dueDate: "2024-12-20",
    category: "monthly",
    createdAt: "2024-12-01",
  },
  {
    id: "2",
    title: "Client Onboarding - TechCorp",
    description: "Complete onboarding documentation for new client",
    priority: "high",
    status: "todo",
    dueDate: "2024-12-18",
    category: "weekly",
    createdAt: "2024-12-15",
  },
  {
    id: "3",
    title: "Update Project Timeline",
    description: "Adjust milestones based on client feedback",
    priority: "medium",
    status: "todo",
    dueDate: "2024-12-19",
    category: "daily",
    createdAt: "2024-12-17",
  },
  {
    id: "4",
    title: "Team Performance Reviews",
    description: "Complete monthly performance assessments",
    priority: "medium",
    status: "todo",
    dueDate: "2024-12-25",
    category: "monthly",
    createdAt: "2024-12-01",
  },
  {
    id: "5",
    title: "Prepare Monthly Newsletter",
    description: "Draft and send client newsletter",
    priority: "low",
    status: "completed",
    dueDate: "2024-12-15",
    category: "monthly",
    createdAt: "2024-12-01",
  },
];

const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    category: "monthly" as Task["category"],
    dueDate: "",
  });

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tasksByCategory = {
    all: filteredTasks,
    daily: filteredTasks.filter((t) => t.category === "daily"),
    weekly: filteredTasks.filter((t) => t.category === "weekly"),
    monthly: filteredTasks.filter((t) => t.category === "monthly"),
  };

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and due date.",
        variant: "destructive",
      });
      return;
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: "todo",
      dueDate: newTask.dueDate,
      category: newTask.category,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setTasks([task, ...tasks]);
    setNewTask({ title: "", description: "", priority: "medium", category: "monthly", dueDate: "" });
    setIsDialogOpen(false);
    toast({
      title: "Task Created",
      description: `${task.title} has been added to your ${task.category} tasks.`,
    });
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map((task) => {
      if (task.id === taskId) {
        const newStatus = task.status === "completed" ? "todo" : "completed";
        return { ...task, status: newStatus };
      }
      return task;
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    toast({
      title: "Task Deleted",
      description: "The task has been removed.",
    });
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-amber-500";
      case "low":
        return "text-emerald-500";
    }
  };

  const getPriorityBadge = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500";
      case "medium":
        return "bg-amber-500/10 text-amber-500";
      case "low":
        return "bg-emerald-500/10 text-emerald-500";
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className={`transition-all ${task.status === "completed" ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => toggleTaskStatus(task.id)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </h3>
              <Badge className={getPriorityBadge(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Tasks</h1>
            <p className="text-muted-foreground">
              Manage your daily, weekly, and monthly tasks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your list. Choose the category and priority.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title *</Label>
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
                      placeholder="Add details about this task"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newTask.category}
                        onValueChange={(value: Task["category"]) =>
                          setNewTask({ ...newTask, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value: Task["priority"]) =>
                          setNewTask({ ...newTask, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="gradient" onClick={handleCreateTask}>
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Circle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.filter((t) => t.status === "todo").length}</p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.filter((t) => t.status === "in-progress").length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.filter((t) => t.status === "completed").length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tasks.filter((t) => t.priority === "high" && t.status !== "completed").length}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks by Category */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({tasksByCategory.all.length})</TabsTrigger>
            <TabsTrigger value="daily">Daily ({tasksByCategory.daily.length})</TabsTrigger>
            <TabsTrigger value="weekly">Weekly ({tasksByCategory.weekly.length})</TabsTrigger>
            <TabsTrigger value="monthly">Monthly ({tasksByCategory.monthly.length})</TabsTrigger>
          </TabsList>

          {Object.entries(tasksByCategory).map(([key, taskList]) => (
            <TabsContent key={key} value={key} className="mt-6">
              {taskList.length > 0 ? (
                <div className="space-y-3">
                  {taskList.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-1">No tasks found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "Try adjusting your search" : "Create a new task to get started"}
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

export default AdminTasks;