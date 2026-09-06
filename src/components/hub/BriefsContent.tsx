import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, FileText, Loader2, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Download
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Brief {
  id: string;
  title: string;
  category: string;
  description: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  client_id: string;
  client_name?: string;
}

interface BriefDocument {
  id: string;
  brief_id: string;
  file_name: string;
  file_path: string;
}

const BriefsContent = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [documents, setDocuments] = useState<Record<string, BriefDocument[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBriefs, setExpandedBriefs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBriefs();
  }, []);

  const fetchBriefs = async () => {
    try {
      const { data: briefsData, error } = await supabase
        .from("project_briefs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch client names
      if (briefsData && briefsData.length > 0) {
        const clientIds = [...new Set(briefsData.map((b) => b.client_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", clientIds);

        const briefsWithClients = briefsData.map((brief) => {
          const client = profiles?.find((p) => p.user_id === brief.client_id);
          return { ...brief, client_name: client?.full_name || "Unknown" };
        });

        setBriefs(briefsWithClients);

        // Fetch documents for all briefs
        const { data: docs } = await supabase
          .from("brief_documents")
          .select("*")
          .in("brief_id", briefsData.map((b) => b.id));

        if (docs) {
          const docsMap: Record<string, BriefDocument[]> = {};
          docs.forEach((doc) => {
            if (!docsMap[doc.brief_id]) docsMap[doc.brief_id] = [];
            docsMap[doc.brief_id].push(doc);
          });
          setDocuments(docsMap);
        }
      }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (briefId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("project_briefs")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", briefId);

      if (error) throw error;

      setBriefs(briefs.map((b) => (b.id === briefId ? { ...b, status: newStatus } : b)));

      const brief = briefs.find((b) => b.id === briefId);
      if (brief) {
        await supabase.from("notifications").insert({
          user_id: brief.client_id,
          title: `Brief ${newStatus === "approved" ? "Approved" : "Rejected"}`,
          message: `Your brief "${brief.title}" has been ${newStatus}.`,
          type: newStatus === "approved" ? "success" : "warning",
        });
      }

      toast.success("Status Updated", { description: `Brief has been ${newStatus}.` });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
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
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    }
  };

  const toggleExpand = (briefId: string) => {
    setExpandedBriefs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(briefId)) {
        newSet.delete(briefId);
      } else {
        newSet.add(briefId);
      }
      return newSet;
    });
  };

  const filteredBriefs = briefs.filter((brief) =>
    brief.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brief.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const briefsByStatus = {
    pending: filteredBriefs.filter((b) => b.status === "pending"),
    approved: filteredBriefs.filter((b) => b.status === "approved"),
    rejected: filteredBriefs.filter((b) => b.status === "rejected"),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/10 text-emerald-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-500">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-500">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search briefs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{briefsByStatus.pending.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{briefsByStatus.approved.length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{briefsByStatus.rejected.length}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {filteredBriefs.length > 0 ? (
            filteredBriefs.map((brief) => (
              <Collapsible
                key={brief.id}
                open={expandedBriefs.has(brief.id)}
                onOpenChange={() => toggleExpand(brief.id)}
              >
                <Card className="hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold">{brief.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {brief.client_name} • {formatDistanceToNow(new Date(brief.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{brief.category}</Badge>
                          {getStatusBadge(brief.status)}
                          {expandedBriefs.has(brief.id) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
                      {brief.description && (
                        <div>
                          <p className="text-sm font-medium mb-1">Description</p>
                          <p className="text-sm text-muted-foreground">{brief.description}</p>
                        </div>
                      )}

                      {brief.deadline && (
                        <div>
                          <p className="text-sm font-medium mb-1">Deadline</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(brief.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {documents[brief.id] && documents[brief.id].length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {documents[brief.id].map((doc) => (
                              <Button
                                key={doc.id}
                                variant="outline"
                                size="sm"
                                onClick={() => downloadDocument(doc)}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                {doc.file_name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {brief.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleStatusChange(brief.id, "approved")}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(brief.id, "rejected")}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-1">No briefs found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search" : "Briefs from clients will appear here"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BriefsContent;
