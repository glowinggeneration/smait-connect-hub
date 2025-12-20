import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Star, Wrench, Trash2, Edit } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: string;
  rating: number;
  created_by: string;
  created_at: string;
}

const categories = [
  "Design",
  "Development",
  "Project Management",
  "Communication",
  "Analytics",
  "Marketing",
  "AI & Automation",
  "Other"
];

const AdminTools = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    rating: 0
  });

  const { data: tools, isLoading } = useQuery({
    queryKey: ["admin-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Tool[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (toolData: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tools").insert({
        name: toolData.name,
        description: toolData.description || null,
        category: toolData.category,
        rating: toolData.rating,
        created_by: user.id
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      toast.success("Tool added successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to add tool")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...toolData }: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("tools")
        .update({
          name: toolData.name,
          description: toolData.description || null,
          category: toolData.category,
          rating: toolData.rating
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      toast.success("Tool updated successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to update tool")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tools").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      toast.success("Tool deleted");
    },
    onError: () => toast.error("Failed to delete tool")
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", category: "", rating: 0 });
    setEditingTool(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Please fill in required fields");
      return;
    }

    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description || "",
      category: tool.category,
      rating: tool.rating
    });
    setIsDialogOpen(true);
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:text-yellow-500" : ""}`}
            onClick={() => interactive && onChange?.(star)}
          />
        ))}
      </div>
    );
  };

  const groupedTools = tools?.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tools & Resources</h1>
          <p className="text-muted-foreground text-sm">Manage and rate the tools your team uses</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Tool</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTool ? "Edit Tool" : "Add New Tool"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tool Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Figma, VS Code, Slack"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Category *</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Description / Use</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What do you use this tool for?"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                {renderStars(formData.rating, true, (r) => setFormData({ ...formData, rating: r }))}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingTool ? "Update" : "Add Tool"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : tools?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No tools added yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start adding the tools your team uses</p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Tool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedTools && Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">{category}</Badge>
                <span className="text-sm text-muted-foreground font-normal">
                  {categoryTools.length} tool{categoryTools.length !== 1 ? "s" : ""}
                </span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool) => (
                  <Card key={tool.id} className="group hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tool)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive" 
                            onClick={() => deleteMutation.mutate(tool.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {renderStars(tool.rating)}
                    </CardHeader>
                    <CardContent>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTools;
