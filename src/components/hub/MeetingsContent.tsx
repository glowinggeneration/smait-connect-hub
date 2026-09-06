import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { 
  Plus, 
  Calendar, 
  Clock, 
  Video, 
  Users, 
  MapPin,
  MoreHorizontal,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  duration: number;
  type: string;
  location: string | null;
  meeting_link: string | null;
  client_id: string;
  status: string;
}

interface Client {
  user_id: string;
  full_name: string;
  company: string | null;
}

const MeetingsContent = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "60",
    type: "video",
    client_id: "",
    location: "",
    meeting_link: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("meetings")
        .select("*")
        .order("date", { ascending: true });

      if (meetingsError) throw meetingsError;
      setMeetings(meetingsData || []);

      const { data: clientsData, error: clientsError } = await supabase
        .from("profiles")
        .select("user_id, full_name, company");

      if (clientsError) throw clientsError;
      setClients(clientsData || []);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const upcomingMeetings = meetings.filter((m) => m.status === "upcoming");
  const pastMeetings = meetings.filter((m) => m.status === "completed");
  const todayMeetings = upcomingMeetings.filter((m) => isToday(parseISO(m.date)));

  const handleCreateMeeting = async () => {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time || !newMeeting.client_id) {
      toast.error("Missing Information", { description: "Please fill in title, date, time, and select a client." });
      return;
    }

    setIsCreating(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("meetings")
        .insert({
          title: newMeeting.title,
          description: newMeeting.description || null,
          date: newMeeting.date,
          time: newMeeting.time,
          duration: parseInt(newMeeting.duration),
          type: newMeeting.type,
          client_id: newMeeting.client_id,
          created_by: user.id,
          location: newMeeting.location || (newMeeting.type === "video" ? "Video Call" : null),
          meeting_link: newMeeting.meeting_link || null,
          status: "upcoming",
        })
        .select()
        .single();

      if (error) throw error;

      setMeetings([data, ...meetings]);
      setNewMeeting({
        title: "",
        description: "",
        date: "",
        time: "",
        duration: "60",
        type: "video",
        client_id: "",
        location: "",
        meeting_link: "",
      });
      setIsDialogOpen(false);
      toast.success("Meeting Scheduled", { description: `${data.title} has been added to the calendar.` });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMeetings(meetings.filter((m) => m.id !== id));
      toast.success("Meeting Deleted", { description: "The meeting has been removed." });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.user_id === clientId);
    return client?.full_name || "Unknown Client";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "in-person":
        return <MapPin className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatMeetingDate = (date: string) => {
    const meetingDate = parseISO(date);
    if (isToday(meetingDate)) return "Today";
    if (isTomorrow(meetingDate)) return "Tomorrow";
    return format(meetingDate, "EEE, MMM d");
  };

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getTypeIcon(meeting.type)}
                <span className="ml-1 capitalize">{meeting.type}</span>
              </Badge>
              <Badge 
                className={`text-xs ${
                  isToday(parseISO(meeting.date)) 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {formatMeetingDate(meeting.date)}
              </Badge>
            </div>
            <h3 className="font-semibold mb-1">{meeting.title}</h3>
            {meeting.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {meeting.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {meeting.time.slice(0, 5)} ({meeting.duration} min)
              </div>
              {meeting.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {meeting.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {getClientName(meeting.client_id)}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {meeting.type === "video" && meeting.meeting_link && (
                <DropdownMenuItem asChild>
                  <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Meeting
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => deleteMeeting(meeting.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Avatar className="w-8 h-8 border-2 border-background">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getClientName(meeting.client_id).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {getClientName(meeting.client_id)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-muted-foreground">
          Schedule and manage client meetings
        </p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                Create a new meeting with a client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter meeting title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={newMeeting.client_id}
                  onValueChange={(value) => setNewMeeting({ ...newMeeting, client_id: value })}
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Meeting agenda or notes"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={newMeeting.duration}
                    onValueChange={(value) => setNewMeeting({ ...newMeeting, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newMeeting.type}
                    onValueChange={(value) => setNewMeeting({ ...newMeeting, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Meeting room or address"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                />
              </div>
              {newMeeting.type === "video" && (
                <div className="space-y-2">
                  <Label htmlFor="meeting_link">Meeting Link</Label>
                  <Input
                    id="meeting_link"
                    placeholder="https://meet.google.com/... or Zoom/Teams link"
                    value={newMeeting.meeting_link}
                    onChange={(e) => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste your Google Meet, Zoom, or Teams meeting link
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleCreateMeeting} disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Schedule Meeting
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
              <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayMeetings.length}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Video className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pastMeetings.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meetings Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastMeetings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMeetings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No upcoming meetings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule a meeting to get started
                </p>
                <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastMeetings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pastMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No past meetings</h3>
                <p className="text-sm text-muted-foreground">
                  Completed meetings will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MeetingsContent;
