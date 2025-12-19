import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ExternalLink
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: "video" | "in-person" | "phone";
  attendees: string[];
  location: string;
  status: "upcoming" | "completed" | "cancelled";
}

const initialMeetings: Meeting[] = [
  {
    id: "1",
    title: "Project Kickoff - TechCorp",
    description: "Initial meeting to discuss project requirements and timeline",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "14:00",
    duration: 60,
    type: "video",
    attendees: ["John Smith", "Sarah Johnson"],
    location: "Google Meet",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Design Review",
    description: "Review the latest design mockups for the e-commerce platform",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "16:30",
    duration: 45,
    type: "video",
    attendees: ["Design Team", "John Smith"],
    location: "Zoom",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Weekly Team Sync",
    description: "Regular team sync to discuss progress and blockers",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "10:00",
    duration: 30,
    type: "video",
    attendees: ["Team"],
    location: "Google Meet",
    status: "upcoming",
  },
  {
    id: "4",
    title: "Client Presentation - FinanceHub",
    description: "Present the final deliverables to the client",
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    time: "11:00",
    duration: 90,
    type: "in-person",
    attendees: ["Sarah Johnson", "Mike Brown"],
    location: "Conference Room A",
    status: "upcoming",
  },
  {
    id: "5",
    title: "Sprint Planning",
    description: "Plan tasks for the next sprint",
    date: format(addDays(new Date(), -1), "yyyy-MM-dd"),
    time: "09:00",
    duration: 60,
    type: "video",
    attendees: ["Development Team"],
    location: "Zoom",
    status: "completed",
  },
];

const AdminMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "60",
    type: "video" as Meeting["type"],
    attendees: "",
    location: "",
  });

  const upcomingMeetings = meetings.filter((m) => m.status === "upcoming");
  const pastMeetings = meetings.filter((m) => m.status === "completed");
  const todayMeetings = upcomingMeetings.filter((m) => isToday(new Date(m.date)));

  const handleCreateMeeting = () => {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, date, and time.",
        variant: "destructive",
      });
      return;
    }

    const meeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title: newMeeting.title,
      description: newMeeting.description,
      date: newMeeting.date,
      time: newMeeting.time,
      duration: parseInt(newMeeting.duration),
      type: newMeeting.type,
      attendees: newMeeting.attendees.split(",").map((a) => a.trim()).filter(Boolean),
      location: newMeeting.location || (newMeeting.type === "video" ? "Google Meet" : "TBD"),
      status: "upcoming",
    };

    setMeetings([meeting, ...meetings]);
    setNewMeeting({
      title: "",
      description: "",
      date: "",
      time: "",
      duration: "60",
      type: "video",
      attendees: "",
      location: "",
    });
    setIsDialogOpen(false);
    toast({
      title: "Meeting Scheduled",
      description: `${meeting.title} has been added to your calendar.`,
    });
  };

  const deleteMeeting = (id: string) => {
    setMeetings(meetings.filter((m) => m.id !== id));
    toast({
      title: "Meeting Deleted",
      description: "The meeting has been removed.",
    });
  };

  const getTypeIcon = (type: Meeting["type"]) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "in-person":
        return <MapPin className="w-4 h-4" />;
      case "phone":
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatMeetingDate = (date: string) => {
    const meetingDate = new Date(date);
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
                  isToday(new Date(meeting.date)) 
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
                {meeting.time} ({meeting.duration} min)
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {meeting.location}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {meeting.attendees.length} attendees
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
              {meeting.type === "video" && (
                <DropdownMenuItem>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Meeting
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
        {meeting.attendees.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <div className="flex -space-x-2">
              {meeting.attendees.slice(0, 4).map((attendee, i) => (
                <Avatar key={i} className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {attendee.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {meeting.attendees.join(", ")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Meetings</h1>
            <p className="text-muted-foreground">
              Schedule and manage your meetings
            </p>
          </div>

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
                  Create a new meeting and invite attendees.
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
                      onValueChange={(value: Meeting["type"]) =>
                        setNewMeeting({ ...newMeeting, type: value })
                      }
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
                  <Label htmlFor="attendees">Attendees</Label>
                  <Input
                    id="attendees"
                    placeholder="Names separated by commas"
                    value={newMeeting.attendees}
                    onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location / Link</Label>
                  <Input
                    id="location"
                    placeholder="Meeting room or video link"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gradient" onClick={handleCreateMeeting}>
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
                <p className="text-2xl font-bold">{todayMeetings.length}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
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
                <Video className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {meetings.filter((m) => m.type === "video").length}
                </p>
                <p className="text-xs text-muted-foreground">Video Calls</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastMeetings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">No upcoming meetings</h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule a meeting to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastMeetings.length > 0 ? (
              <div className="space-y-4">
                {pastMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-1">No past meetings</h3>
                  <p className="text-sm text-muted-foreground">
                    Your completed meetings will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminMeetings;