import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePertinentNegativePresets } from "@/hooks/use-pertinent-negative-presets";
import { formatPertinentNegatives } from "@/lib/pertinent-negatives";
import { ChevronDown, Zap } from "lucide-react";
import type { PertinentNegativePreset } from "@shared/schema";

interface PertinentNegativePresetSelectorProps {
  onSelectPreset: (negativeText: string) => void;
}

export function PertinentNegativePresetSelector({ onSelectPreset }: PertinentNegativePresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: presets = [], isLoading } = usePertinentNegativePresets();

  const handlePresetSelect = (preset: PertinentNegativePreset) => {
    const negativeText = formatPertinentNegatives(preset.selectedSymptoms);
    onSelectPreset(negativeText);
    setIsOpen(false);
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
                    <Button
                      key={preset.id}
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2 px-2"
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
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}