import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Users, 
  ExternalLink, 
  GripVertical, 
  Phone, 
  Mail, 
  Building2,
  ArrowRight,
  Edit,
  Link as LinkIcon,
  Loader2
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Lead {
  id: string;
  contact_name: string;
  project_description: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  pitch_link: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface LeadAssignee {
  id: string;
  lead_id: string;
  user_id: string;
}

interface AdminProfile {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

const stages = [
  { id: "new", label: "New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { id: "pitched", label: "Pitched", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "negotiating", label: "Negotiating", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "closed_won", label: "Closed Won", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { id: "closed_lost", label: "Closed Lost", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

const LeadsContent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    contact_name: "",
    project_description: "",
    company: "",
    email: "",
    phone: "",
    stage: "new",
    pitch_link: "",
    notes: "",
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const authed = Boolean(data.session);
      setIsAuthed(authed);
      setAuthLoading(false);
      if (!authed) {
        toast.error("Please log in");
        navigate("/login");
      }
    });
    return () => { mounted = false; };
  }, [navigate]);

  const { data: leads, isLoading: leadsLoading, isFetching: leadsFetching } = useQuery({
    queryKey: ["leads", leadsPage],
    enabled: isAuthed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, (leadsPage + 1) * LEADS_PAGE_SIZE - 1);
      if (error) throw error;
      return data as Lead[];
    },
  });

  const hasMoreLeads = (leads?.length || 0) === (leadsPage + 1) * LEADS_PAGE_SIZE;


  const { data: assignees } = useQuery({
    queryKey: ["lead-assignees"],
    enabled: isAuthed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_assignees")
        .select("*");
      if (error) throw error;
      return data as LeadAssignee[];
    },
  });

  const { data: admins } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAuthed,
    queryFn: async () => {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (roleError) throw roleError;

      const adminIds = roleData.map((r) => r.user_id);
      if (adminIds.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", adminIds);
      if (profileError) throw profileError;

      return profiles as AdminProfile[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (leadData: typeof formData & { assignees: string[] }) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data: lead, error } = await supabase
        .from("leads")
        .insert({
          contact_name: leadData.contact_name,
          project_description: leadData.project_description || null,
          company: leadData.company || null,
          email: leadData.email || null,
          phone: leadData.phone || null,
          stage: leadData.stage,
          pitch_link: leadData.pitch_link || null,
          notes: leadData.notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (leadData.assignees.length > 0) {
        const { error: assigneeError } = await supabase
          .from("lead_assignees")
          .insert(leadData.assignees.map((userId) => ({
            lead_id: lead.id,
            user_id: userId,
          })));
        if (assigneeError) throw assigneeError;
      }

      return lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-assignees"] });
      toast.success("Lead added successfully");
      resetForm();
    },
    onError: (err) => {
      console.error("Create lead error:", err);
      toast.error("Failed to add lead");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...leadData }: typeof formData & { id: string; assignees: string[] }) => {
      const { error } = await supabase
        .from("leads")
        .update({
          contact_name: leadData.contact_name,
          project_description: leadData.project_description || null,
          company: leadData.company || null,
          email: leadData.email || null,
          phone: leadData.phone || null,
          stage: leadData.stage,
          pitch_link: leadData.pitch_link || null,
          notes: leadData.notes || null,
        })
        .eq("id", id);

      if (error) throw error;

      await supabase.from("lead_assignees").delete().eq("lead_id", id);
      
      if (leadData.assignees.length > 0) {
        const { error: assigneeError } = await supabase
          .from("lead_assignees")
          .insert(leadData.assignees.map((userId) => ({
            lead_id: id,
            user_id: userId,
          })));
        if (assigneeError) throw assigneeError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-assignees"] });
      toast.success("Lead updated successfully");
      resetForm();
    },
    onError: () => toast.error("Failed to update lead"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-assignees"] });
      toast.success("Lead deleted");
    },
    onError: () => toast.error("Failed to delete lead"),
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ stage })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Stage updated");
    },
    onError: () => toast.error("Failed to update stage"),
  });

  const convertToProjectMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      let clientId: string | null = null;

      // Try to find an existing client profile matching the lead's contact details
      if (lead.email) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", lead.email)
          .maybeSingle();
        clientId = existing?.user_id ?? null;
      }

      // No client record yet — create one from the lead's contact details
      if (!clientId) {
        if (!lead.email) {
          throw new Error("Add an email address to this lead before converting it.");
        }

        const tempPassword = `${crypto.randomUUID().slice(0, 12)}Aa1!`;
        const { data: created, error: createError } = await supabase.functions.invoke(
          "create-client",
          {
            body: {
              email: lead.email,
              password: tempPassword,
              full_name: lead.contact_name,
              company: lead.company || null,
              phone: lead.phone || null,
            },
          }
        );

        if (createError) throw createError;
        if ((created as any)?.error) throw new Error((created as any).error);

        clientId =
          (created as any)?.user?.id ??
          (created as any)?.user_id ??
          (created as any)?.id ??
          null;

        if (!clientId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", lead.email)
            .maybeSingle();
          clientId = profile?.user_id ?? null;
        }

        if (!clientId) throw new Error("Could not create a client record for this lead.");
      }

      const { error } = await supabase.from("projects").insert({
        name: lead.project_description || `Project for ${lead.contact_name}`,
        description: `Converted from lead: ${lead.contact_name}${lead.company ? ` (${lead.company})` : ""}`,
        client_id: clientId,
        status: "in-progress",
      });

      if (error) throw error;

      await supabase.from("leads").delete().eq("id", lead.id);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Lead converted to project!");
      navigate("/admin/work?tab=projects");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to convert lead to project"),
  });

  const resetForm = () => {
    setFormData({
      contact_name: "",
      project_description: "",
      company: "",
      email: "",
      phone: "",
      stage: "new",
      pitch_link: "",
      notes: "",
    });
    setSelectedAssignees([]);
    setEditingLead(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      contact_name: lead.contact_name,
      project_description: lead.project_description || "",
      company: lead.company || "",
      email: lead.email || "",
      phone: lead.phone || "",
      stage: lead.stage,
      pitch_link: lead.pitch_link || "",
      notes: lead.notes || "",
    });
    const leadAssignees = assignees?.filter((a) => a.lead_id === lead.id).map((a) => a.user_id) || [];
    setSelectedAssignees(leadAssignees);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contact_name) {
      toast.error("Please enter contact name");
      return;
    }

    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, ...formData, assignees: selectedAssignees });
    } else {
      createMutation.mutate({ ...formData, assignees: selectedAssignees });
    }
  };

  const getLeadsByStage = (stageId: string) => {
    return leads?.filter((lead) => lead.stage === stageId) || [];
  };

  const getAssigneesForLead = (leadId: string) => {
    const leadAssigneeIds = assignees?.filter((a) => a.lead_id === leadId).map((a) => a.user_id) || [];
    return admins?.filter((admin) => leadAssigneeIds.includes(admin.user_id)) || [];
  };

  if (authLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Manage your sales pipeline</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" disabled={!isAuthed}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Contact Name *</label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Company</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., Acme Inc"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Project Description</label>
                <Input
                  value={formData.project_description}
                  onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                  placeholder="e.g., E-commerce website"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+27..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Stage</label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Pitch Link</label>
                <Input
                  value={formData.pitch_link}
                  onChange={(e) => setFormData({ ...formData, pitch_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Assign To</label>
                <div className="space-y-2">
                  {admins?.map((admin) => (
                    <div key={admin.user_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={admin.user_id}
                        checked={selectedAssignees.includes(admin.user_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAssignees([...selectedAssignees, admin.user_id]);
                          } else {
                            setSelectedAssignees(selectedAssignees.filter((id) => id !== admin.user_id));
                          }
                        }}
                      />
                      <label htmlFor={admin.user_id} className="text-sm cursor-pointer">
                        {admin.full_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingLead ? "Update" : "Add Lead"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Pipeline Kanban */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {stages.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div key={stage.id} className="w-72 flex-shrink-0">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={stage.color}>
                        {stage.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{stageLeads.length}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stageLeads.map((lead) => (
                      <Card key={lead.id} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{lead.contact_name}</p>
                            {lead.company && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {lead.company}
                              </p>
                            )}
                            {lead.project_description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {lead.project_description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(lead)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {lead.contact_name}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(lead.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:text-primary">
                              <Mail className="w-3 h-3" />
                            </a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="text-muted-foreground hover:text-primary">
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                          {lead.pitch_link && (
                            <a href={lead.pitch_link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <LinkIcon className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {stage.id === "closed_won" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2 text-xs"
                            onClick={() => convertToProjectMutation.mutate(lead)}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Convert to Project
                          </Button>
                        )}
                      </Card>
                    ))}
                    {stageLeads.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No leads</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
};

export default LeadsContent;
