import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  X, 
  Save, 
  CheckSquare, 
  Square,
  Heart,
  Brain,
  Wind,
  Utensils,
  Users,
  Bone,
  Thermometer,
  Palette
} from "lucide-react";
import { 
  PERTINENT_NEGATIVE_SYSTEMS, 
  formatPertinentNegatives
} from "@/lib/pertinent-negatives";
import { usePertinentNegativePresets, useCreatePertinentNegativePreset } from "@/hooks/use-pertinent-negative-presets";
import { useToast } from "@/hooks/use-toast";
import type { PertinentNegativePreset } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PertinentNegativesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (negativeText: string, selectedSymptoms?: Record<string, string[]>) => void;
  initialSelectedSymptoms?: Record<string, string[]>;
  mode?: 'create' | 'edit';
  presetName?: string;
}

const SYSTEM_ICONS: Record<string, React.ComponentType<any>> = {
  neuro: Brain,
  cardiac: Heart,
  respiratory: Wind,
  gi: Utensils,
  gu: Users,
  musculoskeletal: Bone,
  constitutional: Thermometer,
  skin: Palette
};

export function PertinentNegativesPopup({ 
  isOpen, 
  onClose, 
  onConfirm,
  initialSelectedSymptoms,
  mode = 'create',
  presetName: existingPresetName 
}: PertinentNegativesPopupProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, string[]>>(initialSelectedSymptoms || {});
  const [presetName, setPresetName] = useState("");
  const [showPresetSave, setShowPresetSave] = useState(false);
  
  // Fetch presets and mutations
  const { data: presets = [], isLoading: presetsLoading } = usePertinentNegativePresets();
  const createPresetMutation = useCreatePertinentNegativePreset();
  const { toast } = useToast();

  // Reset or set selections when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedSymptoms(initialSelectedSymptoms || {});
      setPresetName("");
      setShowPresetSave(false);
    }
  }, [isOpen, initialSelectedSymptoms]);

  const handleSymptomToggle = (systemId: string, symptomId: string, checked: boolean) => {
    setSelectedSymptoms(prev => {
      const current = prev[systemId] || [];
      if (checked) {
        return { ...prev, [systemId]: [...current, symptomId] };
      } else {
        return { ...prev, [systemId]: current.filter(id => id !== symptomId) };
      }
    });
  };

  const handleSelectAll = (systemId: string) => {
    const system = PERTINENT_NEGATIVE_SYSTEMS.find(s => s.id === systemId);
    if (!system) return;
    
    setSelectedSymptoms(prev => ({
      ...prev,
      [systemId]: system.symptoms.map(symptom => symptom.id)
    }));
  };

  const handleDeselectAll = (systemId: string) => {
    setSelectedSymptoms(prev => ({
      ...prev,
      [systemId]: []
    }));
  };

  const getSelectedCount = () => {
    return Object.values(selectedSymptoms).reduce((total, symptoms) => total + symptoms.length, 0);
  };

  const handleConfirm = () => {
    const negativeText = formatPertinentNegatives(selectedSymptoms);
    onConfirm(negativeText, selectedSymptoms);
    onClose();
  };

  const handleSavePreset = async () => {
    if (!presetName.trim() || getSelectedCount() === 0) return;
    
    try {
      await createPresetMutation.mutateAsync({
        name: presetName.trim(),
        selectedSymptoms
      });
      
      toast({
        title: "Preset saved",
        description: `"${presetName.trim()}" has been saved successfully.`,
      });
      
      setPresetName("");
      setShowPresetSave(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadPreset = (preset: PertinentNegativePreset) => {
    setSelectedSymptoms(preset.selectedSymptoms);
    toast({
      title: "Preset loaded",
      description: `Loaded "${preset.name}" preset.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col" aria-describedby="pertinent-negatives-description">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{mode === 'edit' ? `Edit Preset: ${existingPresetName}` : 'Select Pertinent Negatives'}</span>
            <Badge variant="secondary">
              {getSelectedCount()} symptoms selected
            </Badge>
          </DialogTitle>
          <div id="pertinent-negatives-description" className="sr-only">
            {mode === 'edit' 
              ? 'Modify the symptom selections for this preset' 
              : 'Select pertinent negative symptoms from medical systems to document in your clinical note'
            }
          </div>
        </DialogHeader>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Preset Section */}
          {(presets as PertinentNegativePreset[]).length > 0 && (
            <div className="mb-4 flex-shrink-0">
              <Label className="text-sm font-medium mb-2 block">Load Preset:</Label>
              <div className="flex flex-wrap gap-2">
                {(presets as PertinentNegativePreset[]).map(preset => (
                  <Button
                    key={preset.id}
                    size="sm"
                    variant="outline"
                    onClick={() => loadPreset(preset)}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Systems Grid */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-2 gap-4 pr-2 pb-4">
              {PERTINENT_NEGATIVE_SYSTEMS.map(system => {
                const IconComponent = SYSTEM_ICONS[system.id] || CheckSquare;
                const selectedCount = selectedSymptoms[system.id]?.length || 0;
                const totalCount = system.symptoms.length;
                
                return (
                  <Card key={system.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent size={18} className="text-medical-teal" />
                          <h3 className="font-semibold text-sm">{system.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {selectedCount}/{totalCount}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSelectAll(system.id)}
                            className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                          >
                            All
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeselectAll(system.id)}
                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                          >
                            None
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                        {system.symptoms.map(symptom => {
                          const isSelected = selectedSymptoms[system.id]?.includes(symptom.id) || false;
                          return (
                            <div key={symptom.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${system.id}-${symptom.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => 
                                  handleSymptomToggle(system.id, symptom.id, checked as boolean)
                                }
                                className="h-4 w-4 flex-shrink-0"
                              />
                              <Label 
                                htmlFor={`${system.id}-${symptom.id}`}
                                className="text-sm cursor-pointer flex-1 leading-tight"
                              >
                                {symptom.text}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex-shrink-0">
            <Separator className="my-4" />

            {/* Preview Section */}
            {getSelectedCount() > 0 && (
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Preview:</Label>
                <div className="bg-gray-50 p-3 rounded text-sm border max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  {formatPertinentNegatives(selectedSymptoms)}
                </div>
              </div>
            )}

            {/* Preset Save Section */}
            {showPresetSave && (
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <Label className="text-sm font-medium mb-2 block">Save as Preset:</Label>
                <div className="flex space-x-2">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Enter preset name..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSavePreset();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save size={14} className="mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPresetSave(false)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {getSelectedCount() > 0 && mode !== 'edit' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPresetSave(true)}
                    disabled={showPresetSave}
                  >
                    <Save size={14} className="mr-1" />
                    Save as Preset
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={getSelectedCount() === 0}
                  className="bg-medical-teal hover:bg-medical-teal/90"
                >
                  <Check size={16} className="mr-2" />
                  {mode === 'edit' ? 'Update Preset' : 'Insert Pertinent Negatives'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}