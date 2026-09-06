import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileImage, FileText, Search, 
  Download, Loader2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { FolderPreview } from "@/components/ui/folder-preview";

interface Asset {
  id: string;
  name: string;
  type: "image" | "document" | "prompt" | "template" | "deliverable";
  url: string;
  category: string;
  createdAt: string;
  projectName?: string;
}

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      
      const [
        { data: briefDocs },
        { data: milestoneAttachments },
      ] = await Promise.all([
        supabase.from("brief_documents").select("*, project_briefs(title)"),
        supabase.from("milestone_attachments").select("*, project_milestones(title, projects(name))"),
      ]);

      const allAssets: Asset[] = [];

      briefDocs?.forEach(doc => {
        allAssets.push({
          id: doc.id,
          name: doc.file_name,
          type: doc.file_name.match(/\.(jpg|jpeg|png|gif|svg)$/i) ? "image" : "document",
          url: doc.file_path,
          category: "Brief Documents",
          createdAt: doc.created_at,
          projectName: doc.project_briefs?.title,
        });
      });

      milestoneAttachments?.forEach(att => {
        allAssets.push({
          id: att.id,
          name: att.title || "Untitled",
          type: att.type === "image" ? "image" : "deliverable",
          url: att.url,
          category: "Deliverables",
          createdAt: att.created_at,
          projectName: att.project_milestones?.projects?.name,
        });
      });

      setAssets(allAssets);
      setLoading(false);
    };

    fetchAssets();
  }, []);

  const handleDownload = async (asset: Asset) => {
    try {
      let href = asset.url;
      if (!/^https?:\/\//i.test(href)) {
        const { data, error } = await supabase.storage
          .from("brief-documents")
          .createSignedUrl(href, 60);
        if (error) throw error;
        href = data.signedUrl;
      }
      const link = document.createElement("a");
      link.href = href;
      link.download = asset.name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not open this file";
      toast.error(message);
    }
  };

  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const collections = Array.from(
    assets.reduce((map, asset) => {
      const key = asset.projectName || asset.category;
      const bucket = map.get(key) ?? [];
      bucket.push(asset);
      map.set(key, bucket);
      return map;
    }, new Map<string, Asset[]>())
  ).sort((a, b) => b[1].length - a[1].length);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFolder =
      !activeFolder || (asset.projectName || asset.category) === activeFolder;
    if (activeTab === "all") return matchesSearch && matchesFolder;
    return matchesSearch && matchesFolder && asset.type === activeTab;
  });

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
            <p className="text-sm text-muted-foreground">
              Reusable resources across initiatives
            </p>
          </div>

        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {!loading && collections.length > 0 && (
          <div className="panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Collections
              </p>
              {activeFolder && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveFolder(null)}
                >
                  Clear filter
                </Button>
              )}
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {collections.map(([name, items]) => (
                  <FolderPreview
                    key={name}
                    label={name}
                    meta={`${items.length} item${items.length === 1 ? "" : "s"}`}
                    items={items.map((i) => i.name)}
                    count={items.length}
                    tone={activeFolder === name ? "active" : "neutral"}
                    selected={activeFolder === name}
                    className="shrink-0"
                    onClick={() =>
                      setActiveFolder((current) => (current === name ? null : name))
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="image" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Images
            </TabsTrigger>
            <TabsTrigger 
              value="document" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="deliverable" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
            >
              Deliverables
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="panel">
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-3 opacity-50" />
                  <p className="text-sm">No assets found</p>
                </div>
              </div>
            ) : (
              <div className="panel">
                <ScrollArea className="h-[480px]">
                  <div className="divide-y divide-border">
                    {filteredAssets.map(asset => (
                      <div
                        key={asset.id}
                        className="ledger-row cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {asset.type === "image" ? (
                            <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {asset.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {asset.projectName || asset.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground capitalize">
                            {asset.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(asset.createdAt), "MMM d, yyyy")}
                          </span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDownload(asset)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Assets;
