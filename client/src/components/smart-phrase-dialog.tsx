import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { Plus, Zap } from "lucide-react";
import type { SmartPhrase } from "@shared/schema";

interface SmartPhraseDialogProps {
  phrase?: SmartPhrase;
  onClose?: () => void;
}

export function SmartPhraseDialog({ phrase, onClose }: SmartPhraseDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    trigger: phrase?.trigger || "",
    content: phrase?.content || "",
    description: phrase?.description || "",
    category: phrase?.category || "general"
  });

  const { createPhrase, updatePhrase, isCreating } = useSmartPhrases();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (phrase) {
        await updatePhrase({ id: phrase.id, ...formData });
      } else {
        await createPhrase(formData);
      }
      
      setFormData({
        trigger: "",
        content: "",
        description: "",
        category: "general"
      });
      
      setOpen(false);
      onClose?.();
    } catch (error) {
      console.error("Error saving smart phrase:", error);
    }
  };

  const categories = [
    "general",
    "cardiology",
    "respiratory",
    "gastroenterology",
    "neurology",
    "emergency",
    "surgery",
    "pediatrics"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs hover:bg-professional-blue hover:text-white"
          data-testid="button-create-phrase"
        >
          <Plus size={12} className="mr-2" />
          {phrase ? "Edit Phrase" : "Create Command"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="text-medical-teal" size={20} />
            <span>{phrase ? "Edit Smart Phrase" : "Create Smart Phrase"}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trigger">Trigger (without /)</Label>
            <Input
              id="trigger"
              value={formData.trigger}
              onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
              placeholder="e.g., chest-pain"
              required
              data-testid="input-phrase-trigger"
            />
            <p className="text-xs text-gray-500">Type /{formData.trigger || "trigger"} to use this phrase</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter the text content that will be inserted..."
              className="min-h-[100px]"
              required
              data-testid="textarea-phrase-content"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this phrase is for"
              data-testid="input-phrase-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger data-testid="select-phrase-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating}
              className="bg-medical-teal hover:bg-medical-teal/90"
              data-testid="button-save-phrase"
            >
              {isCreating ? "Saving..." : phrase ? "Update Phrase" : "Create Phrase"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}