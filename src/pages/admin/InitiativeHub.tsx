import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Timeline } from "@/components/ui/timeline";
import { ProjectMilestones } from "@/components/projects/ProjectMilestones";
import { ProjectProgressSlider } from "@/components/projects/ProjectProgressSlider";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft, CalendarDays, CheckCircle2, Circle, Clock, Download, FileText,
  Loader2, Plus, Trash2, Upload, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Initiative {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  current_phase: number;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  client_id: string;
}

interface Assignment {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
}

interface InitiativeFile {
  id: string;
  name: string;
  file_path: string;
  mime_type: string | null;
  created_at: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  action_type: string;
  created_at: string;
}

interface MilestoneEntry {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  sort_order: number;
}

const statusTone = (status: string) => {
  if (status === "completed") return "stable" as const;
  if (status === "at_risk" || status === "blocked") return "risk" as const;
  if (status === "in-progress" || status === "in_progress") return "active" as const;
  return "default" as const;
};

const InitiativeHub = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [clientName, setClientName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [people, setPeople] = useState<{ user_id: string; full_name: string }[]>([]);
  const [files, setFiles] = useState<InitiativeFile[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [milestones, setMilestones] = useState<MilestoneEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTask, setNewTask] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [
      { data: project, error },
      { data: taskRows },
      { data: fileRows },
      { data: activityRows },
      { data: milestoneRows },
      { data: profileRows },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).maybeSingle(),
      supabase.from("tasks").select("id, title, status, priority, due_date, assigned_to").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("project_files").select("id, name, file_path, mime_type, created_at").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("activities").select("id, action, action_type, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(25),
      supabase.from("project_milestones").select("id, title, status, due_date, sort_order").eq("project_id", id).order("sort_order"),
      supabase.from("profiles").select("user_id, full_name").order("full_name"),
    ]);

    if (error || !project) {
      setInitiative(null);
      setLoading(false);
      return;
    }

    setInitiative(project as Initiative);
    setAssignments((taskRows as Assignment[]) || []);
    setFiles((fileRows as InitiativeFile[]) || []);
    setActivities((activityRows as ActivityEntry[]) || []);
    setMilestones((milestoneRows as MilestoneEntry[]) || []);
    setPeople(profileRows || []);
    setClientName(
      profileRows?.find(p => p.user_id === project.client_id)?.full_name || "Unassigned"
    );
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProgress = async (value: number) => {
    if (!initiative) return;
    const { error } = await supabase
      .from("projects")
      .update({ progress: value, status: value === 100 ? "completed" : "in-progress" })
      .eq("id", initiative.id);
    if (error) {
      toast.error("Could not save progress");
      return;
    }
    setInitiative({ ...initiative, progress: value });
    toast.success(`Progress saved at ${value}%`);
  };

  const addAssignment = async () => {
    if (!id || !newTask.trim()) return;
    setAddingTask(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Sign in again to add work");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTask.trim(),
          project_id: id,
          created_by: user.id,
          status: "todo",
          priority: "medium",
          due_date: newTaskDue || null,
        })
        .select("id, title, status, priority, due_date, assigned_to")
        .single();
      if (error) throw error;
      setAssignments(prev => [data as Assignment, ...prev]);
      setNewTask("");
      setNewTaskDue("");
      toast.success("Assignment added");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not add this item");
    } finally {
      setAddingTask(false);
    }
  };

  const toggleAssignment = async (task: Assignment) => {
    const next = task.status === "completed" ? "todo" : "completed";
    const { error } = await supabase.from("tasks").update({ status: next }).eq("id", task.id);
    if (error) {
      toast.error("Could not update this item");
      return;
    }
    setAssignments(prev => prev.map(t => (t.id === task.id ? { ...t, status: next } : t)));
  };

  const deleteAssignment = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast.error("Could not remove this item");
      return;
    }
    setAssignments(prev => prev.filter(t => t.id !== taskId));
    toast.success("Assignment removed");
  };

  const uploadFiles = async () => {
    if (!id || pendingFiles.length === 0) {
      toast.error("Choose at least one file");
      return;
    }
    setUploading(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Sign in again to upload");
      for (const file of pendingFiles) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("project-files")
          .upload(path, file, { contentType: file.type || undefined });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("project_files").insert({
          name: file.name,
          file_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
          collection: initiative?.name || "Initiative files",
          project_id: id,
          uploaded_by: user.id,
        });
        if (insErr) throw insErr;
      }
      toast.success("Files added to this initiative");
      setPendingFiles([]);
      setUploadOpen(false);
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file: InitiativeFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("project-files")
        .createSignedUrl(file.file_path, 60);
      if (error) throw error;
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = file.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not open this file");
    }
  };

  const deleteFile = async (file: InitiativeFile) => {
    try {
      await supabase.storage.from("project-files").remove([file.file_path]);
      const { error } = await supabase.from("project_files").delete().eq("id", file.id);
      if (error) throw error;
      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success("File removed");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not remove this file");
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!initiative) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex flex-col items-center justify-center h-96 gap-3 text-muted-foreground">
          <p className="text-sm">This initiative could not be found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/work?tab=initiatives")}>
            Back to Work
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const openAssignments = assignments.filter(t => t.status !== "completed");

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6 max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground"
          onClick={() => navigate("/work?tab=initiatives")}
        >
          <ArrowLeft className="h-4 w-4" />
          Initiatives
        </Button>

        {/* Header */}
        <div className="panel p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight truncate">{initiative.name}</h1>
              {initiative.description && (
                <p className="text-sm text-muted-foreground">{initiative.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {clientName}
                </span>
                {initiative.due_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due {format(new Date(initiative.due_date), "MMM d, yyyy")}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Phase {initiative.current_phase}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="capitalize shrink-0">
              {initiative.status.replace(/[-_]/g, " ")}
            </Badge>
          </div>

          <ProjectProgressSlider value={initiative.progress} onSave={saveProgress} />

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
            <div className="pt-3">
              <p className="text-xs text-muted-foreground">Open assignments</p>
              <p className="text-lg font-semibold">{openAssignments.length}</p>
            </div>
            <div className="pt-3">
              <p className="text-xs text-muted-foreground">Milestones</p>
              <p className="text-lg font-semibold">{milestones.length}</p>
            </div>
            <div className="pt-3">
              <p className="text-xs text-muted-foreground">Files</p>
              <p className="text-lg font-semibold">{files.length}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="timeline">
          <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
            {["timeline", "milestones", "assignments", "files"].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm capitalize"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-6 space-y-6">
            <div className="panel p-5 space-y-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Delivery timeline</p>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones set yet.</p>
              ) : (
                <Timeline.Root>
                  {milestones.map((m, i) => (
                    <Timeline.Item
                      key={m.id}
                      tone={statusTone(m.status)}
                      last={i === milestones.length - 1}
                      marker={
                        m.status === "completed" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )
                      }
                      start={m.due_date ? format(new Date(m.due_date), "MMM d") : "—"}
                    >
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {m.status.replace(/_/g, " ")}
                      </p>
                    </Timeline.Item>
                  ))}
                </Timeline.Root>
              )}
            </div>

            <div className="panel p-5 space-y-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Activity</p>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <ScrollArea className="max-h-80">
                  <Timeline.Root>
                    {activities.map((a, i) => (
                      <Timeline.Item
                        key={a.id}
                        last={i === activities.length - 1}
                        start={format(new Date(a.created_at), "MMM d")}
                      >
                        <p className="text-sm">{a.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.created_at), "HH:mm")}
                        </p>
                      </Timeline.Item>
                    ))}
                  </Timeline.Root>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {/* Milestones */}
          <TabsContent value="milestones" className="mt-6">
            <ProjectMilestones projectId={initiative.id} isAdmin />
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="mt-6 space-y-4">
            <div className="panel p-4 flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Add an assignment for this initiative"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAssignment()}
              />
              <Input
                type="date"
                className="sm:w-44"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
              />
              <Button onClick={addAssignment} disabled={addingTask} className="gap-2">
                {addingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>

            <div className="panel">
              {assignments.length === 0 ? (
                <div className="py-14 text-center text-sm text-muted-foreground">
                  Nothing assigned yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {assignments.map(task => (
                    <div key={task.id} className="ledger-row group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Checkbox
                          checked={task.status === "completed"}
                          onCheckedChange={() => toggleAssignment(task)}
                        />
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm truncate",
                            task.status === "completed" && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {people.find(p => p.user_id === task.assigned_to)?.full_name || "Unassigned"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(task.due_date), "MMM d")}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => deleteAssignment(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload files
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload to {initiative.name}</DialogTitle>
                    <DialogDescription>
                      Files stay attached to this initiative and appear in its folder.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="initiative-files">Files</Label>
                    <Input
                      id="initiative-files"
                      type="file"
                      multiple
                      onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setUploadOpen(false)} disabled={uploading}>
                      Cancel
                    </Button>
                    <Button onClick={uploadFiles} disabled={uploading}>
                      {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Upload
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="panel">
              {files.length === 0 ? (
                <div className="py-14 text-center text-sm text-muted-foreground">
                  No files uploaded yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {files.map(file => (
                    <div key={file.id} className="ledger-row group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(file.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => downloadFile(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InitiativeHub;
