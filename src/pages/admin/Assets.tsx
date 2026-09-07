import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  FileImage, FileText, Search,
  Download, Loader2, Upload, Trash2, X
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FolderPreview } from "@/components/ui/folder-preview";
import { getCurrentUser } from "@/lib/auth";

interface Asset {
  id: string;
  name: string;
  type: "image" | "document" | "prompt" | "template" | "deliverable";
  url: string;
  category: string;
  createdAt: string;
  projectId?: string | null;
  projectName?: string;
  bucket?: string;
  storagePath?: string;
  uploaded?: boolean;
}

const CATEGORY_PRESETS = [
  "Brand Assets",
  "Deliverables",
  "Contracts",
  "Research",
  "Design",
  "Reference",
];

type SortKey = "recent" | "oldest" | "name";

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadCollection, setUploadCollection] = useState("");
  const [uploadProjectId, setUploadProjectId] = useState("");
  const [initiativeFilter, setInitiativeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);

    const [
      { data: briefDocs },
      { data: milestoneAttachments },
      { data: uploadedFiles },
      { data: projectList },
    ] = await Promise.all([
      supabase.from("brief_documents").select("*, project_briefs(title)"),
      supabase.from("milestone_attachments").select("*, project_milestones(title, project_id, projects(name))"),
      supabase.from("project_files").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name").order("name"),
    ]);

    const allAssets: Asset[] = [];

    uploadedFiles?.forEach(file => {
      allAssets.push({
        id: file.id,
        name: file.name,
        type: file.mime_type?.startsWith("image/") ? "image" : "document",
        url: file.file_path,
        bucket: "project-files",
        storagePath: file.file_path,
        uploaded: true,
        category: file.collection,
        createdAt: file.created_at,
        projectId: file.project_id,
        projectName: (file as { projects?: { name?: string } }).projects?.name || file.collection,
      });
    });

    briefDocs?.forEach(doc => {
      allAssets.push({
        id: doc.id,
        name: doc.file_name,
        type: doc.file_name.match(/\.(jpg|jpeg|png|gif|svg)$/i) ? "image" : "document",
        url: doc.file_path,
        bucket: "brief-documents",
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
        projectId: att.project_milestones?.project_id,
        projectName: att.project_milestones?.projects?.name,
      });
    });

    setProjects(projectList || []);
    setAssets(allAssets);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleUpload = async () => {
    if (pendingFiles.length === 0) {
      toast.error("Choose at least one file");
      return;
    }
    const project = projects.find(p => p.id === uploadProjectId);
    const collection = (uploadCollection.trim() || project?.name || "").trim();
    if (!collection) {
      toast.error("Pick a project or name the folder");
      return;
    }

    setUploading(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("You need to sign in again");

      for (const file of pendingFiles) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(path, file, { contentType: file.type || undefined });
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from("project_files").insert({
          name: file.name,
          file_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
          collection,
          project_id: uploadProjectId || null,
          uploaded_by: user.id,
        });
        if (insertError) throw insertError;
      }

      toast.success(`${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"} added to ${collection}`);
      setPendingFiles([]);
      setUploadCollection("");
      setUploadProjectId("");
      setUploadOpen(false);
      await fetchAssets();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!asset.uploaded || !asset.storagePath) return;
    try {
      await supabase.storage.from("project-files").remove([asset.storagePath]);
      const { error } = await supabase.from("project_files").delete().eq("id", asset.id);
      if (error) throw error;
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      toast.success("File removed");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not remove this file";
      toast.error(message);
    }
  };

  const handleDownload = async (asset: Asset) => {
    try {
      let href = asset.url;
      if (!/^https?:\/\//i.test(href)) {
        const { data, error } = await supabase.storage
          .from(asset.bucket || "brief-documents")
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

  const categories = useMemo(
    () => Array.from(new Set([...CATEGORY_PRESETS, ...assets.map(a => a.category)])).sort(),
    [assets]
  );

  const collections = useMemo(() => Array.from(
    assets.reduce((map, asset) => {
      const key = asset.projectName || asset.category;
      const bucket = map.get(key) ?? [];
      bucket.push(asset);
      map.set(key, bucket);
      return map;
    }, new Map<string, Asset[]>())
  ).sort((a, b) => b[1].length - a[1].length), [assets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = assets.filter(asset => {
      const matchesSearch = !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.category.toLowerCase().includes(q) ||
        (asset.projectName?.toLowerCase().includes(q) ?? false) ||
        asset.type.includes(q);

      const matchesFolder =
        !activeFolder || (asset.projectName || asset.category) === activeFolder;

      const matchesInitiative =
        initiativeFilter === "all" ||
        (initiativeFilter === "none" ? !asset.projectId : asset.projectId === initiativeFilter);

      const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
      const matchesType = activeTab === "all" || asset.type === activeTab;

      return matchesSearch && matchesFolder && matchesInitiative && matchesCategory && matchesType;
    });

    return list.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortKey === "oldest" ? at - bt : bt - at;
    });
  }, [assets, searchQuery, activeFolder, initiativeFilter, categoryFilter, activeTab, sortKey]);

  const hasFilters =
    !!activeFolder || initiativeFilter !== "all" || categoryFilter !== "all" || !!searchQuery.trim();

  const clearFilters = () => {
    setActiveFolder(null);
    setInitiativeFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
  };

  const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm";

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
            <p className="text-sm text-muted-foreground">
              Every file across initiatives — upload, categorise and search
            </p>
          </div>

          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload files
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload project files</DialogTitle>
                <DialogDescription>
                  Files appear inside the folder you choose.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-project">Initiative</Label>
                  <select
                    id="asset-project"
                    value={uploadProjectId}
                    onChange={(e) => setUploadProjectId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">None — use a folder name</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-collection">Category / folder</Label>
                  <Input
                    id="asset-collection"
                    list="asset-category-options"
                    placeholder={projects.find(p => p.id === uploadProjectId)?.name || "e.g. Brand Assets"}
                    value={uploadCollection}
                    onChange={(e) => setUploadCollection(e.target.value)}
                  />
                  <datalist id="asset-category-options">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {CATEGORY_PRESETS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setUploadCollection(c)}
                        className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-files">Files</Label>
                  <Input
                    id="asset-files"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
                  />
                  {pendingFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"} ready
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setUploadOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <select
            aria-label="Filter by initiative"
            value={initiativeFilter}
            onChange={(e) => setInitiativeFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">All initiatives</option>
            <option value="none">Unassigned</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            aria-label="Sort files"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className={selectClass}
          >
            <option value="recent">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
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
          <div className="flex items-end justify-between gap-4 border-b border-border">
            <TabsList className="bg-transparent border-none rounded-none h-auto p-0 gap-6">
              {[
                { value: "all", label: "All" },
                { value: "image", label: "Images" },
                { value: "document", label: "Documents" },
                { value: "deliverable", label: "Deliverables" },
              ].map(t => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 pb-2 text-sm"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <p className="pb-2 text-xs text-muted-foreground">
              {filteredAssets.length} of {assets.length} files
            </p>
          </div>

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
                  {hasFilters && (
                    <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  )}
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
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground truncate">
                                {asset.projectName || "Unassigned"}
                              </span>
                              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                                {asset.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:inline text-xs text-muted-foreground capitalize">
                            {asset.type}
                          </span>
                          <span className="hidden sm:inline text-xs text-muted-foreground">
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
                          {asset.uploaded && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                              onClick={() => handleDelete(asset)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}

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
