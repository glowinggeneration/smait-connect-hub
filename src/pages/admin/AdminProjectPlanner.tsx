import { useState, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Globe, 
  LayoutDashboard, 
  Smartphone, 
  Upload, 
  X, 
  Image as ImageIcon,
  Copy,
  Check,
  Sparkles
} from "lucide-react";

type ProjectType = "website" | "dashboard" | "app";

interface UploadedImage {
  url: string;
  name: string;
}

const AdminProjectPlanner = () => {
  const { toast } = useToast();
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [clientName, setClientName] = useState("");
  const [brief, setBrief] = useState("");
  const [inspirationImages, setInspirationImages] = useState<UploadedImage[]>([]);
  const [logo, setLogo] = useState<UploadedImage | null>(null);
  const [favicon, setFavicon] = useState<UploadedImage | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const projectTypes = [
    { type: "website" as ProjectType, label: "Website", icon: Globe, description: "Marketing site, landing page, portfolio" },
    { type: "dashboard" as ProjectType, label: "Dashboard", icon: LayoutDashboard, description: "Admin panel, analytics, management" },
    { type: "app" as ProjectType, label: "App", icon: Smartphone, description: "Web application, SaaS, mobile-first" },
  ];

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('project-planner')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-planner')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileUpload = async (
    files: FileList | null,
    type: "inspiration" | "logo" | "favicon"
  ) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please upload image files only",
            variant: "destructive",
          });
          continue;
        }

        const url = await uploadFile(file, type);
        if (url) {
          if (type === "inspiration") {
            setInspirationImages(prev => [...prev, { url, name: file.name }]);
          } else if (type === "logo") {
            setLogo({ url, name: file.name });
          } else if (type === "favicon") {
            setFavicon({ url, name: file.name });
          }
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          setUploading(true);
          const url = await uploadFile(file, 'inspiration');
          if (url) {
            setInspirationImages(prev => [...prev, { url, name: 'Pasted image' }]);
          }
          setUploading(false);
        }
      }
    }
  }, []);

  const removeInspirationImage = (index: number) => {
    setInspirationImages(prev => prev.filter((_, i) => i !== index));
  };

  const generatePrompt = () => {
    if (!projectType || !clientName || !brief) {
      toast({
        title: "Missing information",
        description: "Please fill in the project type, client name, and brief",
        variant: "destructive",
      });
      return;
    }

    const typeDescriptions = {
      website: "a modern, responsive marketing website",
      dashboard: "a comprehensive admin dashboard with data visualization",
      app: "a mobile-first progressive web application",
    };

    const mobileInstructions = `
CRITICAL MOBILE REQUIREMENTS:
- The mobile view MUST look and feel like a native mobile app
- Use a bottom navigation bar for mobile (not hamburger menu)
- Include safe area padding for notched devices
- Implement swipe gestures where appropriate
- Use mobile-optimized touch targets (minimum 44x44px)
- Add smooth transitions and micro-animations
- Consider thumb-zone ergonomics for button placement`;

    const inspirationSection = inspirationImages.length > 0 
      ? `\n\nINSPIRATION IMAGES:\nPlease analyze and incorporate design elements from these inspiration images:\n${inspirationImages.map((img, i) => `${i + 1}. ${img.url}`).join('\n')}`
      : '';

    const brandingSection = logo || favicon
      ? `\n\nBRANDING ASSETS:\n${logo ? `- Logo: ${logo.url}` : ''}\n${favicon ? `- Favicon: ${favicon.url}` : ''}`
      : '';

    const prompt = `Build ${typeDescriptions[projectType]} for ${clientName}.

PROJECT BRIEF:
${brief}

TECHNICAL REQUIREMENTS:
- Use React with TypeScript
- Implement with Tailwind CSS for styling
- Use shadcn/ui components
- Ensure full responsiveness across all devices
- Implement dark mode support
- Follow accessibility best practices (WCAG 2.1)
- Use semantic HTML structure
${mobileInstructions}
${inspirationSection}
${brandingSection}

DESIGN GUIDELINES:
- Create a cohesive, professional design system
- Use consistent spacing and typography
- Implement smooth transitions and loading states
- Add appropriate micro-interactions
- Ensure high contrast and readability

Please create a working prototype with all pages and components functional. The design should be polished and production-ready.`;

    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6 pb-20 md:pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Project Planner</h1>
          <p className="text-muted-foreground">Generate Lovable prompts for new projects</p>
        </div>

        <div className="grid gap-6">
          {/* Project Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projectTypes.map(({ type, label, icon: Icon, description }) => (
                  <button
                    key={type}
                    onClick={() => setProjectType(type)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      projectType === type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className={`h-8 w-8 mb-2 ${projectType === type ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-semibold text-foreground">{label}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="brief">Project Brief</Label>
                <Textarea
                  id="brief"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe the project requirements, goals, and any specific features needed..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Inspiration Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inspiration Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
                onPaste={handlePaste}
              >
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Drag & drop, paste, or click to upload inspiration images
                </p>
                <input
                  ref={inspirationInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, "inspiration")}
                />
                <Button
                  variant="outline"
                  onClick={() => inspirationInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Images"}
                </Button>
              </div>

              {inspirationImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {inspirationImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeInspirationImage(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logo & Favicon */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, "logo")}
                />
                {logo ? (
                  <div className="relative inline-block">
                    <img
                      src={logo.url}
                      alt="Logo"
                      className="h-20 object-contain rounded-lg border border-border"
                    />
                    <button
                      onClick={() => setLogo(null)}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Favicon</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, "favicon")}
                />
                {favicon ? (
                  <div className="relative inline-block">
                    <img
                      src={favicon.url}
                      alt="Favicon"
                      className="h-12 w-12 object-contain rounded-lg border border-border"
                    />
                    <button
                      onClick={() => setFavicon(null)}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Favicon
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generate Button */}
          <Button
            size="lg"
            onClick={generatePrompt}
            className="w-full md:w-auto"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Generate Lovable Prompt
          </Button>

          {/* Generated Prompt */}
          {generatedPrompt && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Generated Prompt</CardTitle>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                    {generatedPrompt}
                  </pre>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {projectType?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {inspirationImages.length} inspiration image(s)
                  </Badge>
                  {logo && <Badge variant="outline">Logo included</Badge>}
                  {favicon && <Badge variant="outline">Favicon included</Badge>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProjectPlanner;
