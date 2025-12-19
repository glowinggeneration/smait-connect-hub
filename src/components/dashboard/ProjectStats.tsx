import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Clock, MoreHorizontal } from "lucide-react";

interface ProjectStatsProps {
  title: string;
  status: string;
  completed: number;
  inProgress: number;
  team: { name: string }[];
}

export const ProjectStats = ({ title, status, completed, inProgress, team }: ProjectStatsProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{status}</span>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mt-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{completed}</span>
              <span className="text-xs text-smait-teal">•</span>
            </div>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{inProgress}</span>
              <span className="text-xs text-primary">•</span>
            </div>
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <div className="ml-auto">
            <span className="text-xs text-muted-foreground block mb-2">Team members</span>
            <AvatarStack avatars={team} size="md" max={3} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
