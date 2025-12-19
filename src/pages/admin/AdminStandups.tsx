import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface StandupEntry {
  id: string;
  date: string;
  author: string;
  yesterday: string;
  today: string;
  blockers: string;
  createdAt: string;
}

const initialStandups: StandupEntry[] = [
  {
    id: "1",
    date: "2024-12-19",
    author: "You",
    yesterday: "Completed the client dashboard redesign and reviewed pull requests from the team.",
    today: "Working on the project phases implementation and client feedback integration.",
    blockers: "Waiting for design assets from the design team for the mobile view.",
    createdAt: "2024-12-19T09:00:00Z",
  },
  {
    id: "2",
    date: "2024-12-18",
    author: "You",
    yesterday: "Fixed authentication bugs and set up the database schema for client management.",
    today: "Planning to work on the admin dashboard and client list features.",
    blockers: "None",
    createdAt: "2024-12-18T09:15:00Z",
  },
  {
    id: "3",
    date: "2024-12-17",
    author: "You",
    yesterday: "Initial project setup and configured the development environment.",
    today: "Starting work on the sidebar navigation and layout components.",
    blockers: "Need clarification on the color scheme from the client.",
    createdAt: "2024-12-17T09:30:00Z",
  },
];

const AdminStandups = () => {
  const [standups, setStandups] = useState<StandupEntry[]>(initialStandups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStandup, setNewStandup] = useState({
    yesterday: "",
    today: "",
    blockers: "",
  });

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const hasTodayStandup = standups.some((s) => s.date === todayDate);

  const handleCreateStandup = () => {
    if (!newStandup.yesterday || !newStandup.today) {
      toast({
        title: "Missing Information",
        description: "Please fill in what you did yesterday and your plans for today.",
        variant: "destructive",
      });
      return;
    }

    const standup: StandupEntry = {
      id: `standup-${Date.now()}`,
      date: todayDate,
      author: "You",
      yesterday: newStandup.yesterday,
      today: newStandup.today,
      blockers: newStandup.blockers || "None",
      createdAt: new Date().toISOString(),
    };

    setStandups([standup, ...standups]);
    setNewStandup({ yesterday: "", today: "", blockers: "" });
    setIsDialogOpen(false);
    toast({
      title: "Standup Submitted",
      description: "Your daily standup has been recorded.",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === format(today, "yyyy-MM-dd")) {
      return "Today";
    } else if (dateStr === format(yesterday, "yyyy-MM-dd")) {
      return "Yesterday";
    }
    return format(date, "EEEE, MMMM d");
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Daily Standups</h1>
            <p className="text-muted-foreground">
              Track your daily progress and blockers
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" disabled={hasTodayStandup}>
                <Plus className="w-4 h-4 mr-2" />
                {hasTodayStandup ? "Standup Submitted" : "Add Today's Standup"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Daily Standup</DialogTitle>
                <DialogDescription>
                  Share your progress and any blockers for {format(new Date(), "MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    What did you accomplish yesterday?
                  </Label>
                  <Textarea
                    placeholder="Describe your accomplishments..."
                    value={newStandup.yesterday}
                    onChange={(e) => setNewStandup({ ...newStandup, yesterday: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    What are you working on today?
                  </Label>
                  <Textarea
                    placeholder="Describe your plans for today..."
                    value={newStandup.today}
                    onChange={(e) => setNewStandup({ ...newStandup, today: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Any blockers or challenges?
                  </Label>
                  <Textarea
                    placeholder="Describe any blockers (or leave empty if none)..."
                    value={newStandup.blockers}
                    onChange={(e) => setNewStandup({ ...newStandup, blockers: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gradient" onClick={handleCreateStandup}>
                  Submit Standup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{standups.length}</p>
                <p className="text-xs text-muted-foreground">Total Standups</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hasTodayStandup ? "Done" : "Pending"}</p>
                <p className="text-xs text-muted-foreground">Today's Status</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {standups.filter((s) => s.blockers !== "None").length}
                </p>
                <p className="text-xs text-muted-foreground">With Blockers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Standup Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Standup History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {standups.map((standup, index) => (
                  <div key={standup.id} className="relative">
                    {index < standups.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border" />
                    )}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Avatar className="w-10 h-10 border-2 border-background">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {standup.author.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{standup.author}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(standup.date)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(standup.createdAt), "h:mm a")}
                          </span>
                        </div>
                        
                        <div className="grid gap-3 p-4 rounded-lg bg-muted/50">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium mb-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Yesterday
                            </div>
                            <p className="text-sm text-muted-foreground pl-6">
                              {standup.yesterday}
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium mb-1">
                              <ArrowRight className="w-4 h-4 text-primary" />
                              Today
                            </div>
                            <p className="text-sm text-muted-foreground pl-6">
                              {standup.today}
                            </p>
                          </div>
                          
                          {standup.blockers !== "None" && (
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Blockers
                              </div>
                              <p className="text-sm text-muted-foreground pl-6">
                                {standup.blockers}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminStandups;