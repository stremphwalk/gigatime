import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// Removed density tabs
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Zap, Calendar, MousePointer, ChevronRight, Download, Copy } from "lucide-react";
import { SearchField } from "@/components/library/SearchField";
import { FilterDropdown } from "@/components/library/FilterDropdown";
import { LayoutDensityControls } from "@/components/library/LayoutDensityControls";
import { usePreferences } from "@/hooks/use-preferences";
import { ActionButtons as SharedActions } from "@/components/library/ActionButtons";
import { FlexibleSmartPhraseBuilder } from "./flexible-smart-phrase-builder";
import { ImportSmartPhraseDialog } from "./import-smart-phrase-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';

export function SmartPhrasesManager() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"library" | "create" | "edit">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const { prefs, updateView } = usePreferences();
  useEffect(() => { if (prefs.view?.smartPhrases) setLayout(prefs.view.smartPhrases); }, [prefs.view?.smartPhrases]);
  useEffect(() => { updateView('smartPhrases', layout); }, [layout]);
  const [editingPhrase, setEditingPhrase] = useState<any>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportCodes, setExportCodes] = useState<string[] | null>(null);

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
    if (window.confirm(t('common.delete') + " this phrase?")) {
      try {
        await deletePhrase(phraseId);
        toast({
          title: t('success.saved'),
          description: "Smart phrase deleted successfully",
        });
      } catch (error) {
        toast({
          title: t('errors.generic'),
          description: "Failed to delete smart phrase",
          variant: "destructive",
        });
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleExportSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const resp = await fetch('/api/share/smart-phrases/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
      const data = await resp.json();
      setExportCodes(data.codes || []);
    } catch (e) {
      toast({ title: t('errors.generic'), description: 'Could not export codes', variant: 'destructive' });
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingPhrase) {
        await updatePhrase({ id: editingPhrase.id, ...data });
        toast({
          title: t('success.saved'),
          description: "Smart phrase updated successfully",
        });
      } else {
        await createPhrase(data);
        toast({
          title: t('success.saved'),
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
      case 'multipicker': return "bg-[color:var(--brand-50)] text-[color:var(--brand-700)] border-[color:var(--brand-200)]";
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
  const densityCls = 'text-[12px] leading-5';
  const padCls = 'p-2';

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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="mt-0.5" checked={selectedIds.has(phrase.id)} onChange={()=>toggleSelect(phrase.id)} />
              <CardTitle className={`truncate font-medium ${densityCls}`}>/{phrase.trigger}</CardTitle>
              {phrase.shortCode && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">{phrase.shortCode}</Badge>
                  <button className="h-6 w-6 rounded-md hover:bg-muted/70 grid place-items-center" title="Copy code" onClick={()=>navigator.clipboard.writeText(phrase.shortCode)}>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
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
          <input type="checkbox" className="mt-0.5" checked={selectedIds.has(phrase.id)} onChange={()=>toggleSelect(phrase.id)} />
          <span className={`truncate font-medium ${densityCls}`}>/{phrase.trigger}</span>
          {phrase.shortCode && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px]">{phrase.shortCode}</Badge>
              <button className="h-6 w-6 rounded-md hover:bg-muted/70 grid place-items-center" title="Copy code" onClick={()=>navigator.clipboard.writeText(phrase.shortCode)}>
                <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
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
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
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
              <LayoutDensityControls layout={layout} onLayoutChange={setLayout} />
            </CardContent>
          </Card>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{filteredPhrases.length} phrases</span>
            {category && (<><span>•</span><span>Category:</span><Badge variant="outline" className="px-1 py-0 text-[10px]">{category}</Badge></>)}
            <div className="ml-auto flex items-center gap-2">
              <span>Selected: {selectedIds.size}</span>
              <Button size="sm" onClick={handleExportSelected} disabled={selectedIds.size===0}>Export Codes</Button>
            </div>
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
        {exportCodes && (
          <div className="p-4 border-t bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="max-w-2xl mx-auto">
              <Label>Share these codes</Label>
              <Textarea readOnly value={exportCodes.join(' ')} className="mt-1" />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={()=>{ navigator.clipboard.writeText(exportCodes.join(' ')); }}>Copy</Button>
                <Button size="sm" variant="outline" onClick={()=>setExportCodes(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
        <ImportSmartPhraseDialog open={showImportDialog} onOpenChange={(o)=>{ if (!o) setSelectedIds(new Set()); setShowImportDialog(o); }} />
      </div>
    </TooltipProvider>
  );
}
