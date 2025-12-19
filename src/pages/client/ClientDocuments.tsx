import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Image, File, Download, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const mockDocuments = [
  { id: "1", name: "Project Brief.pdf", type: "pdf", size: "2.4 MB", project: "E-commerce Platform", uploadedAt: "2024-12-15" },
  { id: "2", name: "Homepage Mockup.png", type: "image", size: "4.1 MB", project: "E-commerce Platform", uploadedAt: "2024-12-16" },
  { id: "3", name: "App Screenshots.zip", type: "other", size: "15.3 MB", project: "Mobile Banking App", uploadedAt: "2024-12-19" },
];

const typeIcons = { pdf: FileText, image: Image, doc: FileText, other: File };
const typeColors = { pdf: "text-red-500", image: "text-blue-500", doc: "text-blue-600", other: "text-muted-foreground" };

const ClientDocuments = () => {
  return (
    <DashboardLayout userType="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">View and download project files</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDocuments.map((doc) => {
                  const TypeIcon = typeIcons[doc.type as keyof typeof typeIcons] || File;
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TypeIcon className={`w-5 h-5 ${typeColors[doc.type as keyof typeof typeColors]}`} />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{doc.project}</Badge></TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toast({ title: "Download Started" })}>
                          <Download className="w-4 h-4" />
                        </Button>
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

export default ClientDocuments;
