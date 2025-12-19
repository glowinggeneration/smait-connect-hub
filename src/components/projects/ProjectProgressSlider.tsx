import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectProgressSliderProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  className?: string;
}

export const ProjectProgressSlider = ({
  value,
  onSave,
  className,
}: ProjectProgressSliderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tempValue);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={cn(
          "w-full text-left group cursor-pointer",
          className
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Click to update progress
          </span>
          <span className="text-sm font-bold text-primary">{value}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn("space-y-3", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Progress</span>
        <span className="text-sm font-bold text-primary">{tempValue}%</span>
      </div>
      <Slider
        value={[tempValue]}
        onValueChange={([v]) => setTempValue(v)}
        max={100}
        step={5}
        className="cursor-pointer"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 h-8"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="gradient"
          className="flex-1 h-8"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};