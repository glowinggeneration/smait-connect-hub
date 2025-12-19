import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface Activity {
  id: string;
  action: string;
  project: string;
  time: string;
  type: "update" | "message" | "file" | "status";
}

interface ActivityFeedProps {
  activities: Activity[];
}

const typeColors = {
  update: "bg-primary/10 text-primary",
  message: "bg-blue-500/10 text-blue-600",
  file: "bg-amber-500/10 text-amber-600",
  status: "bg-emerald-500/10 text-emerald-600",
};

export const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${typeColors[activity.type].split(" ")[0]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.action}</span>
                  {" in "}
                  <span className="text-primary font-medium">{activity.project}</span>
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
