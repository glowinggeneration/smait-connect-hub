import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, parseISO } from "date-fns";
import { Clock, Video, MapPin, Phone, Loader2 } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  duration: number;
  type: string;
  location: string | null;
  status: string;
}

const ClientCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
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

  const meetingsOnSelectedDate = selectedDate
    ? meetings.filter((m) => isSameDay(parseISO(m.date), selectedDate))
    : [];

  const datesWithMeetings = meetings.map((m) => parseISO(m.date));

  if (loading) {
    return (
      <DashboardLayout userType="client">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="client">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            View your scheduled meetings with the team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  hasMeeting: datesWithMeetings,
                }}
                modifiersStyles={{
                  hasMeeting: {
                    fontWeight: "bold",
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                    color: "hsl(var(--primary))",
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Meetings for Selected Date */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? format(selectedDate, "EEEE, MMMM d, yyyy")
                  : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetingsOnSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {meetingsOnSelectedDate.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-4 rounded-lg border bg-muted/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {getTypeIcon(meeting.type)}
                          <span className="ml-1 capitalize">{meeting.type}</span>
                        </Badge>
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground">
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No meetings scheduled for this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>All Upcoming Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.filter((m) => m.status === "upcoming").length > 0 ? (
              <div className="space-y-3">
                {meetings
                  .filter((m) => m.status === "upcoming")
                  .map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedDate(parseISO(meeting.date))}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {format(parseISO(meeting.date), "d")}
                        </div>
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(meeting.date), "EEE, MMM d")} at{" "}
                            {meeting.time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {getTypeIcon(meeting.type)}
                        <span className="ml-1 capitalize">{meeting.type}</span>
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming meetings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientCalendar;