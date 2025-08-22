import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  Star,
  ArrowUp,
  Search,
  FileText,
  Stethoscope,
  Pill,
  AlertTriangle,
  Home,
  Beaker,
  Camera,
  Target
} from "lucide-react";

interface AutocompleteItem {
  id: string;
  text: string;
  category: string;
  isPriority: boolean;
  dosage?: string;
  frequency?: string;
  description?: string;
}

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
  const [autocompleteItems, setAutocompleteItems] = useState<AutocompleteItem[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    text: '',
    isPriority: false,
    dosage: '',
    frequency: '',
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

  const handleSave = () => {
    if (!formData.text.trim() || !selectedCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newItem: AutocompleteItem = {
      id: editingItem?.id || Date.now().toString(),
      text: formData.text.trim(),
      category: selectedCategory,
      isPriority: formData.isPriority,
      dosage: formData.dosage.trim() || undefined,
      frequency: formData.frequency.trim() || undefined,
      description: formData.description.trim() || undefined,
    };

    if (editingItem) {
      setAutocompleteItems(prev => prev.map(item => 
        item.id === editingItem.id ? newItem : item
      ));
      toast({
        title: "Success",
        description: "Autocomplete item updated successfully",
      });
    } else {
      setAutocompleteItems(prev => [...prev, newItem]);
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
      description: ''
    });
    setIsCreating(false);
    setEditingItem(null);
  };

  const handleEdit = (item: AutocompleteItem) => {
    setEditingItem(item);
    setFormData({
      text: item.text,
      isPriority: item.isPriority,
      dosage: item.dosage || '',
      frequency: item.frequency || '',
      description: item.description || ''
    });
    setIsCreating(true);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this autocomplete item?")) {
      setAutocompleteItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: "Autocomplete item deleted successfully",
      });
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setFormData({
      text: '',
      isPriority: false,
      dosage: '',
      frequency: '',
      description: ''
    });
    setIsCreating(true);
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = SECTION_CATEGORIES.find(cat => cat.value === category);
    const IconComponent = categoryConfig?.icon || Target;
    return <IconComponent size={14} />;
  };

  const getCategoryLabel = (category: string) => {
    return SECTION_CATEGORIES.find(cat => cat.value === category)?.label || category;
  };

  return (
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

        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">Manage Items</TabsTrigger>
            <TabsTrigger value="create">
              {isCreating ? (editingItem ? 'Edit Item' : 'Create New') : 'Create New'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manage" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    id="search"
                    placeholder="Search autocomplete items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-autocomplete-items"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                  <SelectTrigger data-testid="filter-category">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {SECTION_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateNew}
                className="bg-medical-teal hover:bg-medical-teal/90"
                data-testid="button-create-autocomplete-item"
              >
                <Plus size={16} className="mr-2" />
                Create New
              </Button>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <CardTitle className="text-lg font-medium">
                              {item.text}
                            </CardTitle>
                            {item.isPriority && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                <Star size={10} className="mr-1" />
                                Priority
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            {getCategoryIcon(item.category)}
                            <span>{getCategoryLabel(item.category)}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      )}
                      
                      {(item.dosage || item.frequency) && (
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
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(item)}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(item.id)}
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingItem ? 'Edit Autocomplete Item' : 'Create New Autocomplete Item'}
                </CardTitle>
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
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input
                        id="dosage"
                        value={formData.dosage}
                        onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                        placeholder="e.g., 10mg, 5ml"
                        data-testid="input-medication-dosage"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frequency">Frequency</Label>
                      <Input
                        id="frequency"
                        value={formData.frequency}
                        onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                        placeholder="e.g., BID, TID, PRN"
                        data-testid="input-medication-frequency"
                      />
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
                    onClick={() => {
                      setIsCreating(false);
                      setEditingItem(null);
                      setFormData({
                        text: '',
                        isPriority: false,
                        dosage: '',
                        frequency: '',
                        description: ''
                      });
                    }}
                    data-testid="button-cancel-autocomplete"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="bg-medical-teal hover:bg-medical-teal/90"
                    data-testid="button-save-autocomplete"
                  >
                    <Save size={16} className="mr-2" />
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}