import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

type InitiativeType = "website" | "web-app" | "mobile-app" | "saas" | "ai-tool" | "ecommerce";

const initiativeTypes: { value: InitiativeType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "web-app", label: "Web Application" },
  { value: "mobile-app", label: "Mobile App" },
  { value: "saas", label: "SaaS Platform" },
  { value: "ai-tool", label: "AI Tool" },
  { value: "ecommerce", label: "E-commerce" },
];

const PlannerContent = () => {
  const [initiativeType, setInitiativeType] = useState<InitiativeType>("website");
  const [clientName, setClientName] = useState("");
  const [brief, setBrief] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const generatePrompt = () => {
    if (!clientName || !brief) {
      toast.error("Client name and brief are required");
      return;
    }

    const typeInfo = initiativeTypes.find(t => t.value === initiativeType);
    
    const prompt = `# Initiative Planning Document

## Principal
${clientName}

## Type
${typeInfo?.label}

## Directive
${brief}

## Execution Framework

### Discovery
- Stakeholder alignment
- Constraint mapping
- Technical audit

### Strategy
- Success metrics
- User personas
- Feature prioritization

### Design
- Brand alignment
- Information architecture
- Visual system

### Implementation
- Technical architecture
- Development phases
- Quality gates

### Launch
- Deployment strategy
- Monitoring
- Documentation

### Optimization
- Analytics
- Iteration cycles
- Maintenance schedule`;

    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="panel p-4 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Initiative Planner</h3>
          <p className="text-xs text-muted-foreground">
            Generate structured planning documents
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={initiativeType} onValueChange={(v) => setInitiativeType(v as InitiativeType)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {initiativeTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Principal</Label>
            <Input
              placeholder="Organization or client name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Brief</Label>
            <Textarea
              placeholder="Objectives, constraints, and desired outcomes..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="min-h-[120px] resize-none text-sm"
            />
          </div>

          <Button onClick={generatePrompt} size="sm" className="w-full">
            Generate Plan
          </Button>
        </div>
      </div>

      <div className="panel p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Output</h3>
            <p className="text-xs text-muted-foreground">
              Generated planning document
            </p>
          </div>
          {generatedPrompt && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={copyToClipboard} 
              className="gap-1.5 h-7 text-xs"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>
        
        {generatedPrompt ? (
          <div className="p-3 rounded-md bg-muted/50 border border-border max-h-[360px] overflow-y-auto">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {generatedPrompt}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <p className="text-xs">Complete the form to generate a plan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlannerContent;
