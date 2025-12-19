import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Globe,
  Smartphone,
  Monitor,
  Bot,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  FileText,
  Calendar,
  User,
  Download,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BriefDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
}

interface Brief {
  id: string;
  title: string;
  description: string | null;
  category: string;
  deadline: string | null;
  status: string;
  created_at: string;
  client_id: string;
  client?: { full_name: string; email: string; company: string | null };
  documents?: BriefDocument[];
}

const categoryIcons: Record<string, typeof Globe> = {
  website: Globe,
  software: Monitor,
  app: Smartphone,
  "ai-automation": Bot,
};

const categoryLabels: Record<string, string> = {
  website: "Website",
  software: "Software",
  app: "Mobile App",
  "ai-automation": "AI Automation",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const AdminBriefs = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null);

  useEffect(() => {
    fetchBriefs();
  }, []);

  const fetchBriefs = async () => {
    try {
      // Fetch briefs
      const { data: briefsData, error: briefsError } = await supabase
        .from("project_briefs")
        .select("*")
        .order("created_at", { ascending: false });

      if (briefsError) throw briefsError;

      // Fetch client profiles and documents for each brief
      const briefsWithDetails = await Promise.all(
        (briefsData || []).map(async (brief) => {
          // Get client profile
          const { data: clientData } = await supabase
            .from("profiles")
            .select("full_name, email, company")
            .eq("user_id", brief.client_id)
            .maybeSingle();

          // Get documents
          const { data: docsData } = await supabase
            .from("brief_documents")
            .select("*")
            .eq("brief_id", brief.id);

          return {
            ...brief,
            client: clientData,
            documents: docsData || [],
          };
        })
      );

      setBriefs(briefsWithDetails);
    } catch (error) {
      console.error("Error fetching briefs:", error);
      toast.error("Failed to load briefs");
    } finally {
      setLoading(false);
    }
  };

  const updateBriefStatus = async (briefId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("project_briefs")
        .update({ status })
        .eq("id", briefId);

      if (error) throw error;

      setBriefs((prev) =>
        prev.map((brief) =>
          brief.id === briefId ? { ...brief, status } : brief
        )
      );

      toast.success(`Brief ${status === "approved" ? "approved" : "rejected"} successfully`);
    } catch (error) {
      console.error("Error updating brief:", error);
      toast.error("Failed to update brief status");
    }
  };

  const downloadDocument = async (doc: BriefDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("brief-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const CategoryIcon = ({ category }: { category: string }) => {
    const Icon = categoryIcons[category] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Briefs</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage client project submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", count: briefs.filter((b) => b.status === "pending").length, color: "text-amber-600" },
            { label: "Approved", count: briefs.filter((b) => b.status === "approved").length, color: "text-emerald-600" },
            { label: "Rejected", count: briefs.filter((b) => b.status === "rejected").length, color: "text-red-600" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Briefs List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading briefs...</div>
        ) : briefs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No briefs submitted yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {briefs.map((brief) => (
              <Collapsible
                key={brief.id}
                open={expandedBrief === brief.id}
                onOpenChange={() =>
                  setExpandedBrief(expandedBrief === brief.id ? null : brief.id)
                }
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <CategoryIcon category={brief.category} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{brief.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <User className="w-3 h-3" />
                              {brief.client?.full_name || "Unknown Client"}
                              {brief.client?.company && (
                                <span className="text-muted-foreground/60">
                                  • {brief.client.company}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={statusColors[brief.status]}>
                            {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                          </Badge>
                          <Badge variant="secondary">
                            {categoryLabels[brief.category]}
                          </Badge>
                          {expandedBrief === brief.id ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-medium">
                            {format(new Date(brief.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Deadline</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {brief.deadline
                              ? format(new Date(brief.deadline), "MMM d, yyyy")
                              : "Not specified"}
                          </p>
                        </div>
                      </div>

                      {brief.description && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Description</p>
                          <p className="text-sm bg-muted/50 p-3 rounded-lg">
                            {brief.description}
                          </p>
                        </div>
                      )}

                      {brief.documents && brief.documents.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Attached Documents ({brief.documents.length})
                          </p>
                          <div className="space-y-2">
                            {brief.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">{doc.file_name}</p>
                                    {doc.file_size && (
                                      <p className="text-xs text-muted-foreground">
                                        {(doc.file_size / 1024).toFixed(1)} KB
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadDocument(doc)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {brief.status === "pending" && (
                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => updateBriefStatus(brief.id, "rejected")}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            variant="gradient"
                            className="flex-1"
                            onClick={() => updateBriefStatus(brief.id, "approved")}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminBriefs;