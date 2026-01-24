import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileImage, FileText, Palette, Upload, Search, 
  FolderOpen, Download, Loader2, Package, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
      
      // Fetch from multiple sources
      const [
        { data: briefDocs },
        { data: milestoneAttachments },
      ] = await Promise.all([
        supabase.from("brief_documents").select("*, project_briefs(title)"),
        supabase.from("milestone_attachments").select("*, project_milestones(title, projects(name))"),
      ]);

      const allAssets: Asset[] = [];

      // Map brief documents
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

      // Map milestone attachments
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

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && asset.type === activeTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return FileImage;
      case "document": return FileText;
      case "template": return Package;
      case "deliverable": return Star;
      default: return FolderOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "image": return "bg-blue-500/20 text-blue-400";
      case "document": return "bg-green-500/20 text-green-400";
      case "template": return "bg-purple-500/20 text-purple-400";
      case "deliverable": return "bg-amber-500/20 text-amber-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
              <p className="text-muted-foreground text-sm">
                Reusable resources across all initiatives
              </p>
            </div>
          </div>

          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Asset
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/30 border border-white/10 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
              All
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-white/10">
              Images
            </TabsTrigger>
            <TabsTrigger value="document" className="data-[state=active]:bg-white/10">
              Documents
            </TabsTrigger>
            <TabsTrigger value="deliverable" className="data-[state=active]:bg-white/10">
              Deliverables
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No assets found</p>
                  <Button variant="outline" className="mt-4 gap-2">
                    <Upload className="h-4 w-4" />
                    Upload your first asset
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssets.map(asset => {
                  const Icon = getTypeIcon(asset.type);
                  return (
                    <Card
                      key={asset.id}
                      className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all cursor-pointer group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                            getTypeColor(asset.type)
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {asset.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {asset.projectName || asset.category}
                            </p>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs capitalize">
                            {asset.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(asset.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Assets;
