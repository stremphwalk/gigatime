import { useState, useCallback } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutocompleteItems } from "@/hooks/use-autocomplete-items";

interface ImagingStudy {
  abbreviation: string;
  fullName: string;
  commonFindings: string[];
  pertinentNegatives: string[];
  category: string;
}

const IMAGING_STUDIES: ImagingStudy[] = [
  {
    abbreviation: "CXR",
    fullName: "Chest X-Ray",
    category: "Chest",
    commonFindings: [
      "Clear lung fields",
      "Normal heart size and contours",
      "Normal mediastinal contours",
      "No acute cardiopulmonary process"
    ],
    pertinentNegatives: [
      "No pneumonia",
      "No pneumothorax", 
      "No pleural effusion",
      "No pulmonary edema",
      "No consolidation",
      "No infiltrates",
      "No cardiomegaly",
      "No mediastinal widening",
      "No rib fractures",
      "No foreign bodies"
    ]
  },
  {
    abbreviation: "CT HEAD",
    fullName: "CT Head without contrast",
    category: "Neurological",
    commonFindings: [
      "No acute intracranial abnormality",
      "Normal gray-white matter differentiation",
      "Midline structures intact",
      "Normal ventricular size"
    ],
    pertinentNegatives: [
      "No intracranial hemorrhage",
      "No mass effect",
      "No midline shift",
      "No acute stroke",
      "No hydrocephalus",
      "No skull fracture",
      "No extra-axial collections",
      "No cerebral edema"
    ]
  },
  {
    abbreviation: "CT ABD/PELVIS",
    fullName: "CT Abdomen and Pelvis with contrast",
    category: "Abdominal",
    commonFindings: [
      "Normal solid organ enhancement",
      "No acute abdominal process",
      "Normal bowel wall thickness",
      "No free fluid"
    ],
    pertinentNegatives: [
      "No appendicitis",
      "No bowel obstruction",
      "No free air",
      "No abscess",
      "No kidney stones",
      "No gallstones",
      "No pancreatitis",
      "No diverticulitis",
      "No hernia",
      "No masses"
    ]
  },
  {
    abbreviation: "ECG",
    fullName: "Electrocardiogram",
    category: "Cardiac",
    commonFindings: [
      "Normal sinus rhythm",
      "Normal axis",
      "Normal intervals",
      "No acute changes"
    ],
    pertinentNegatives: [
      "No ST elevation",
      "No ST depression", 
      "No T wave inversions",
      "No Q waves",
      "No arrhythmias",
      "No heart block",
      "No prolonged QT",
      "No signs of ischemia"
    ]
  },
  {
    abbreviation: "ECHO",
    fullName: "Echocardiogram",
    category: "Cardiac",
    commonFindings: [
      "Normal left ventricular function",
      "Normal wall motion",
      "Normal valve function",
      "No pericardial effusion"
    ],
    pertinentNegatives: [
      "No wall motion abnormalities",
      "No valvular stenosis",
      "No valvular regurgitation",
      "No left ventricular hypertrophy",
      "No right heart strain",
      "No vegetation",
      "No thrombus",
      "No aortic root dilation"
    ]
  },
  {
    abbreviation: "US ABD",
    fullName: "Abdominal Ultrasound",
    category: "Abdominal",
    commonFindings: [
      "Normal liver echogenicity",
      "Normal gallbladder",
      "Normal kidney size and echogenicity",
      "No hydronephrosis"
    ],
    pertinentNegatives: [
      "No gallstones",
      "No cholecystitis",
      "No biliary dilation",
      "No hepatomegaly",
      "No splenomegaly",
      "No kidney stones",
      "No masses",
      "No ascites"
    ]
  }
];

interface ImagingAutocompleteProps {
  onSelect: (study: ImagingStudy, selectedNegatives: string[]) => void;
  trigger?: React.ReactNode;
  placeholder?: string;
}

export function ImagingAutocomplete({ onSelect, trigger, placeholder = "Search imaging studies..." }: ImagingAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<ImagingStudy | null>(null);
  const [selectedNegatives, setSelectedNegatives] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const { items: customItems } = useAutocompleteItems('imaging');

  const filteredStudies = IMAGING_STUDIES.filter(
    study => 
      study.abbreviation.toLowerCase().includes(searchValue.toLowerCase()) ||
      study.fullName.toLowerCase().includes(searchValue.toLowerCase())
  );

  const customSnippets = customItems
    .filter(item =>
      item.text.toLowerCase().includes(searchValue.toLowerCase().trim()) ||
      item.description?.toLowerCase().includes(searchValue.toLowerCase().trim())
    )
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
    .slice(0, 10);

  const handleStudySelect = useCallback((study: ImagingStudy) => {
    setSelectedStudy(study);
    setSelectedNegatives([]); // Reset selected negatives
  }, []);

  const toggleNegative = useCallback((negative: string) => {
    setSelectedNegatives(prev => 
      prev.includes(negative) 
        ? prev.filter(n => n !== negative)
        : [...prev, negative]
    );
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedStudy) {
      onSelect(selectedStudy, selectedNegatives);
      setOpen(false);
      setSelectedStudy(null);
      setSelectedNegatives([]);
      setSearchValue("");
    }
  }, [selectedStudy, selectedNegatives, onSelect]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setSelectedStudy(null);
    setSelectedNegatives([]);
    setSearchValue("");
  }, []);

  const handleCustomSnippetSelect = useCallback((text: string) => {
    // Use a special abbreviation to signal raw insert
    const pseudoStudy = {
      abbreviation: "__CUSTOM__",
      fullName: text,
      category: "Custom",
      commonFindings: [],
      pertinentNegatives: [],
    } as ImagingStudy;
    onSelect(pseudoStudy, []);
    setOpen(false);
    setSelectedStudy(null);
    setSelectedNegatives([]);
    setSearchValue("");
  }, [onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            className="justify-start text-left font-normal"
            data-testid="imaging-autocomplete-trigger"
          >
            {placeholder}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        {!selectedStudy ? (
          <Command>
            <CommandInput 
              placeholder={placeholder}
              value={searchValue}
              onValueChange={setSearchValue}
              data-testid="imaging-search-input"
            />
            <CommandList>
              <CommandEmpty>No imaging studies found.</CommandEmpty>
              {customSnippets.length > 0 && (
                <CommandGroup heading="Custom Imaging Snippets">
                  {customSnippets.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.text}
                      onSelect={() => handleCustomSnippetSelect(item.text)}
                      className="flex flex-col items-start space-y-1 p-3"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">Custom</Badge>
                          <span className="font-medium">{item.text}</span>
                        </div>
                        {item.isPriority && (
                          <Badge variant="outline" className="text-xs">Priority</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 text-left">
                          {item.description}
                        </p>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading="Imaging Studies">
                {filteredStudies.map((study) => (
                  <CommandItem
                    key={study.abbreviation}
                    value={study.abbreviation}
                    onSelect={() => handleStudySelect(study)}
                    className="flex flex-col items-start space-y-1 p-3"
                    data-testid={`imaging-study-${study.abbreviation.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {study.abbreviation}
                        </Badge>
                        <span className="font-medium">{study.fullName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {study.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 text-left">
                      {study.pertinentNegatives.length} pertinent negatives available
                    </p>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedStudy.abbreviation}</Badge>
                <span className="font-medium">{selectedStudy.fullName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedStudy(null)}
                data-testid="back-to-search"
              >
                ← Back
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-2">Common Findings:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  {selectedStudy.commonFindings.map((finding, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span>•</span>
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Select Pertinent Negatives:
                  {selectedNegatives.length > 0 && (
                    <span className="ml-2 text-xs text-blue-600">
                      ({selectedNegatives.length} selected)
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {selectedStudy.pertinentNegatives.map((negative) => (
                    <div
                      key={negative}
                      className={cn(
                        "flex items-center justify-between p-2 rounded border cursor-pointer transition-colors",
                        selectedNegatives.includes(negative)
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => toggleNegative(negative)}
                      data-testid={`negative-${negative.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span className="text-sm flex-1">{negative}</span>
                      {selectedNegatives.includes(negative) && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                data-testid="cancel-imaging"
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleConfirm}
                data-testid="confirm-imaging"
              >
                Insert ({selectedNegatives.length} negatives)
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export type { ImagingStudy };
