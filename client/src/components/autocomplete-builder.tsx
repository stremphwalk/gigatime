import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAutocompleteItems, type AutocompleteItem } from "@/hooks/use-autocomplete-items";
import { 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  Star,
  Search,
  FileText,
  Stethoscope,
  Pill,
  AlertTriangle,
  Home,
  Beaker,
  Camera,
  Target,
  X,
  Grid3X3,
  List,
  ChevronsUpDown,
  Check,
  Copy
} from "lucide-react";
import { SearchField } from "@/components/library/SearchField";
import { FilterDropdown } from "@/components/library/FilterDropdown";
import { LayoutDensityControls } from "@/components/library/LayoutDensityControls";
import { ActionButtons as SharedActions } from "@/components/library/ActionButtons";

const SECTION_CATEGORIES = [
  { value: 'consultation-reasons', label: 'Consultation/Admission Reasons', icon: FileText },
  { value: 'past-medical-history', label: 'Past Medical History', icon: Stethoscope },
  { value: 'allergies', label: 'Allergies', icon: AlertTriangle },
  { value: 'social-history', label: 'Social History', icon: Home },
  { value: 'medications', label: 'Medications', icon: Pill },
  { value: 'physical-exam', label: 'Physical Exam Findings', icon: Stethoscope },
  { value: 'imaging', label: 'Imaging Results', icon: Camera },
  { value: 'labs', label: 'Laboratory Results', icon: Beaker },
] as const;

export function AutocompleteBuilder() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<AutocompleteItem | null>(null);
  const [layout, setLayout] = useState<'grid'|'list'>('grid');
  const [density, setDensity] = useState<'compact'|'cozy'>('compact');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportCodes, setExportCodes] = useState<string[] | null>(null);
  
  const { 
    items: autocompleteItems, 
    isLoading, 
    createItem, 
    updateItem, 
    deleteItem,
    isCreating: isSaving 
  } = useAutocompleteItems();
  
  // Form state
  const [formData, setFormData] = useState({
    text: '',
    isPriority: false,
    dosage: '',
    frequency: '',
    dosageOptions: [] as string[],
    frequencyOptions: [] as string[],
    description: ''
  });

  const { toast } = useToast();

  // Filter items based on search and category
  const filteredItems = autocompleteItems.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const densityCls = density === 'compact' ? 'text-[12px] leading-5' : 'text-sm';
  const padCls = density === 'compact' ? 'p-2' : 'p-3';

  const handleSave = async () => {
    if (!formData.text.trim() || !selectedCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemData: any = {
        text: formData.text.trim(),
        category: selectedCategory,
        isPriority: formData.isPriority,
        dosage: formData.dosage.trim() || undefined,
        frequency: formData.frequency.trim() || undefined,
        description: formData.description.trim() || undefined,
      };

      if (selectedCategory === 'medications') {
        const cleanDosages = Array.from(new Set((formData.dosageOptions || []).map(d => d.trim()).filter(Boolean)));
        const cleanFrequencies = Array.from(new Set((formData.frequencyOptions || []).map(f => f.trim()).filter(Boolean)));
        if (cleanDosages.length > 0) itemData.dosageOptions = cleanDosages;
        if (cleanFrequencies.length > 0) itemData.frequencyOptions = cleanFrequencies;
        if (!itemData.dosage && cleanDosages.length === 1) itemData.dosage = cleanDosages[0];
        if (!itemData.frequency && cleanFrequencies.length === 1) itemData.frequency = cleanFrequencies[0];
      }

      if (editingItem) {
        await updateItem({ id: editingItem.id, ...itemData });
        toast({
          title: "Success",
          description: "Autocomplete item updated successfully",
        });
      } else {
        await createItem(itemData);
        toast({
          title: "Success",
          description: "Autocomplete item created successfully",
        });
      }

      // Reset form
      setFormData({
        text: '',
        isPriority: false,
        dosage: '',
        frequency: '',
        dosageOptions: [],
        frequencyOptions: [],
        description: ''
      });
      setIsCreating(false);
      setEditingItem(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save autocomplete item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: AutocompleteItem) => {
    setEditingItem(item);
    setFormData({
      text: item.text,
      isPriority: item.isPriority,
      dosage: item.dosage || '',
      frequency: item.frequency || '',
      dosageOptions: item.dosageOptions || (item.dosage ? [item.dosage] : []),
      frequencyOptions: item.frequencyOptions || (item.frequency ? [item.frequency] : []),
      description: item.description || ''
    });
    setSelectedCategory(item.category);
    setIsCreating(true);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this autocomplete item?")) {
      try {
        await deleteItem(itemId);
        toast({
          title: "Success",
          description: "Autocomplete item deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete autocomplete item",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setFormData({
      text: '',
      isPriority: false,
      dosage: '',
      frequency: '',
      dosageOptions: [],
      frequencyOptions: [],
      description: ''
    });
    setSelectedCategory('');
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingItem(null);
    setSelectedCategory('');
    setFormData({
      text: '',
      isPriority: false,
      dosage: '',
      frequency: '',
      dosageOptions: [],
      frequencyOptions: [],
      description: ''
    });
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = SECTION_CATEGORIES.find(cat => cat.value === category);
    const IconComponent = categoryConfig?.icon || Target;
    return <IconComponent size={14} />;
  };

  const getCategoryLabel = (category: string) => {
    return SECTION_CATEGORIES.find(cat => cat.value === category)?.label || category;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleExportSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const resp = await fetch('/api/share/autocomplete-items/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    const data = await resp.json();
    setExportCodes(data.codes || []);
  };

  const handleImportCodes = async () => {
    const input = window.prompt('Enter autocomplete codes (comma or space separated)');
    if (!input) return;
    const codes = input.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean);
    if (codes.length === 0) return;
    await fetch('/api/share/autocomplete-items/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codes }) });
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            Loading autocomplete items...
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Autocomplete Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create custom autocomplete options for different note sections. Set priority items to appear at the top of autocomplete lists.
          </p>
        </div>

        {/* Header + Toolbar */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Autocomplete</h2>
            <p className="text-muted-foreground text-xs">Manage custom suggestions for note sections</p>
          </div>
          <Button onClick={handleCreateNew} className="bg-medical-teal hover:bg-medical-teal/90" size="sm" data-testid="button-create-autocomplete-item">
            <Plus size={16} className="mr-2"/>New Item
          </Button>
        </div>
        <Card className="border-muted/60 mb-6">
          <CardContent className={`flex flex-wrap items-center gap-2 ${padCls}`}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Search items…" className="pl-8 w-64"/>
            </div>
            <Separator orientation="vertical" className="h-6"/>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1"><ChevronsUpDown className="h-4 w-4"/>Category</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={()=>setSelectedCategory("")}>{selectedCategory==="" && <Check className="mr-2 h-4 w-4"/>}All</DropdownMenuItem>
                {SECTION_CATEGORIES.map(c => (
                  <DropdownMenuItem key={c.value} onClick={()=>setSelectedCategory(c.value)}>
                    {selectedCategory===c.value && <Check className="mr-2 h-4 w-4"/>}{c.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="ml-auto flex items-center gap-1">
              <Button size="icon" variant={layout==='grid'? 'default':'outline'} className="h-8 w-8" onClick={()=>setLayout('grid')}><Grid3X3 className="h-4 w-4"/></Button>
              <Button size="icon" variant={layout==='list'? 'default':'outline'} className="h-8 w-8" onClick={()=>setLayout('list')}><List className="h-4 w-4"/></Button>
              <Separator orientation="vertical" className="h-6"/>
              <Tabs value={density} onValueChange={(v)=>setDensity(v as any)}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="compact" className="text-xs">Compact</TabsTrigger>
                  <TabsTrigger value="cozy" className="text-xs">Cozy</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{filteredItems.length} items</span>
            {selectedCategory && (<><span>•</span><span>Category:</span><Badge variant="outline" className="px-1 py-0 text-[10px]">{getCategoryLabel(selectedCategory)}</Badge></>)}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span>Selected: {selectedIds.size}</span>
            <Button variant="outline" size="sm" onClick={handleImportCodes}>Import by Codes</Button>
            <Button size="sm" onClick={handleExportSelected} disabled={selectedIds.size===0}>Export Codes</Button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingItem ? 'Edit Autocomplete Item' : 'Create New Autocomplete Item'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {editingItem?.shortCode && (
                    <>
                      <span className="text-xs text-gray-600">Code:</span>
                      <Badge variant="outline">{editingItem.shortCode}</Badge>
                      <Button type="button" size="sm" variant="outline" onClick={()=>navigator.clipboard.writeText(editingItem.shortCode!)}>Copy</Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selection */}
              <div>
                <Label htmlFor="category">Section Category *</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-autocomplete-category">
                    <SelectValue placeholder="Select a section category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_CATEGORIES.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent size={14} />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Input */}
              <div>
                <Label htmlFor="text">Autocomplete Text *</Label>
                <Input
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Enter the text that will appear in autocomplete"
                  data-testid="input-autocomplete-text"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description or notes about this item"
                  className="resize-none"
                  rows={2}
                  data-testid="input-autocomplete-description"
                />
              </div>

              {/* Medication-specific fields */}
              {selectedCategory === 'medications' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <Label htmlFor="dosage">Dosage Options</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="dosage"
                        value={formData.dosage}
                        onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                        placeholder="e.g., 10 mg, 5 mL"
                        data-testid="input-medication-dosage"
                      />
                      <Button type="button" variant="secondary" onClick={() => {
                        const v = formData.dosage.trim();
                        if (!v) return;
                        if ((formData.dosageOptions || []).length >= 20) return;
                        setFormData(prev => ({
                          ...prev,
                          dosage: '',
                          dosageOptions: Array.from(new Set([...(prev.dosageOptions || []), v]))
                        }));
                      }}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.dosageOptions || []).map((opt, idx) => (
                        <Badge key={`${opt}-${idx}`} variant="secondary" className="text-xs flex items-center gap-1">
                          {opt}
                          <button type="button" onClick={() => setFormData(prev => ({
                            ...prev,
                            dosageOptions: (prev.dosageOptions || []).filter((_, i) => i !== idx)
                          }))} aria-label="Remove">×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency Options</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="frequency"
                        value={formData.frequency}
                        onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                        placeholder="e.g., BID, TID, QID, q6h, PRN"
                        data-testid="input-medication-frequency"
                      />
                      <Button type="button" variant="secondary" onClick={() => {
                        const v = formData.frequency.trim();
                        if (!v) return;
                        if ((formData.frequencyOptions || []).length >= 20) return;
                        setFormData(prev => ({
                          ...prev,
                          frequency: '',
                          frequencyOptions: Array.from(new Set([...(prev.frequencyOptions || []), v]))
                        }));
                      }}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['QD','BID','TID','QID','q6h','q8h','PRN','HS'].map(preset => (
                        <Button key={preset} type="button" size="sm" variant="outline" className="text-xs" onClick={() => setFormData(prev => ({
                          ...prev,
                          frequencyOptions: Array.from(new Set([...(prev.frequencyOptions || []), preset]))
                        }))}>{preset}</Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.frequencyOptions || []).map((opt, idx) => (
                        <Badge key={`${opt}-${idx}`} variant="secondary" className="text-xs flex items-center gap-1">
                          {opt}
                          <button type="button" onClick={() => setFormData(prev => ({
                            ...prev,
                            frequencyOptions: (prev.frequencyOptions || []).filter((_, i) => i !== idx)
                          }))} aria-label="Remove">×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Priority Setting */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="priority"
                  checked={formData.isPriority}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPriority: checked }))}
                  data-testid="switch-priority"
                />
                <Label htmlFor="priority" className="flex items-center space-x-2 cursor-pointer">
                  <Star size={14} className="text-yellow-500" />
                  <span>Priority Item (appears at top of autocomplete list)</span>
                </Label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={handleCancel}
                  data-testid="button-cancel-autocomplete"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-medical-teal hover:bg-medical-teal/90"
                  data-testid="button-save-autocomplete"
                >
                  <Save size={16} className="mr-2" />
                  {isSaving ? 'Saving...' : (editingItem ? 'Update Item' : 'Create Item')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        {layout === 'grid' ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No autocomplete items
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedCategory 
                  ? `No items found for ${getCategoryLabel(selectedCategory)}`
                  : 'Create your first autocomplete item to get started'
                }
              </p>
              <Button 
                onClick={handleCreateNew}
                variant="outline"
                data-testid="button-create-first-item"
              >
                <Plus size={16} className="mr-2" />
                Create New Item
              </Button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-muted/60 transition-shadow hover:shadow-sm">
                <CardHeader className={`flex flex-row items-start justify-between ${padCls}`}>
                  <div className="flex items-start justify-between w-full">
                    <div className="mt-1 mr-2">
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={()=>toggleSelect(item.id)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className={`truncate font-medium ${densityCls}`}>
                          {item.text}
                        </CardTitle>
                        {item.isPriority && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                            <Star size={10} className="mr-1" />
                            Priority
                          </Badge>
                        )}
                        {item.shortCode && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px]">{item.shortCode}</Badge>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" title="Copy code" onClick={()=>navigator.clipboard.writeText(item.shortCode!)}>
                              <Copy size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {getCategoryIcon(item.category)}
                        <span>{getCategoryLabel(item.category)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={`${padCls} pt-0 space-y-3`}>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                  
                  {((item.dosage && item.dosage.length) || (item.frequency && item.frequency.length) || (item.dosageOptions && item.dosageOptions.length) || (item.frequencyOptions && item.frequencyOptions.length)) && (
                    <div className="flex flex-wrap gap-2">
                      {item.dosage && (
                        <Badge variant="secondary" className="text-xs">
                          Dosage: {item.dosage}
                        </Badge>
                      )}
                      {item.frequency && (
                        <Badge variant="secondary" className="text-xs">
                          Frequency: {item.frequency}
                        </Badge>
                      )}
                      {item.dosageOptions && item.dosageOptions.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {item.dosageOptions.length} dosage option{item.dosageOptions.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {item.frequencyOptions && item.frequencyOptions.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {item.frequencyOptions.length} frequency option{item.frequencyOptions.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <SharedActions onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} size="sm" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        ) : (
          <div className="mt-3 divide-y rounded-xl border bg-background/40">
            {filteredItems.map(item => (
              <div key={item.id} className={`grid grid-cols-12 items-center ${padCls} gap-2`}>
                <div className="col-span-5 min-w-0 flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={selectedIds.has(item.id)} onChange={()=>toggleSelect(item.id)} />
                  <div className={`truncate font-medium ${densityCls}`}>{item.text}</div>
                  {item.description && <div className={`truncate text-muted-foreground ${densityCls}`}>{item.description}</div>}
                </div>
                <div className="col-span-3 flex items-center gap-1">
                  <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] leading-4">{getCategoryLabel(item.category)}</Badge>
                  {item.isPriority && <Badge variant="outline" className="text-[10px]">Priority</Badge>}
                  {item.shortCode && (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">{item.shortCode}</Badge>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" title="Copy code" onClick={()=>navigator.clipboard.writeText(item.shortCode!)}>
                        <Copy size={12} />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="col-span-4 ml-auto flex items-center justify-end gap-2">
                  {(item.dosageOptions && item.dosageOptions.length > 0) && <Badge variant="secondary" className="text-[10px]">{item.dosageOptions.length} dosages</Badge>}
                  {(item.frequencyOptions && item.frequencyOptions.length > 0) && <Badge variant="secondary" className="text-[10px]">{item.frequencyOptions.length} freqs</Badge>}
                  <SharedActions onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {exportCodes && (
        <div className="mt-3 p-4 border rounded-md bg-white">
          <Label>Share these codes</Label>
          <Textarea readOnly value={exportCodes.join(' ')} className="mt-1" />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={()=>{ navigator.clipboard.writeText(exportCodes.join(' ')); }}>Copy</Button>
            <Button size="sm" variant="outline" onClick={()=>setExportCodes(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
