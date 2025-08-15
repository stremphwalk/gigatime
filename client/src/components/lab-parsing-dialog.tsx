import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown, Check, X, AlertTriangle, FileText, Settings, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  parseLabText, 
  formatLabsForNote, 
  groupLabsByPanel, 
  getAvailableLabsForPanel,
  DEFAULT_LAB_PREFERENCES,
  type ParsedLabValue,
  type UserLabPreferences 
} from "@/lib/lab-parsing";

interface LabParsingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formattedLabs: string) => void;
}

export function LabParsingDialog({ isOpen, onClose, onConfirm }: LabParsingDialogProps) {
  const [rawLabText, setRawLabText] = useState('');
  const [parsedLabs, setParsedLabs] = useState<ParsedLabValue[]>([]);
  const [preferences, setPreferences] = useState<UserLabPreferences>(DEFAULT_LAB_PREFERENCES);
  const [customVisibility, setCustomVisibility] = useState<{ [labName: string]: boolean }>({});
  const [customTrendCounts, setCustomTrendCounts] = useState<{ [labName: string]: number }>({});
  const [activeTab, setActiveTab] = useState<string>('paste');
  
  const queryClient = useQueryClient();
  
  // Load user lab settings
  const { data: userLabSettings } = useQuery({
    queryKey: ['/api/user-lab-settings'],
    enabled: isOpen,
  });
  
  // Mutation to save lab settings
  const saveLabSettingMutation = useMutation({
    mutationFn: async (setting: any) => {
      return fetch('/api/user-lab-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-lab-settings'] });
    },
  });

  // Load saved user settings when dialog opens
  useEffect(() => {
    if (Array.isArray(userLabSettings) && userLabSettings.length > 0) {
      const loadedPreferences = { ...DEFAULT_LAB_PREFERENCES };
      const loadedVisibility: { [labName: string]: boolean } = {};
      const loadedTrendCounts: { [labName: string]: number } = {};
      
      userLabSettings.forEach((setting: any) => {
        // Since we're working with panel-based preferences, we need to ensure compatibility
        loadedVisibility[setting.labId] = setting.isVisible;
        loadedTrendCounts[setting.labId] = setting.trendingCount;
      });
      
      setCustomVisibility(loadedVisibility);
      setCustomTrendCounts(loadedTrendCounts);
    }
  }, [userLabSettings]);

  useEffect(() => {
    if (rawLabText.trim()) {
      const parsed = parseLabText(rawLabText);
      setParsedLabs(parsed);
      
      // Don't reset custom settings when user has saved preferences
      if (!Array.isArray(userLabSettings) || userLabSettings.length === 0) {
        setCustomVisibility({});
        setCustomTrendCounts({});
      }
    } else {
      setParsedLabs([]);
    }
  }, [rawLabText]);

  const handleReset = () => {
    setRawLabText('');
    setParsedLabs([]);
    setCustomVisibility({});
    setCustomTrendCounts({});
    setActiveTab('paste');
  };

  const handleConfirm = () => {
    if (parsedLabs.length === 0) {
      return;
    }

    const formattedLabs = formatLabsForNote(
      parsedLabs, 
      preferences, 
      customVisibility, 
      customTrendCounts
    );
    
    onConfirm(formattedLabs);
    onClose();
    handleReset();
  };

  const toggleLabVisibility = (labName: string, currentlyVisible: boolean) => {
    const newVisibility = !currentlyVisible;
    setCustomVisibility(prev => ({
      ...prev,
      [labName]: newVisibility
    }));
    
    // Save to backend - try to find panel for this lab
    const panel = Object.entries(panels).find(([_, labs]) => 
      labs.some(lab => lab.standardizedName === labName)
    );
    
    if (panel) {
      saveLabSettingMutation.mutate({
        panelId: panel[0],
        labId: labName,
        isVisible: newVisibility,
        trendingCount: getCurrentTrendCount(labName)
      });
    }
  };

  const adjustTrendCount = (labName: string, currentCount: number, delta: number) => {
    const lab = parsedLabs.find(l => l.standardizedName === labName);
    if (!lab) return;
    
    const maxTrends = lab.trendedValues.length;
    const newCount = Math.max(0, Math.min(maxTrends, currentCount + delta));
    
    setCustomTrendCounts(prev => ({
      ...prev,
      [labName]: newCount
    }));
    
    // Save to backend - try to find panel for this lab
    const panel = Object.entries(panels).find(([_, labs]) => 
      labs.some(l => l.standardizedName === labName)
    );
    
    if (panel) {
      saveLabSettingMutation.mutate({
        panelId: panel[0],
        labId: labName,
        isVisible: isLabVisible(labName, panel[0]),
        trendingCount: newCount
      });
    }
  };

  const getCurrentTrendCount = (labName: string): number => {
    return customTrendCounts[labName] || preferences.defaultTrendCount;
  };

  const isLabVisible = (labName: string, panelName: string): boolean => {
    const panelPrefs = preferences.panelSettings[panelName];
    if (!panelPrefs) return true;
    
    const isVisibleByDefault = panelPrefs.visibleByDefault.includes(labName);
    const customSetting = customVisibility[labName];
    
    if (customSetting !== undefined) {
      return customSetting;
    }
    
    return isVisibleByDefault;
  };

  const panels = groupLabsByPanel(parsedLabs);
  const previewText = parsedLabs.length > 0 ? formatLabsForNote(parsedLabs, preferences, customVisibility, customTrendCounts) : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            Lab Values Smart Parser
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <FileText size={14} />
              Paste Labs
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-2" disabled={parsedLabs.length === 0}>
              <Settings size={14} />
              Customize
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2" disabled={parsedLabs.length === 0}>
              <Eye size={14} />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="raw-labs">Paste EHR Lab Results</Label>
              <Textarea
                id="raw-labs"
                value={rawLabText}
                onChange={(e) => setRawLabText(e.target.value)}
                placeholder="Paste your lab results here (e.g., from EHR system)..."
                className="min-h-[200px] font-mono text-sm"
                data-testid="textarea-raw-labs"
              />
            </div>
            
            {parsedLabs.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm font-medium">
                  <Check size={16} />
                  Successfully parsed {parsedLabs.length} lab values
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Found {panels.length} lab panels: {panels.map(p => p.name).join(', ')}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="customize" className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Customize which labs appear in your note and how many trended values to show.
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {panels.map(panel => {
                  const { visible, hidden } = getAvailableLabsForPanel(panel.name, panel.labs);
                  
                  return (
                    <Card key={panel.name}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{panel.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Visible labs */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                            Visible in Note
                          </Label>
                          {visible.concat(panel.labs.filter(lab => customVisibility[lab.standardizedName] === true)).map(lab => {
                            const trendCount = getCurrentTrendCount(lab.standardizedName);
                            const maxTrends = lab.trendedValues.length;
                            
                            return (
                              <div key={lab.standardizedName} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={isLabVisible(lab.standardizedName, panel.name)}
                                    onCheckedChange={() => toggleLabVisibility(lab.standardizedName, isLabVisible(lab.standardizedName, panel.name))}
                                    data-testid={`switch-${lab.standardizedName}`}
                                  />
                                  <div>
                                    <div className="font-medium text-sm">{lab.standardizedName}</div>
                                    <div className="text-xs text-gray-500">
                                      Current: {lab.currentValue}{lab.unit ? ` ${lab.unit}` : ''}
                                      {lab.isAbnormal && (
                                        <Badge variant="destructive" className="ml-2 text-xs px-1 py-0">
                                          <AlertTriangle size={10} className="mr-1" />
                                          Abnormal
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Trends:</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => adjustTrendCount(lab.standardizedName, trendCount, -1)}
                                    disabled={trendCount <= 0}
                                  >
                                    <ChevronDown size={12} />
                                  </Button>
                                  <span className="text-sm font-medium min-w-[20px] text-center">{trendCount}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => adjustTrendCount(lab.standardizedName, trendCount, 1)}
                                    disabled={trendCount >= maxTrends}
                                  >
                                    <ChevronUp size={12} />
                                  </Button>
                                  <span className="text-xs text-gray-500">/{maxTrends}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Hidden but available labs */}
                        {hidden.filter(lab => customVisibility[lab.standardizedName] !== true).length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-500">
                                Available (Hidden by Default)
                              </Label>
                              {hidden.filter(lab => customVisibility[lab.standardizedName] !== true).map(lab => (
                                <div key={lab.standardizedName} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={false}
                                      onCheckedChange={() => toggleLabVisibility(lab.standardizedName, false)}
                                      data-testid={`switch-hidden-${lab.standardizedName}`}
                                    />
                                    <div>
                                      <div className="font-medium text-sm text-gray-600 dark:text-gray-400">{lab.standardizedName}</div>
                                      <div className="text-xs text-gray-500">
                                        Current: {lab.currentValue}{lab.unit ? ` ${lab.unit}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    <EyeOff size={10} className="mr-1" />
                                    Hidden
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-2">
              <Label>Formatted Output Preview</Label>
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[400px]">
                    {previewText ? (
                      <pre className="text-sm whitespace-pre-wrap font-mono">{previewText}</pre>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        No labs parsed yet. Go to "Paste Labs" to start.
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset} data-testid="button-reset">
            <X size={14} className="mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={parsedLabs.length === 0}
              data-testid="button-confirm-labs"
            >
              <Check size={14} className="mr-2" />
              Add to Note
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}