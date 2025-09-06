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

interface ImportSmartPhraseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportSmartPhraseDialog({ open, onOpenChange }: ImportSmartPhraseDialogProps) {
  const [codesInput, setCodesInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImport = async () => {
    const raw = codesInput.trim();
    if (!raw) {
      toast({
        title: "Error",
        description: "Please enter one or more short codes",
        variant: "destructive",
      });
      return;
    }
    const codes = raw.split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    if (codes.length === 0) {
      toast({ title: "Error", description: "No valid codes provided", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    try {
      await apiRequest('POST', `/api/share/smart-phrases/import`, { codes }, { timeoutMs: 90000 });
      
      toast({
        title: "Success",
        description: codes.length > 1 ? "Smart phrases imported" : "Smart phrase imported successfully",
      });
      
      // Refresh smart phrases list
      queryClient.invalidateQueries({ queryKey: ["/api/smart-phrases"] });
      
      // Reset form and close dialog
      setCodesInput("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import smart phrase",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isImporting) {
      setCodesInput("");
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Smart Phrase
          </DialogTitle>
          <DialogDescription>
            Enter one or more 4‑character short codes to import smart phrases.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="codes">Short Codes</Label>
            <Input
              id="codes"
              placeholder="e.g. AB12, CD34 EF56"
              value={codesInput}
              onChange={(e) => setCodesInput(e.target.value)}
              disabled={isImporting}
              data-testid="input-short-codes"
            />
            <p className="text-sm text-gray-500">Separate multiple codes with spaces or commas.</p>
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
            disabled={!codesInput.trim() || isImporting}
            data-testid="button-confirm-import"
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Smart Phrase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
