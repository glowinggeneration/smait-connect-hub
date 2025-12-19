import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { MoreHorizontal, ChevronLeft, ChevronRight, X, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";

const emojis = ["😊", "✌️", "🎉", "🤩", "😎", "🔥", "⭐", "🚀", "💪", "🎯"];

interface NewTaskFormProps {
  onSubmit?: (title: string, collaborators: string[]) => void;
}

export const NewTaskForm = ({ onSubmit }: NewTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [collaborators, setCollaborators] = useState([
    { name: "Angela", id: "1" },
    { name: "Chris", id: "2" },
  ]);

  const handleSubmit = () => {
    if (title.trim() && onSubmit) {
      onSubmit(title, collaborators.map((c) => c.id));
      setTitle("");
    }
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">New Task</CardTitle>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Task Title</label>
          <Input
            placeholder="Create new..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <button className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2 overflow-hidden">
            {emojis.slice(0, 8).map((emoji) => (
              <button
                key={emoji}
                className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-lg transition-colors"
                onClick={() => setTitle(title + emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Add Collaborators</label>
          <div className="flex items-center gap-2 flex-wrap">
            {collaborators.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-2 py-1"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                  {collab.name.charAt(0)}
                </div>
                <span className="text-sm">{collab.name}</span>
                <button
                  onClick={() => removeCollaborator(collab.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <Button
              size="icon"
              variant="gradient"
              className="rounded-full ml-auto w-10 h-10"
              onClick={handleSubmit}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
