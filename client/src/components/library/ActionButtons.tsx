import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Edit2, Copy, Trash2 } from "lucide-react";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  size?: "sm" | "icon";
}

export function ActionButtons({ onEdit, onDuplicate, onDelete, size = "icon" }: ActionButtonsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 opacity-80">
        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size={size} variant="ghost" onClick={onEdit} className="h-7 w-7 grid place-items-center">
                <Edit2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        )}
        {onDuplicate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size={size} variant="ghost" onClick={onDuplicate} className="h-7 w-7 grid place-items-center">
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size={size} variant="ghost" onClick={onDelete} className="h-7 w-7 grid place-items-center text-rose-600 hover:text-rose-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

