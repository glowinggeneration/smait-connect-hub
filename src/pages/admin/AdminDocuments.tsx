import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Eye,
  Upload,
  FolderOpen,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  type: "pdf" | "image" | "doc" | "other";
  size: string;
  project: string;
  uploadedBy: string;
  uploadedAt: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Project Brief - TechCorp.pdf",
    type: "pdf",
    size: "2.4 MB",
    project: "E-commerce Platform",
    uploadedBy: "John Smith",
    uploadedAt: "2024-12-15",
  },
  {
    id: "2",
    name: "Homepage Mockup.png",
    type: "image",
    size: "4.1 MB",
    project: "E-commerce Platform",
    uploadedBy: "Admin",
    uploadedAt: "2024-12-16",
  },
  {
    id: "3",
    name: "Brand Guidelines.pdf",
    type: "pdf",
    size: "8.2 MB",
    project: "Brand Identity",
    uploadedBy: "Admin",
    uploadedAt: "2024-12-10",
  },
  {
    id: "4",
    name: "Requirements Document.docx",
    type: "doc",
    size: "1.1 MB",
    project: "Mobile Banking App",
    uploadedBy: "Sarah Johnson",
    uploadedAt: "2024-12-18",
  },
  {
    id: "5",
    name: "App Screenshots.zip",
    type: "other",
    size: "15.3 MB",
    project: "Mobile Banking App",
    uploadedBy: "Admin",
    uploadedAt: "2024-12-19",
  },
];

const typeIcons = {
  pdf: FileText,
  image: Image,
  doc: FileText,
  other: File,
};

const typeColors = {
  pdf: "text-red-500",
  image: "text-blue-500",
  doc: "text-blue-600",
  other: "text-muted-foreground",
};

const AdminDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    project: "",
  });

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = () => {
    if (!uploadData.project) {
      toast({
        title: "Select a project",
        description: "Please select a project for the document.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Upload Complete",
      description: "Your files have been uploaded successfully.",
    });
    setIsUploadOpen(false);
    setUploadData({ project: "" });
  };

  const handleDelete = (docId: string) => {
    setDocuments(documents.filter((d) => d.id !== docId));
    toast({
      title: "Document Deleted",
      description: "The document has been removed.",
    });
  };

  const handleDownload = (doc: Document) => {
    toast({
      title: "Download Started",
      description: `Downloading ${doc.name}...`,
    });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground">
              Manage project files and assets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                  <DialogDescription>
                    Upload files to a project. Clients will be able to view these.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select
                      value={uploadData.project}
                      onValueChange={(value) =>
                        setUploadData({ ...uploadData, project: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="E-commerce Platform">E-commerce Platform</SelectItem>
                        <SelectItem value="Mobile Banking App">Mobile Banking App</SelectItem>
                        <SelectItem value="Brand Identity">Brand Identity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop files here, or click to browse
                    </p>
                    <Button variant="outline" size="sm">
                      Browse Files
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="gradient" onClick={handleUpload}>
                    Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{documents.length}</p>
              <p className="text-sm text-muted-foreground">Total Files</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-500">
                {documents.filter((d) => d.type === "pdf").length}
              </p>
              <p className="text-sm text-muted-foreground">PDFs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">
                {documents.filter((d) => d.type === "image").length}
              </p>
              <p className="text-sm text-muted-foreground">Images</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-muted-foreground">
                {documents.filter((d) => d.type === "other" || d.type === "doc").length}
              </p>
              <p className="text-sm text-muted-foreground">Other</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const TypeIcon = typeIcons[doc.type];
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TypeIcon className={`w-5 h-5 ${typeColors[doc.type]}`} />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{doc.project}</Badge>
                      </TableCell>
                      <TableCell>{doc.uploadedBy}</TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDocuments;
