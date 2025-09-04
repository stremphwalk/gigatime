import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

interface LabLineOverlayProps {
  visible: boolean;
  top: number;
  left: number;
  count: number;
  max?: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onDelete: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function LabLineOverlay({ visible, top, left, count, max, onIncrease, onDecrease, onDelete, onMouseEnter, onMouseLeave }: LabLineOverlayProps) {
  if (!visible) return null;
  return (
    <div
      style={{ position: 'fixed', top, left, zIndex: 1000 }}
      className="flex items-center gap-1 rounded-md border bg-background shadow-sm px-1.5 py-1"
      role="toolbar"
      aria-label="Lab line controls"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDecrease} aria-label="Show fewer trends" disabled={count <= 0}>
        <ChevronDown className="h-3 w-3" />
      </Button>
      <span className="text-xs min-w-[1.25rem] text-center">{count}</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onIncrease} aria-label="Show more trends" disabled={max !== undefined && count >= max}>
        <ChevronUp className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={onDelete} aria-label="Delete lab line">
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
