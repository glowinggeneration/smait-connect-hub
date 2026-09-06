import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Timeline } from "@/components/ui/timeline";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MessageSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  Send,
  Plus,
  ChevronRight,
  Calendar,
  Target,
  Loader2,
  Upload,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  scope: string[] | null;
  outcome: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

interface Comment {
  id: string;
  milestone_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

interface Attachment {
  id: string;
  milestone_id: string;
  user_id: string;
  type: string;
  url: string;
  title: string | null;
  created_at: string;
}

interface ProjectMilestonesProps {
  projectId: string;
  isAdmin: boolean;
}

const statusConfig = {
  pending: { label: "Not Started", icon: Circle, color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Clock, color: "bg-primary/20 text-primary" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-green-500/20 text-green-500" },
  blocked: { label: "Blocked", icon: AlertCircle, color: "bg-destructive/20 text-destructive" },
};

export const ProjectMilestones = ({ projectId, isAdmin }: ProjectMilestonesProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newLink, setNewLink] = useState({ url: "", title: "" });
  const [submitting, setSubmitting] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchMilestones();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('milestones-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_milestones', filter: `project_id=eq.${projectId}` },
        () => fetchMilestones()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    if (selectedMilestone) {
      fetchComments(selectedMilestone.id);
      fetchAttachments(selectedMilestone.id);
    }
  }, [selectedMilestone]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }) as any;

      if (error) throw error;
      setMilestones(data || []);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (milestoneId: string) => {
    try {
      const { data, error } = await supabase
        .from("milestone_comments")
        .select("*")
        .eq("milestone_id", milestoneId)
        .order("created_at", { ascending: true }) as any;

      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set((data || []).map((c: Comment) => c.user_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const commentsWithNames = (data || []).map((comment: Comment) => ({
        ...comment,
        user_name: profiles?.find((p) => p.user_id === comment.user_id)?.full_name || "Unknown",
      }));

      setComments(commentsWithNames);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      console.error("Error fetching comments:", error);
    }
  };

  const fetchAttachments = async (milestoneId: string) => {
    try {
      const { data, error } = await supabase
        .from("milestone_attachments")
        .select("*")
        .eq("milestone_id", milestoneId)
        .order("created_at", { ascending: false }) as any;

      if (error) throw error;
      setAttachments(data || []);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      console.error("Error fetching attachments:", error);
    }
  };

  const updateMilestoneStatus = async (milestone: Milestone, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { error } = await supabase
        .from("project_milestones")
        .update(updates)
        .eq("id", milestone.id) as any;

      if (error) throw error;

      toast.success("Status Updated", { description: `Milestone marked as ${newStatus}` });
      fetchMilestones();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedMilestone) return;

    setSubmitting(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("milestone_comments")
        .insert({
          milestone_id: selectedMilestone.id,
          user_id: user.id,
          content: newComment.trim(),
        }) as any;

      if (error) throw error;

      setNewComment("");
      fetchComments(selectedMilestone.id);
      toast.success("Comment added");
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const addLink = async () => {
    if (!newLink.url.trim() || !selectedMilestone) return;

    setSubmitting(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("milestone_attachments")
        .insert({
          milestone_id: selectedMilestone.id,
          user_id: user.id,
          type: "link",
          url: newLink.url.trim(),
          title: newLink.title.trim() || newLink.url.trim(),
        }) as any;

      if (error) throw error;

      setNewLink({ url: "", title: "" });
      setLinkDialogOpen(false);
      fetchAttachments(selectedMilestone.id);
      toast.success("Link added");
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedMilestone) return;

    setUploadingImage(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedMilestone.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("milestone-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("milestone-images")
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from("milestone_attachments")
        .insert({
          milestone_id: selectedMilestone.id,
          user_id: user.id,
          type: "image",
          url: publicUrl,
          title: file.name,
        }) as any;

      if (error) throw error;

      fetchAttachments(selectedMilestone.id);
      toast.success("Image uploaded");
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteAttachment = async (attachment: Attachment) => {
    try {
      const { error } = await supabase
        .from("milestone_attachments")
        .delete()
        .eq("id", attachment.id) as any;

      if (error) throw error;

      if (attachment.type === "image") {
        const path = attachment.url.split("/milestone-images/")[1];
        if (path) {
          await supabase.storage.from("milestone-images").remove([path]);
        }
      }

      fetchAttachments(selectedMilestone!.id);
      toast.success("Attachment removed");
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    }
  };

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const overallProgress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          No milestones found for this project.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>Milestones Progress</span>
            <Badge variant="outline">{completedCount} / {milestones.length} Completed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{overallProgress}% Complete</p>
        </CardContent>
      </Card>

      {/* Phase timeline strip */}
      <Card>
        <CardContent className="py-6 overflow-x-auto">
          <Timeline.Root horizontal className="min-w-max">
            {milestones.map((milestone, index) => {
              const tone =
                milestone.status === "completed" ? "stable"
                : milestone.status === "in_progress" ? "active"
                : milestone.status === "blocked" ? "risk"
                : "default";
              const MarkerIcon =
                milestone.status === "completed" ? CheckCircle2
                : milestone.status === "in_progress" ? Clock
                : milestone.status === "blocked" ? AlertCircle
                : Circle;

              return (
                <Timeline.Item
                  key={milestone.id}
                  horizontal
                  tone={tone}
                  marker={<MarkerIcon />}
                  start={milestone.due_date ? format(new Date(milestone.due_date), "dd MMM") : `Phase ${index + 1}`}
                  last={index === milestones.length - 1}
                >
                  {milestone.title}
                </Timeline.Item>
              );
            })}
          </Timeline.Root>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const status = statusConfig[milestone.status as keyof typeof statusConfig] || statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <Card key={milestone.id} className="overflow-hidden">
              <div className="flex">
                {/* Timeline indicator */}
                <div className="w-16 flex flex-col items-center py-4 bg-muted/30">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Milestone {index + 1}: {milestone.title}</h3>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      
                      {milestone.due_date && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {format(new Date(milestone.due_date), "dd MMM yyyy")}
                        </p>
                      )}

                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-2">{milestone.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <select
                          value={milestone.status}
                          onChange={(e) => updateMilestoneStatus(milestone, e.target.value)}
                          className="text-sm bg-background border border-input rounded-md px-2 py-1"
                        >
                          <option value="pending">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      )}

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMilestone(milestone)}
                          >
                            Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle className="flex items-center gap-2">
                              <Target className="w-5 h-5 text-primary" />
                              {milestone.title}
                            </SheetTitle>
                          </SheetHeader>

                          <div className="space-y-6 mt-6">
                            {/* Status & Due Date */}
                            <div className="flex items-center gap-4">
                              <Badge className={status.color}>{status.label}</Badge>
                              {milestone.due_date && (
                                <span className="text-sm text-muted-foreground">
                                  Due: {format(new Date(milestone.due_date), "dd MMM yyyy")}
                                </span>
                              )}
                              {milestone.completed_at && (
                                <span className="text-sm text-green-500">
                                  Completed: {format(new Date(milestone.completed_at), "dd MMM yyyy")}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {milestone.description && (
                              <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                              </div>
                            )}

                            {/* Scope */}
                            {milestone.scope && milestone.scope.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Scope</h4>
                                <ul className="space-y-1">
                                  {milestone.scope.map((item, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Outcome */}
                            {milestone.outcome && (
                              <div>
                                <h4 className="font-medium mb-2">Expected Outcome</h4>
                                <p className="text-sm text-muted-foreground bg-primary/10 p-3 rounded-lg">
                                  {milestone.outcome}
                                </p>
                              </div>
                            )}

                            {/* Attachments */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">Attachments</h4>
                                {isAdmin && (
                                  <div className="flex items-center gap-2">
                                    <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <LinkIcon className="w-4 h-4 mr-1" />
                                          Add Link
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Add Link</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <Input
                                            placeholder="URL"
                                            value={newLink.url}
                                            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                                          />
                                          <Input
                                            placeholder="Title (optional)"
                                            value={newLink.title}
                                            onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                                          />
                                          <Button onClick={addLink} disabled={submitting || !newLink.url.trim()}>
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Link"}
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>

                                    <label>
                                      <Button variant="outline" size="sm" asChild disabled={uploadingImage}>
                                        <span>
                                          {uploadingImage ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <>
                                              <ImageIcon className="w-4 h-4 mr-1" />
                                              Add Image
                                            </>
                                          )}
                                        </span>
                                      </Button>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={uploadImage}
                                        disabled={uploadingImage}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>

                              {attachments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No attachments yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                                    >
                                      {attachment.type === "image" ? (
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm hover:text-primary"
                                        >
                                          <img
                                            src={attachment.url}
                                            alt={attachment.title || ""}
                                            className="w-10 h-10 object-cover rounded"
                                          />
                                          {attachment.title}
                                        </a>
                                      ) : (
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm hover:text-primary"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                          {attachment.title || attachment.url}
                                        </a>
                                      )}
                                      {isAdmin && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => deleteAttachment(attachment)}
                                        >
                                          <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Comments */}
                            <div>
                              <h4 className="font-medium mb-2">Comments</h4>
                              <ScrollArea className="h-48 border rounded-lg p-3">
                                {comments.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No comments yet</p>
                                ) : (
                                  <div className="space-y-3">
                                    {comments.map((comment) => (
                                      <div key={comment.id} className="flex items-start gap-2">
                                        <Avatar className="w-8 h-8">
                                          <AvatarFallback>
                                            {comment.user_name?.charAt(0) || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{comment.user_name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {format(new Date(comment.created_at), "dd MMM, HH:mm")}
                                            </span>
                                          </div>
                                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </ScrollArea>

                              <div className="flex items-center gap-2 mt-3">
                                <Textarea
                                  placeholder="Add a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="min-h-[60px]"
                                />
                                <Button
                                  size="icon"
                                  onClick={addComment}
                                  disabled={submitting || !newComment.trim()}
                                >
                                  {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
