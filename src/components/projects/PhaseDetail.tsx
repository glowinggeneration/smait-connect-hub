import { useState } from "react";
import { ProjectPhase, PhaseField, PhaseStatus } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  EyeOff,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PhaseDetailProps {
  phase: ProjectPhase;
  isAdmin: boolean;
  onUpdate?: (phase: ProjectPhase) => void;
  onMovePhase?: (direction: "forward" | "backward") => void;
  onClose?: () => void;
}

const statusOptions: { value: PhaseStatus; label: string }[] = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

export const PhaseDetail = ({
  phase,
  isAdmin,
  onUpdate,
  onMovePhase,
  onClose,
}: PhaseDetailProps) => {
  const [editedPhase, setEditedPhase] = useState<ProjectPhase>(phase);
  const [isEditingName, setIsEditingName] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (
    fieldType: "admin" | "client",
    fieldId: string,
    value: string | boolean | number
  ) => {
    const fields = fieldType === "admin" ? "adminFields" : "clientFields";
    setEditedPhase((prev) => ({
      ...prev,
      [fields]: prev[fields].map((f) =>
        f.id === fieldId ? { ...f, value } : f
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate?.(editedPhase);
    setHasChanges(false);
  };

  const renderField = (field: PhaseField, fieldType: "admin" | "client") => {
    const isEditable = isAdmin;

    if (!isEditable && field.adminOnly) return null;

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm">{field.label}</Label>
            {isEditable ? (
              <Switch
                checked={field.value as boolean}
                onCheckedChange={(checked) =>
                  handleFieldChange(fieldType, field.id, checked)
                }
              />
            ) : (
              <Badge variant={field.value ? "completed" : "secondary"}>
                {field.value ? "Yes" : "No"}
              </Badge>
            )}
          </div>
        );

      case "progress":
        return (
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{field.label}</Label>
              <span className="text-sm font-medium">{field.value}%</span>
            </div>
            {isEditable ? (
              <Input
                type="range"
                min="0"
                max="100"
                value={field.value as number}
                onChange={(e) =>
                  handleFieldChange(fieldType, field.id, parseInt(e.target.value))
                }
                className="w-full"
              />
            ) : (
              <Progress value={field.value as number} variant="gradient" size="sm" />
            )}
          </div>
        );

      case "select":
        return (
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm">{field.label}</Label>
            {isEditable ? (
              <Select
                value={field.value as string}
                onValueChange={(value) =>
                  handleFieldChange(fieldType, field.id, value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary">{field.value}</Badge>
            )}
          </div>
        );

      case "text":
      default:
        return (
          <div className="space-y-1.5 py-2">
            <Label className="text-sm">{field.label}</Label>
            {isEditable ? (
              field.id.includes("notes") || field.id.includes("Notes") ? (
                <Textarea
                  value={field.value as string}
                  onChange={(e) =>
                    handleFieldChange(fieldType, field.id, e.target.value)
                  }
                  className="min-h-[80px]"
                />
              ) : (
                <Input
                  value={field.value as string}
                  onChange={(e) =>
                    handleFieldChange(fieldType, field.id, e.target.value)
                  }
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                {field.value || "—"}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
              editedPhase.status === "completed" && "bg-emerald-500 text-primary-foreground",
              editedPhase.status === "in-progress" && "bg-primary text-primary-foreground",
              editedPhase.status === "not-started" && "bg-muted text-muted-foreground",
              editedPhase.status === "blocked" && "bg-destructive text-primary-foreground"
            )}
          >
            {editedPhase.order}
          </div>
          <div>
            {isEditingName && isAdmin ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedPhase.customName || editedPhase.name}
                  onChange={(e) => {
                    setEditedPhase((prev) => ({
                      ...prev,
                      customName: e.target.value,
                    }));
                    setHasChanges(true);
                  }}
                  className="h-8"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setIsEditingName(false)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {editedPhase.customName || editedPhase.name}
                </h2>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{editedPhase.description}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditedPhase((prev) => ({
                  ...prev,
                  isVisible: !prev.isVisible,
                }));
                setHasChanges(true);
              }}
            >
              {editedPhase.isVisible ? (
                <>
                  <Eye className="w-4 h-4 mr-1" /> Visible
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-1" /> Hidden
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Status & Progress Controls (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Phase Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editedPhase.status}
                  onValueChange={(value: PhaseStatus) => {
                    setEditedPhase((prev) => ({ ...prev, status: value }));
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Progress: {editedPhase.progress}%</Label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={editedPhase.progress}
                  onChange={(e) => {
                    setEditedPhase((prev) => ({
                      ...prev,
                      progress: parseInt(e.target.value),
                    }));
                    setHasChanges(true);
                  }}
                />
              </div>
            </div>

            {/* Move Phase Controls */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Move project phase:</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMovePhase?.("backward")}
                  disabled={editedPhase.order === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMovePhase?.("forward")}
                  disabled={editedPhase.order === 5}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Fields */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Admin Fields</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {editedPhase.adminFields.map((field) => (
              <div key={field.id}>{renderField(field, "admin")}</div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Client-Visible Fields */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {isAdmin ? "Client-Visible Fields" : "Phase Details"}
            </CardTitle>
            {isAdmin && (
              <Badge variant="info" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Visible to Client
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="divide-y">
          {editedPhase.clientFields.map((field) => (
            <div key={field.id}>{renderField(field, "client")}</div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add internal notes about this phase..."
              value={editedPhase.adminNotes || ""}
              onChange={(e) => {
                setEditedPhase((prev) => ({
                  ...prev,
                  adminNotes: e.target.value,
                }));
                setHasChanges(true);
              }}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {isAdmin && hasChanges && (
        <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setEditedPhase(phase);
              setHasChanges(false);
            }}
          >
            <X className="w-4 h-4 mr-1" />
            Discard
          </Button>
          <Button variant="gradient" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};
