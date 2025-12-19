import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeaturedProjectCard } from "@/components/dashboard/FeaturedProjectCard";
import { TaskList } from "@/components/dashboard/TaskList";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { ProjectStats } from "@/components/dashboard/ProjectStats";
import { NewTaskForm } from "@/components/dashboard/NewTaskForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search,
  Archive,
  Plus,
} from "lucide-react";

const todayTasks = [
  {
    id: "1",
    icon: (
      <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
        U
      </div>
    ),
    iconBg: "bg-primary/10",
    title: "Uber",
    description: "App Design and Upgrades with new features – In Progress 16 days",
    team: [{ name: "Alex" }, { name: "Sarah" }, { name: "Mike" }],
  },
  {
    id: "2",
    icon: (
      <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-primary-foreground text-xs font-bold">
        f
      </div>
    ),
    iconBg: "bg-blue-500/10",
    title: "Facebook Ads",
    description: "Facebook Ads Design for CreativeCloud – Last worked 5 days ago",
    team: [{ name: "John" }, { name: "Emma" }],
  },
  {
    id: "3",
    icon: (
      <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-primary-foreground text-xs font-bold">
        P
      </div>
    ),
    iconBg: "bg-emerald-500/10",
    title: "Payoneer",
    description: "Payoneer Dashboard Design – Due in 3 days",
    team: [{ name: "Lisa" }, { name: "Tom" }, { name: "Kate" }],
  },
];

const tomorrowTasks = [
  {
    id: "4",
    icon: (
      <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center text-primary-foreground text-xs font-bold">
        up
      </div>
    ),
    iconBg: "bg-green-500/10",
    title: "Upwork",
    description: "Developing – Viewed Just Now – Assigned 10 min ago",
    team: [{ name: "David" }, { name: "Anna" }],
  },
];

const schedules = [
  {
    label: "30 minute call with Client",
    title: "Project Discovery Call",
    time: "28:35",
    participants: [
      { name: "Alex" },
      { name: "Sarah" },
      { name: "Mike" },
      { name: "John" },
    ],
  },
];

const AdminDashboard = () => {
  return (
    <DashboardLayout userType="admin">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Hi Shakir!</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">15% task completed</span>
              <div className="w-32">
                <Progress value={15} variant="gradient" size="sm" />
              </div>
            </div>
          </div>

          {/* Featured Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeaturedProjectCard
              title="R&D for New Banking Mobile App"
              icon="lightbulb"
              gradient="primary"
              team={[{ name: "Alex" }, { name: "Sarah" }, { name: "Mike" }]}
            />
            <FeaturedProjectCard
              title="Create Signup Page"
              icon="target"
              gradient="teal"
              team={[{ name: "John" }, { name: "Emma" }]}
            />
          </div>

          {/* Monthly Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-semibold">Monthly Tasks</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
                <Button variant="gradient" size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="bg-transparent p-0 h-auto gap-6">
                    <TabsTrigger
                      value="active"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-2"
                    >
                      Active Tasks
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-2"
                    >
                      Completed
                    </TabsTrigger>
                  </TabsList>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search"
                      className="pl-9 w-40 h-9 bg-muted/50 border-0"
                    />
                  </div>
                </div>

                <TabsContent value="active" className="mt-0 space-y-6">
                  <TaskList title="Today" tasks={todayTasks} />
                  <TaskList title="Tomorrow" tasks={tomorrowTasks} />
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                  <div className="text-center py-8 text-muted-foreground">
                    No completed tasks yet
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <TodaySchedule schedules={schedules} />
          <ProjectStats
            title="Design Project"
            status="In Progress"
            completed={114}
            inProgress={24}
            team={[{ name: "Mike" }, { name: "Sarah" }, { name: "Alex" }]}
          />
          <NewTaskForm />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
