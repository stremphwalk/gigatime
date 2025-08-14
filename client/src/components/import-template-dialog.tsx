import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";

interface ImportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportTemplateDialog({ open, onOpenChange }: ImportTemplateDialogProps) {
  const [shareableId, setShareableId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImport = async () => {
    if (!shareableId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a shareable ID",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      await apiRequest(`/api/note-templates/import/${shareableId.trim()}`, {
        method: "POST",
      });
      
      toast({
        title: "Success",
        description: "Template imported successfully",
      });
      
      // Refresh templates list
      queryClient.invalidateQueries({ queryKey: ["/api/note-templates"] });
      
      // Reset form and close dialog
      setShareableId("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import template",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isImporting) {
      setShareableId("");
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Template
          </DialogTitle>
          <DialogDescription>
            Enter the shareable ID of a template to import it to your library.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="shareable-id">Shareable ID</Label>
            <Input
              id="shareable-id"
              placeholder="Enter template shareable ID..."
              value={shareableId}
              onChange={(e) => setShareableId(e.target.value)}
              disabled={isImporting}
              data-testid="input-shareable-id"
            />
            <p className="text-sm text-gray-500">
              This is a 12-character code that starts with letters like "A1B2C3D4E5F6"
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isImporting}
            data-testid="button-cancel-import"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!shareableId.trim() || isImporting}
            data-testid="button-confirm-import"
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}