import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calculator, 
  CalculatorField, 
  CALCULATOR_SYSTEMS, 
  getCalculatorsBySystem, 
  getCalculatorById,
  searchCalculators 
} from "@/lib/clinical-calculators";
import { 
  Search, 
  ArrowLeft, 
  Calculator as CalculatorIcon,
  Heart,
  Activity as LungsIcon,
  Droplets,
  Brain,
  Activity,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

interface ClinicalCalculatorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculationComplete: (result: string) => void;
  position?: { top: number; left: number };
}

const SYSTEM_ICONS: Record<string, React.ReactNode> = {
  'Cardiovascular': <Heart className="h-4 w-4" />,
  'Respiratory': <LungsIcon className="h-4 w-4" />,
  'Renal': <Droplets className="h-4 w-4" />,
  'Neurology': <Brain className="h-4 w-4" />,
  'Endocrine': <Activity className="h-4 w-4" />,
  'Emergency Medicine': <AlertTriangle className="h-4 w-4" />
};

export function ClinicalCalculatorPopup({
  isOpen,
  onClose,
  onCalculationComplete,
  position
}: ClinicalCalculatorPopupProps) {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<'systems' | 'calculators' | 'calculator'>('systems');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedCalculator, setSelectedCalculator] = useState<Calculator | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [calculatorValues, setCalculatorValues] = useState<Record<string, any>>({});
  const [calculationResult, setCalculationResult] = useState<any>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView('systems');
      setSelectedSystem('');
      setSelectedCalculator(null);
      setSearchQuery('');
      setCalculatorValues({});
      setCalculationResult(null);
    }
  }, [isOpen]);

  const handleSystemSelect = (system: string) => {
    setSelectedSystem(system);
    setCurrentView('calculators');
  };

  const handleCalculatorSelect = (calculator: Calculator) => {
    setSelectedCalculator(calculator);
    setCalculatorValues({});
    setCalculationResult(null);
    setCurrentView('calculator');
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setCalculatorValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear previous result when values change
    setCalculationResult(null);
  };

  const handleCalculate = () => {
    if (!selectedCalculator) return;
    
    // Check if all required fields are filled
    const requiredFields = selectedCalculator.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => 
      !calculatorValues[field.id] || calculatorValues[field.id] === ''
    );
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }
    
    const result = selectedCalculator.calculate(calculatorValues);
    setCalculationResult(result);
  };

  const handleInsertResult = () => {
    if (!calculationResult || !selectedCalculator) return;
    
    const resultText = `${selectedCalculator.name}: ${calculationResult.result}${calculationResult.unit ? ' ' + calculationResult.unit : ''} - ${calculationResult.interpretation}${calculationResult.details ? '\n' + calculationResult.details : ''}`;
    
    onCalculationComplete(resultText);
    onClose();
  };

  const renderField = (field: CalculatorField) => {
    const value = calculatorValues[field.id] || '';
    
    switch (field.type) {
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
              {field.unit && <span className="text-gray-500 ml-1">({field.unit})</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              className="w-full"
              data-testid={`input-${field.id}`}
            />
          </div>
        );
        
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
              <SelectTrigger data-testid={`select-${field.id}`}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`${field.id}-${option.value}`}
                    data-testid={`radio-${field.id}-${option.value}`}
                  />
                  <Label htmlFor={`${field.id}-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              data-testid={`checkbox-${field.id}`}
            />
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderSystemsView = () => {
    const filteredSystems = searchQuery 
      ? CALCULATOR_SYSTEMS.filter(system => 
          system.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getCalculatorsBySystem(system).some(calc => 
            calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            calc.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      : CALCULATOR_SYSTEMS;

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('common.search') + " calculators..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {filteredSystems.map((system) => {
            const calculators = getCalculatorsBySystem(system);
            return (
              <Card 
                key={system} 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSystemSelect(system)}
                data-testid={`card-system-${system.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {SYSTEM_ICONS[system]}
                    <h3 className="font-medium text-sm">{system}</h3>
                  </div>
                  <p className="text-xs text-gray-600">{calculators.length} calculators</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {searchQuery && (
          <div className="space-y-2">
            <Separator />
            <h4 className="font-medium text-sm">{t('common.search')} Results</h4>
            {searchCalculators(searchQuery).map((calculator) => (
              <Card 
                key={calculator.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleCalculatorSelect(calculator)}
                data-testid={`card-calculator-${calculator.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{calculator.name}</h4>
                      <p className="text-xs text-gray-600">{calculator.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {calculator.system}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCalculatorsView = () => {
    const calculators = getCalculatorsBySystem(selectedSystem);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentView('systems')}
            data-testid="button-back-to-systems"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('common.back')}
          </Button>
          <div className="flex items-center space-x-2">
            {SYSTEM_ICONS[selectedSystem]}
            <h3 className="font-medium">{selectedSystem}</h3>
          </div>
        </div>
        
        <div className="space-y-3">
          {calculators.map((calculator) => (
            <Card 
              key={calculator.id}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleCalculatorSelect(calculator)}
              data-testid={`card-calculator-${calculator.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CalculatorIcon className="h-4 w-4" />
                  <h4 className="font-medium">{calculator.name}</h4>
                </div>
                <p className="text-sm text-gray-600">{calculator.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderCalculatorView = () => {
    if (!selectedCalculator) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('calculators')}
              data-testid="button-back-to-calculators"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <CalculatorIcon className="h-4 w-4" />
              <h3 className="font-medium">{selectedCalculator.name}</h3>
            </div>
          </div>
          <Badge variant="secondary">
            {selectedCalculator.system}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600">{selectedCalculator.description}</p>
        
        <Separator />
        
        <div className="space-y-4">
          {selectedCalculator.fields.map(renderField)}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={handleCalculate} 
            className="flex-1"
            data-testid="button-calculate"
          >
            Calculate
          </Button>
        </div>
        
        {calculationResult && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800">Calculation Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-semibold text-green-900">
                {calculationResult.result}
                {calculationResult.unit && <span className="ml-1">{calculationResult.unit}</span>}
              </div>
              {calculationResult.interpretation && (
                <div className="text-sm font-medium text-green-800">
                  {calculationResult.interpretation}
                </div>
              )}
              {calculationResult.details && (
                <div className="text-sm text-green-700">
                  {calculationResult.details}
                </div>
              )}
              <Button 
                onClick={handleInsertResult} 
                className="w-full mt-3"
                data-testid="button-insert-result"
              >
                Insert Result into Note
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalculatorIcon className="h-5 w-5" />
            <span>Clinical Calculators</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          {currentView === 'systems' && renderSystemsView()}
          {currentView === 'calculators' && renderCalculatorsView()}
          {currentView === 'calculator' && renderCalculatorView()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}