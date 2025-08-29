import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  X
} from "lucide-react";

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
      const itemData = {
        text: formData.text.trim(),
        category: selectedCategory,
        isPriority: formData.isPriority,
        dosage: formData.dosage.trim() || undefined,
        frequency: formData.frequency.trim() || undefined,
        description: formData.description.trim() || undefined,
      };

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

        {/* Filters and Create Button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingItem ? 'Edit Autocomplete Item' : 'Create New Autocomplete Item'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X size={16} />
                </Button>
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
      </div>
    </div>
  );
}