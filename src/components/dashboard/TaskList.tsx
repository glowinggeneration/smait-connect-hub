import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Clock } from "lucide-react";

interface TaskItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  team: { name: string }[];
}

export const TaskItem = ({ icon, iconBg, title, description, team }: TaskItemProps) => {
  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <AvatarStack avatars={team} size="sm" max={3} />
    </div>
  );
};

interface TaskListProps {
  title: string;
  tasks: {
    id: string;
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    team: { name: string }[];
  }[];
}

export const TaskList = ({ title, tasks }: TaskListProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground px-4">{title}</h4>
      <div className="space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            icon={task.icon}
            iconBg={task.iconBg}
            title={task.title}
            description={task.description}
            team={task.team}
          />
        ))}
      </div>
    </div>
  );
};
