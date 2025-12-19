import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calendar,
  Target,
  FileUp,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string;
  client_id: string;
  status: string;
  progress: number;
  due_date: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  project_id: string;
}

interface Activity {
  id: string;
  user_id: string;
  action: string;
  action_type: string;
  created_at: string;
  profiles?: { full_name: string };
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  company: string | null;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true });

      // Fetch activities with user info
      const { data: activitiesData } = await supabase
        .from("activities")
        .select("*, profiles!activities_user_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch clients (users with client role)
      const { data: clientRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");

      if (clientRoles && clientRoles.length > 0) {
        const clientIds = clientRoles.map((r) => r.user_id);
        const { data: clientProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", clientIds);
        setClients(clientProfiles || []);
      }

      setProjects(projectsData || []);
      setTasks(tasksData || []);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalProjects = projects.length;
  const totalClients = clients.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalTasks = tasks.length;

  // Task status distribution for pie chart
  const taskStatusData = [
    { name: "Completed", value: tasks.filter((t) => t.status === "completed").length, color: "hsl(var(--chart-2))" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "in-progress").length, color: "hsl(var(--primary))" },
    { name: "Pending", value: tasks.filter((t) => t.status === "pending").length, color: "hsl(var(--chart-4))" },
    { name: "Blocked", value: tasks.filter((t) => t.status === "blocked").length, color: "hsl(var(--destructive))" },
  ].filter((item) => item.value > 0);

  // Project progress for bar chart
  const projectProgressData = projects.map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    progress: p.progress,
  }));

  // Upcoming deadlines
  const upcomingDeadlines = tasks
    .filter((t) => t.due_date && t.status !== "completed")
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title,
      project: projects.find((p) => p.id === t.project_id)?.name || "No project",
      date: new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      priority: t.priority,
    }));

  const stats = [
    {
      title: "Total Projects",
      value: totalProjects.toString(),
      change: totalProjects > 0 ? "+100%" : "0%",
      trend: "up" as const,
      icon: FolderKanban,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Clients",
      value: totalClients.toString(),
      change: totalClients > 0 ? "+100%" : "0%",
      trend: "up" as const,
      icon: Users,
      color: "text-smait-teal",
      bgColor: "bg-smait-teal/10",
    },
    {
      title: "Tasks Completed",
      value: completedTasks.toString(),
      change: totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : "0%",
      trend: "up" as const,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Total Tasks",
      value: totalTasks.toString(),
      change: totalTasks > 0 ? "Active" : "None",
      trend: "up" as const,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "upload":
        return <FileUp className="w-4 h-4" />;
      case "comment":
        return <MessageSquare className="w-4 h-4" />;
      case "milestone":
        return <Target className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Overview</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your projects.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === "up" ? "text-emerald-500" : "text-destructive"}`}>
                    {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Progress Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {projectProgressData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgressData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}%`, "Progress"]}
                      />
                      <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No projects yet. Create your first project to see progress here.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {taskStatusData.length > 0 ? (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {taskStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {taskStatusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                        <span className="text-xs font-medium ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No tasks yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(activity.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.profiles?.full_name || "Unknown User"}</span>{" "}
                          <span className="text-muted-foreground">{activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">{deadline.project}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{deadline.date}</span>
                      <Badge
                        variant="outline"
                        className={
                          deadline.priority === "high"
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : deadline.priority === "medium"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                            : "border-muted-foreground/30 bg-muted text-muted-foreground"
                        }
                      >
                        {deadline.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No upcoming deadlines
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Projects</CardTitle>
            <a href="/admin/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </a>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projects.slice(0, 4).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="outline"
                        className={
                          project.status === "completed"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : project.status === "in-progress"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-muted-foreground/30 bg-muted text-muted-foreground"
                        }
                      >
                        {project.status === "completed" ? "Completed" : project.status === "in-progress" ? "In Progress" : project.status}
                      </Badge>
                      <span className="text-sm font-bold text-primary">{project.progress}%</span>
                    </div>
                    <h3 className="font-medium mb-1 line-clamp-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                      {clients.find((c) => c.user_id === project.client_id)?.full_name || "No client"}
                    </p>
                    <Progress value={project.progress} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No projects yet. Create your first project to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
