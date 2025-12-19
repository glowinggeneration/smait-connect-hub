import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboardSkeleton, ChartSkeleton } from "@/components/dashboard/DashboardSkeleton";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Target,
  FileUp,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Lazy load chart components for better initial page load
const LazyBarChart = lazy(() => import("recharts").then(m => ({ default: m.BarChart })));
const LazyPieChart = lazy(() => import("recharts").then(m => ({ default: m.PieChart })));
const LazyResponsiveContainer = lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })));

// Import chart components normally for use after lazy loading
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

  const fetchDashboardData = useCallback(async () => {
    try {
      const [projectsRes, tasksRes, activitiesRes, clientRolesRes] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("due_date", { ascending: true }),
        supabase.from("activities").select("*, profiles!activities_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(8),
        supabase.from("user_roles").select("user_id").eq("role", "client"),
      ]);

      if (clientRolesRes.data && clientRolesRes.data.length > 0) {
        const clientIds = clientRolesRes.data.map((r) => r.user_id);
        const { data: clientProfiles } = await supabase.from("profiles").select("*").in("user_id", clientIds);
        setClients(clientProfiles || []);
      }

      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized calculations
  const totalProjects = projects.length;
  const totalClients = clients.length;
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "completed").length, [tasks]);
  const totalTasks = tasks.length;

  const taskStatusData = useMemo(() => [
    { name: "Completed", value: tasks.filter((t) => t.status === "completed").length, color: "hsl(var(--chart-2))" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "in-progress").length, color: "hsl(var(--primary))" },
    { name: "Pending", value: tasks.filter((t) => t.status === "pending").length, color: "hsl(var(--chart-4))" },
    { name: "Blocked", value: tasks.filter((t) => t.status === "blocked").length, color: "hsl(var(--destructive))" },
  ].filter((item) => item.value > 0), [tasks]);

  const projectProgressData = useMemo(() => projects.slice(0, 6).map((p) => ({
    name: p.name.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
    progress: p.progress,
  })), [projects]);

  const upcomingDeadlines = useMemo(() => tasks
    .filter((t) => t.due_date && t.status !== "completed")
    .slice(0, 4)
    .map((t) => ({
      id: t.id,
      title: t.title,
      project: projects.find((p) => p.id === t.project_id)?.name || "No project",
      date: new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      priority: t.priority,
    })), [tasks, projects]);

  const stats = useMemo(() => [
    { title: "Total Projects", value: totalProjects.toString(), icon: FolderKanban, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Active Clients", value: totalClients.toString(), icon: Users, color: "text-smait-teal", bgColor: "bg-smait-teal/10" },
    { title: "Tasks Done", value: completedTasks.toString(), icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { title: "Total Tasks", value: totalTasks.toString(), icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  ], [totalProjects, totalClients, completedTasks, totalTasks]);

  const getActivityIcon = useCallback((type: string) => {
    const icons: Record<string, JSX.Element> = {
      upload: <FileUp className="w-4 h-4" />,
      comment: <MessageSquare className="w-4 h-4" />,
      milestone: <Target className="w-4 h-4" />,
    };
    return icons[type] || <Clock className="w-4 h-4" />;
  }, []);

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <AdminDashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground text-sm lg:text-base mt-1">
              Welcome back! Here's what's happening with your projects.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-3 lg:mt-4">
                  <p className="text-2xl lg:text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Project Progress Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base lg:text-lg">Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {projectProgressData.length > 0 ? (
                <div className="h-[260px] lg:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgressData} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={90} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`${value}%`, "Progress"]}
                      />
                      <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                  No projects yet. Create your first project to see progress.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Status Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base lg:text-lg">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {taskStatusData.length > 0 ? (
                <>
                  <div className="h-[160px] lg:h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
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
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {taskStatusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                        <span className="text-xs font-semibold ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  No tasks yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {getActivityIcon(activity.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.profiles?.full_name || "Unknown"}</span>{" "}
                          <span className="text-muted-foreground">{activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={deadline.id}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{deadline.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{deadline.project}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-[10px] ${
                          deadline.priority === "high"
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : deadline.priority === "medium"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                            : "border-muted-foreground/30 bg-muted text-muted-foreground"
                        }`}
                      >
                        {deadline.date}
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
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base lg:text-lg">Recent Projects</CardTitle>
            <Link to="/admin/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {projects.slice(0, 4).map((project, index) => (
                  <Link
                    to={`/admin/projects/${project.id}`}
                    key={project.id}
                    className="p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer animate-fade-in group"
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          project.status === "completed"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : project.status === "in-progress"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-muted-foreground/30 bg-muted text-muted-foreground"
                        }`}
                      >
                        {project.status === "completed" ? "Done" : project.status === "in-progress" ? "Active" : project.status}
                      </Badge>
                      <span className="text-sm font-bold text-primary">{project.progress}%</span>
                    </div>
                    <h3 className="font-medium mb-1 line-clamp-1 group-hover:text-primary transition-colors">{project.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                      {clients.find((c) => c.user_id === project.client_id)?.full_name || "No client"}
                    </p>
                    <Progress value={project.progress} variant="gradient" className="h-1.5" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No projects yet. Create your first project to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
