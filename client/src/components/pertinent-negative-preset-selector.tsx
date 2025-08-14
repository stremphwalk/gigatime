import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePertinentNegativePresets, useUpdatePertinentNegativePreset, useDeletePertinentNegativePreset } from "@/hooks/use-pertinent-negative-presets";
import { useToast } from "@/hooks/use-toast";
import { formatPertinentNegatives } from "@/lib/pertinent-negatives";
import { ChevronDown, Zap, Edit, Trash2 } from "lucide-react";
import type { PertinentNegativePreset } from "@shared/schema";
import { PertinentNegativesPopup } from "./pertinent-negatives-popup";

interface PertinentNegativePresetSelectorProps {
  onSelectPreset: (negativeText: string) => void;
}

export function PertinentNegativePresetSelector({ onSelectPreset }: PertinentNegativePresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PertinentNegativePreset | null>(null);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [deleteConfirmPreset, setDeleteConfirmPreset] = useState<PertinentNegativePreset | null>(null);
  const { data: presets = [], isLoading } = usePertinentNegativePresets();
  const updatePresetMutation = useUpdatePertinentNegativePreset();
  const deletePresetMutation = useDeletePertinentNegativePreset();
  const { toast } = useToast();

  const handlePresetSelect = (preset: PertinentNegativePreset) => {
    const negativeText = formatPertinentNegatives(preset.selectedSymptoms);
    onSelectPreset(negativeText);
    setIsOpen(false);
  };

  const handleEditPreset = (preset: PertinentNegativePreset) => {
    setEditingPreset(preset);
    setIsOpen(false); // Close the dropdown
    setShowEditPopup(true); // Open the full pertinent negatives popup for editing
  };

  const handleEditConfirm = async (negativeText: string, selectedSymptoms: Record<string, string[]>) => {
    if (!editingPreset) return;

    try {
      await updatePresetMutation.mutateAsync({
        id: editingPreset.id,
        name: editingPreset.name, // Keep same name
        selectedSymptoms: selectedSymptoms
      });
      
      toast({
        title: "Preset updated",
        description: `"${editingPreset.name}" selections have been updated.`,
      });
      
      setEditingPreset(null);
      setShowEditPopup(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePreset = (preset: PertinentNegativePreset) => {
    setDeleteConfirmPreset(preset);
  };

  const confirmDeletePreset = async () => {
    if (!deleteConfirmPreset) return;

    try {
      await deletePresetMutation.mutateAsync(deleteConfirmPreset.id);
      
      toast({
        title: "Preset deleted",
        description: `"${deleteConfirmPreset.name}" has been deleted.`,
      });
      
      setDeleteConfirmPreset(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete preset. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Don't render if no presets available
  if (isLoading || (presets as PertinentNegativePreset[]).length === 0) {
    return null;
  }

  const presetsArray = presets as PertinentNegativePreset[];

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="text-xs text-medical-teal border-medical-teal hover:bg-medical-teal/10 hover:text-medical-teal"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-preset-selector"
      >
        <Zap size={12} className="mr-1" />
        Quick Presets
        <ChevronDown size={12} className="ml-1" />
        <Badge variant="secondary" className="ml-1 text-xs">
          {presetsArray.length}
        </Badge>
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <Card className="absolute top-full mt-1 left-0 z-20 w-64 shadow-lg border">
            <CardContent className="p-2">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600 mb-2 px-2">
                  Quick Insert Presets
                </div>
                {presetsArray.map(preset => {
                  const symptomCount = Object.values(preset.selectedSymptoms).reduce(
                    (total, symptoms) => total + symptoms.length, 
                    0
                  );
                  
                  return (
                    <div key={preset.id} className="flex items-center group">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 justify-start text-left h-auto py-2 px-2"
                        onClick={() => handlePresetSelect(preset)}
                        data-testid={`preset-option-${preset.id}`}
                      >
                        <div className="flex flex-col items-start gap-1 w-full">
                          <div className="font-medium text-sm">
                            {preset.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {symptomCount} symptom{symptomCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </Button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPreset(preset);
                          }}
                          data-testid={`edit-preset-${preset.id}`}
                        >
                          <Edit size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset);
                          }}
                          data-testid={`delete-preset-${preset.id}`}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Preset Popup */}
      <PertinentNegativesPopup
        isOpen={showEditPopup}
        onClose={() => {
          setShowEditPopup(false);
          setEditingPreset(null);
        }}
        onConfirm={(negativeText, selectedSymptoms) => {
          if (selectedSymptoms) {
            handleEditConfirm(negativeText, selectedSymptoms);
          }
        }}
        initialSelectedSymptoms={editingPreset?.selectedSymptoms}
        mode="edit"
        presetName={editingPreset?.name}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmPreset} onOpenChange={() => setDeleteConfirmPreset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the preset "{deleteConfirmPreset?.name}"? 
              This action cannot be undone and will permanently remove all saved symptom selections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmPreset(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePreset}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletePresetMutation.isPending}
            >
              {deletePresetMutation.isPending ? "Deleting..." : "Delete Preset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}