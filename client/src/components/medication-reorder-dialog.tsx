import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpDown, Shuffle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import {
  parseMedicationsFromText,
  smartReorderMedications,
  manualReorderMedications,
  medicationsToText,
  type ParsedMedication
} from "@/lib/medication-ordering";

interface MedicationReorderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  medicationText: string;
  onReorder: (reorderedText: string) => void;
}

export function MedicationReorderDialog({
  isOpen,
  onClose,
  medicationText,
  onReorder
}: MedicationReorderDialogProps) {
  const { t } = useTranslation();
  const [medications, setMedications] = useState<ParsedMedication[]>([]);
  const [mode, setMode] = useState<'manual' | 'smart'>('manual');
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [smartOrdered, setSmartOrdered] = useState<ParsedMedication[]>([]);

  useEffect(() => {
    if (isOpen && medicationText) {
      const parsed = parseMedicationsFromText(medicationText);
      setMedications(parsed);
      setSelectedOrder([]);
      setSmartOrdered(smartReorderMedications(parsed));
    }
  }, [isOpen, medicationText]);

  const handleMedicationClick = (index: number) => {
    if (mode !== 'manual') return;
    
    const currentIndex = selectedOrder.indexOf(index);
    if (currentIndex >= 0) {
      // Remove from selection
      setSelectedOrder(prev => prev.filter((_, i) => i !== currentIndex));
    } else {
      // Add to selection
      setSelectedOrder(prev => [...prev, index]);
    }
  };

  const handleManualConfirm = () => {
    if (selectedOrder.length === medications.length) {
      const reordered = manualReorderMedications(medications, selectedOrder);
      const reorderedText = medicationsToText(reordered);
      onReorder(reorderedText);
      onClose();
    }
  };

  const handleSmartConfirm = () => {
    const reorderedText = medicationsToText(smartOrdered);
    onReorder(reorderedText);
    onClose();
  };

  const getSelectionNumber = (index: number) => {
    const position = selectedOrder.indexOf(index);
    return position >= 0 ? position + 1 : null;
  };

  const isComplete = mode === 'manual' ? selectedOrder.length === medications.length : true;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reorder Medications</DialogTitle>
          <div className="flex gap-2 mt-4">
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('manual')}
              className="flex items-center gap-2"
              data-testid="button-manual-reorder"
            >
              <ArrowUpDown size={14} />
              Manual Order
            </Button>
            <Button
              variant={mode === 'smart' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('smart')}
              className="flex items-center gap-2"
              data-testid="button-smart-reorder"
            >
              <Shuffle size={14} />
              Smart Order (by Category)
            </Button>
          </div>
        </DialogHeader>

        {medications.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No medications found in the text. Make sure medications are listed on separate lines.
          </div>
        ) : (
          <>
            {mode === 'manual' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Click medications in the order you want them to appear:
                  {selectedOrder.length > 0 && (
                    <span className="ml-2 font-medium">
                      ({selectedOrder.length}/{medications.length} selected)
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {medications.map((med, index) => {
                    const selectionNumber = getSelectionNumber(index);
                    const isSelected = selectionNumber !== null;
                    
                    return (
                      <Card
                        key={index}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isSelected 
                            ? "border-[color:var(--brand-600)] bg-[color:var(--brand-50)] dark:bg-blue-950" 
                            : "hover:border-gray-300"
                        )}
                        onClick={() => handleMedicationClick(index)}
                        data-testid={`medication-${index}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{med.medicationName}</span>
                                {med.matchedMedication && (
                                  <Badge variant="outline" className="text-xs">
                                    {med.matchedMedication.subcategory || med.matchedMedication.category}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {med.originalLine}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-8 h-8 bg-[color:var(--brand-600)] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {selectionNumber}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {mode === 'smart' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Medications will be automatically ordered by therapeutic category:
                </div>
                <div className="space-y-2">
                  {smartOrdered.map((med, index) => (
                    <Card key={`smart-${index}`} className="border-green-200 bg-green-50 dark:bg-green-950">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                                {index + 1}
                              </span>
                              <span className="font-medium">{med.medicationName}</span>
                              {med.matchedMedication && (
                                <Badge variant="outline" className="text-xs">
                                  {med.matchedMedication.subcategory || med.matchedMedication.category}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 ml-8">
                              {med.originalLine}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <strong>Smart ordering priority:</strong> Anticoagulants → Antiplatelets → 
                  Antiarrhythmics → ACE/ARB → Beta blockers → CCBs → Diabetes → Psych → 
                  Pain → Respiratory → GI → Antibiotics → Others
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-reorder">
            <X size={14} className="mr-2" />
            {t('common.cancel')}
          </Button>
          <Button
            onClick={mode === 'manual' ? handleManualConfirm : handleSmartConfirm}
            disabled={!isComplete}
            data-testid="button-confirm-reorder"
          >
            <Check size={14} className="mr-2" />
            Apply Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
