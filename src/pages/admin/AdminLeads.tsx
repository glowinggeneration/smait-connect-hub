import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
  Link as LinkIcon
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

const AdminLeads = () => {
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

  // Fetch leads
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    enabled: isAuthed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Fetch lead assignees
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

  // Fetch admin users
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
      const { data: { user } } = await supabase.auth.getUser();
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

      // Add assignees
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

      // Update assignees - delete existing and re-add
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the project
      const { error } = await supabase.from("projects").insert({
        name: lead.project_description || `Project for ${lead.contact_name}`,
        description: `Converted from lead: ${lead.contact_name}${lead.company ? ` (${lead.company})` : ""}`,
        client_id: user.id, // Will need to be updated to actual client
        status: "in-progress",
      });

      if (error) throw error;

      // Delete the lead
      await supabase.from("leads").delete().eq("id", lead.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Lead converted to project!");
      navigate("/admin/projects");
    },
    onError: () => toast.error("Failed to convert lead to project"),
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

  if (authLoading) {
    return (
      <DashboardLayout userType="admin">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <section className="space-y-6 animate-fade-in">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Leads Pipeline</h1>
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
                  <Button type="submit" className="flex-1" disabled={!isAuthed}>
                    {editingLead ? "Update" : "Add Lead"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        {/* Pipeline View */}
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {stages.map((stage) => {
              const stageLeads = getLeadsByStage(stage.id);
              return (
                <div key={stage.id} className="w-72 flex-shrink-0">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge className={stage.color}>{stage.label}</Badge>
                    <span className="text-sm text-muted-foreground">{stageLeads.length}</span>
                  </div>
                  <div className="space-y-3">
                    {stageLeads.map((lead) => {
                      const leadAssignees = getAssigneesForLead(lead.id);
                      return (
                        <Card key={lead.id} className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-semibold text-sm">{lead.contact_name}</h4>
                                {lead.company && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building2 className="w-3 h-3" />
                                    {lead.company}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(lead)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this lead? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteMutation.mutate(lead.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>

                            {lead.project_description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{lead.project_description}</p>
                            )}

                            <div className="flex flex-wrap gap-2 text-xs">
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                                  <Mail className="w-3 h-3" />
                                </a>
                              )}
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                                  <Phone className="w-3 h-3" />
                                </a>
                              )}
                              {lead.pitch_link && (
                                <a href={lead.pitch_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                                  <LinkIcon className="w-3 h-3" />
                                  Pitch
                                </a>
                              )}
                            </div>

                            {leadAssignees.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                {leadAssignees.map((a) => a.full_name.split(" ")[0]).join(", ")}
                              </div>
                            )}

                            {/* Stage Move Buttons */}
                            <div className="flex gap-1 pt-2">
                              <Select
                                value={lead.stage}
                                onValueChange={(newStage) => updateStageMutation.mutate({ id: lead.id, stage: newStage })}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {stages.map((s) => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs">
                                      {s.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {lead.stage === "closed_won" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => convertToProjectMutation.mutate(lead)}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  Project
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center text-muted-foreground text-sm">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>
    </DashboardLayout>
  );
};

export default AdminLeads;
