import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { Globe, Smartphone, Monitor, Bot, Upload, X, FileText, Calendar } from "lucide-react";

const categories = [
  { id: "website", label: "Website", icon: Globe, description: "Web applications and sites" },
  { id: "software", label: "Software", icon: Monitor, description: "Desktop software solutions" },
  { id: "app", label: "Mobile App", icon: Smartphone, description: "iOS and Android apps" },
  { id: "ai-automation", label: "AI Automation", icon: Bot, description: "AI-powered solutions" },
];

const ClientNewBrief = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || !title.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Create the brief
      const { data: brief, error: briefError } = await supabase
        .from("project_briefs")
        .insert({
          client_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category: selectedCategory,
          deadline: deadline || null,
        })
        .select()
        .single();

      if (briefError) throw briefError;

      // Upload files if any
      for (const file of files) {
        const filePath = `${user.id}/${brief.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("brief-documents")
          .upload(filePath, file);

        if (uploadError) {
          console.error("File upload error:", uploadError);
          continue;
        }

        // Save file reference
        await supabase.from("brief_documents").insert({
          brief_id: brief.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
        });
      }

      toast.success("Brief submitted successfully!");
      navigate("/client");
    } catch (error) {
      console.error("Error submitting brief:", error);
      toast.error("Failed to submit brief");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout userType="client">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Project Brief</h1>
          <p className="text-muted-foreground mt-1">
            Tell us about your project and we'll get back to you shortly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Category *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedCategory === category.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <category.icon className={`w-8 h-8 mb-2 ${
                      selectedCategory === category.id ? "text-primary" : "text-muted-foreground"
                    }`} />
                    <p className="font-medium text-sm">{category.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., E-commerce Platform Redesign"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project goals, requirements, and any specific features you need..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supporting Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">
                    PDFs, images, documents, etc.
                  </p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/client")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting || !selectedCategory || !title.trim()}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Brief"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ClientNewBrief;