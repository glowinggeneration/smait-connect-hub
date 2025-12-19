import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Calendar, Grid3X3, Plus, Link2, MoreVertical, Clock } from "lucide-react";

interface ScheduleItemProps {
  label: string;
  title: string;
  time: string;
  participants: { name: string }[];
}

export const ScheduleItem = ({ label, title, time, participants }: ScheduleItemProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-primary">{label}</span>
        <Button variant="ghost" size="sm" className="text-primary gap-1 h-auto p-0">
          <Plus className="w-3 h-3" />
          Invite
        </Button>
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="bg-primary rounded-xl p-3 flex items-center justify-between">
        <AvatarStack avatars={participants} size="sm" max={4} />
        <div className="flex items-center gap-3">
          <span className="text-primary-foreground font-mono font-semibold">{time}</span>
          <button className="text-primary-foreground/70 hover:text-primary-foreground">
            <Link2 className="w-4 h-4" />
          </button>
          <button className="text-primary-foreground/70 hover:text-primary-foreground">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface TodayScheduleProps {
  schedules: ScheduleItemProps[];
}

export const TodaySchedule = ({ schedules }: TodayScheduleProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {schedules.map((schedule, index) => (
          <ScheduleItem key={index} {...schedule} />
        ))}
      </CardContent>
    </Card>
  );
};
