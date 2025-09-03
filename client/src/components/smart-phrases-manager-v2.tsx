import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Zap, Calendar, MousePointer, ChevronRight, Download } from "lucide-react";
import { SearchField } from "@/components/library/SearchField";
import { FilterDropdown } from "@/components/library/FilterDropdown";
import { LayoutDensityControls } from "@/components/library/LayoutDensityControls";
import { ActionButtons as SharedActions } from "@/components/library/ActionButtons";
import { FlexibleSmartPhraseBuilder } from "./flexible-smart-phrase-builder";
import { ImportSmartPhraseDialog } from "./import-smart-phrase-dialog";

export function SmartPhrasesManager() {
  const [activeTab, setActiveTab] = useState<"library" | "create" | "edit">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [density, setDensity] = useState<"compact" | "cozy">("compact");
  const [editingPhrase, setEditingPhrase] = useState<any>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { phrases, createPhrase, updatePhrase, deletePhrase, isCreating } = useSmartPhrases();
  const { toast } = useToast();

  const filteredPhrases = (phrases || []).filter(phrase => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q || phrase.trigger.toLowerCase().includes(q) || phrase.content.toLowerCase().includes(q) || phrase.description?.toLowerCase().includes(q) || phrase.category?.toLowerCase().includes(q);
    const matchesCategory = !category || phrase.category === category;
    return matchesQuery && matchesCategory;
  });

  const handleCreateNew = () => {
    setEditingPhrase(null);
    setActiveTab("create");
  };

  const handleEdit = (phrase: any) => {
    setEditingPhrase(phrase);
    setActiveTab("edit");
  };

  const handleDelete = async (phraseId: string) => {
    if (window.confirm("Are you sure you want to delete this phrase?")) {
      try {
        await deletePhrase(phraseId);
        toast({
          title: "Success",
          description: "Smart phrase deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete smart phrase",
          variant: "destructive",
        });
      }
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingPhrase) {
        await updatePhrase({ id: editingPhrase.id, ...data });
        toast({
          title: "Success",
          description: "Smart phrase updated successfully",
        });
      } else {
        await createPhrase(data);
        toast({
          title: "Success", 
          description: "Smart phrase created successfully",
        });
      }
      setActiveTab("library");
      setEditingPhrase(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save smart phrase",
        variant: "destructive",
      });
    }
  };

  const getElementTypeIcon = (type: string) => {
    switch (type) {
      case 'multipicker': return <MousePointer size={10} />;
      case 'nested_multipicker': return <ChevronRight size={10} />;
      case 'date': return <Calendar size={10} />;
      default: return <Zap size={10} />;
    }
  };

  const getElementTypeColor = (type: string) => {
    switch (type) {
      case 'multipicker': return "bg-blue-50 text-blue-700 border-blue-200";
      case 'nested_multipicker': return "bg-purple-50 text-purple-700 border-purple-200";  
      case 'date': return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  if (activeTab === "create" || activeTab === "edit") {
    return (
      <div className="h-full overflow-hidden">
        <FlexibleSmartPhraseBuilder
          initialData={editingPhrase ? {
            trigger: editingPhrase.trigger,
            content: editingPhrase.content,
            description: editingPhrase.description || "",
            category: editingPhrase.category || "general",
            elements: editingPhrase.elements || []
          } : undefined}
          onSave={handleSave}
          onCancel={() => setActiveTab("library")}
          isLoading={isCreating}
        />
      </div>
    );
  }

  const categories = Array.from(new Set((phrases || []).map(p => p.category).filter(Boolean))) as string[];
  const densityCls = density === 'compact' ? 'text-[12px] leading-5' : 'text-sm';
  const padCls = density === 'compact' ? 'p-2' : 'p-3';

  function ActionButtons({ phrase }: { phrase: any }) {
    return (
      <div className="flex items-center gap-1 opacity-80">
        <Tooltip><TooltipTrigger asChild><button className="h-7 w-7 rounded-md hover:bg-muted/70 grid place-items-center" onClick={() => handleEdit(phrase)}><Edit2 className="h-4 w-4"/></button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><button className="h-7 w-7 rounded-md hover:bg-rose-600/10 text-rose-600 grid place-items-center" onClick={() => handleDelete(phrase.id)}><Trash2 className="h-4 w-4"/></button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
      </div>
    );
  }

  function PhraseCard({ phrase }: { phrase: any }) {
    return (
      <Card className="group overflow-hidden border-muted/60 transition-shadow hover:shadow-sm">
        <CardHeader className={`flex flex-row items-start justify-between ${padCls}`}>
          <div className="min-w-0">
            <CardTitle className={`truncate font-medium ${densityCls}`}>/{phrase.trigger}</CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] leading-4">{phrase.category || 'general'}</Badge>
              {(Array.isArray(phrase.elements) && phrase.elements.length > 0) ? (
                <Badge variant="outline" className={`text-[10px] ${getElementTypeColor(phrase.elements[0].type)}`}>{getElementTypeIcon(phrase.elements[0].type)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200"><Zap size={10} className="mr-1"/>Text</Badge>
              )}
            </div>
          </div>
          <SharedActions onEdit={() => handleEdit(phrase)} onDelete={() => handleDelete(phrase.id)} />
        </CardHeader>
        <CardContent className={`${padCls} pt-0`}>
          <p className={`line-clamp-2 text-muted-foreground ${densityCls}`}>{phrase.content}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{Array.isArray(phrase.elements) ? phrase.elements.length : 0} interactive • {phrase.content.length} chars</span>
            {/* updatedAt is not tracked; omit */}
          </div>
        </CardContent>
      </Card>
    );
  }

  function PhraseRow({ phrase }: { phrase: any }) {
    return (
      <div className={`grid grid-cols-12 items-center ${padCls} gap-2 hover:bg-muted/40`}>
        <div className="col-span-4 flex items-center gap-2 min-w-0">
          <span className={`truncate font-medium ${densityCls}`}>/{phrase.trigger}</span>
        </div>
        <div className="col-span-4 min-w-0">
          <p className={`truncate text-muted-foreground ${densityCls}`}>{phrase.description || phrase.content}</p>
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] leading-4">{phrase.category || 'general'}</Badge>
        </div>
        <div className="col-span-2 ml-auto flex items-center justify-end gap-3 text-[11px] text-muted-foreground">
          <span>{Array.isArray(phrase.elements) ? phrase.elements.length : 0} el</span>
          <span>{phrase.content.length} ch</span>
          <SharedActions onEdit={() => handleEdit(phrase)} onDelete={() => handleDelete(phrase.id)} />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        <div className="border-b border-gray-200 p-4 bg-white">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Smart Phrases</h1>
              <p className="text-muted-foreground text-xs">Manage flexible phrases with interactive elements</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowImportDialog(true)} data-testid="button-import-phrase"><Download className="h-4 w-4"/>Import</Button>
              <Button size="sm" className="gap-2" onClick={handleCreateNew} data-testid="button-create-phrase"><Plus className="h-4 w-4"/>New Phrase</Button>
            </div>
          </div>

          <Card className="border-muted/60">
            <CardContent className={`flex flex-wrap items-center gap-2 ${padCls}`}>
              <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search phrases…" />
              <Separator orientation="vertical" className="h-6"/>
              <FilterDropdown label="Category" options={categories.map(c=>({ value: c, label: c }))} value={category} onChange={setCategory} menuLabel="Filter by category" />
              <LayoutDensityControls layout={layout} onLayoutChange={setLayout} density={density} onDensityChange={setDensity} />
            </CardContent>
          </Card>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{filteredPhrases.length} phrases</span>
            {category && (<><span>•</span><span>Category:</span><Badge variant="outline" className="px-1 py-0 text-[10px]">{category}</Badge></>)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredPhrases.length === 0 ? (
            <div className="text-center py-12">
              <Zap size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No phrases found' : 'No smart phrases yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first flexible smart phrase to speed up documentation'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateNew} data-testid="button-create-first-phrase">
                  <Plus size={16} className="mr-2" />
                  Create Your First Phrase
                </Button>
              )}
            </div>
          ) : (
            layout === 'grid' ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPhrases.map((p) => (
                  <PhraseCard key={p.id} phrase={p} />
                ))}
              </div>
            ) : (
              <div className="mt-3 divide-y rounded-xl border bg-background/40">
                {filteredPhrases.map((p) => (
                  <PhraseRow key={p.id} phrase={p} />
                ))}
              </div>
            )
          )}
        </div>
        <ImportSmartPhraseDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
      </div>
    </TooltipProvider>
  );
}
