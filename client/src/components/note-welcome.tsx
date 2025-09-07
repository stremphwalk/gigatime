import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNoteTemplates } from "@/hooks/use-notes";
import { noteTemplates } from "@/lib/note-templates";
import { FileText, Stethoscope, Star } from "lucide-react";
import { SearchField } from "@/components/library/SearchField";
import { FilterDropdown } from "@/components/library/FilterDropdown";
import { LayoutDensityControls } from "@/components/library/LayoutDensityControls";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/hooks/use-preferences";

interface NoteWelcomeProps {
  onSelectTemplate: (templateType: string) => void;
}

export default function NoteWelcome({ onSelectTemplate }: NoteWelcomeProps) {
  const { templates } = useNoteTemplates();
  const { prefs, savePrefs } = usePreferences();

  const localTemplates = noteTemplates.filter(t => ["blank","icu-admission","icu-progress"].includes(t.type as string));
  const dbTemplates = templates || [];

  type PickerPrefs = {
    layout?: 'grid'|'list';
    pinned?: string[];
    recent?: string[];
    type?: string;
    system?: string;
    search?: string;
  };
  const tp: PickerPrefs = (prefs as any)?.templatePicker || {};
  const [layout, setLayout] = useState<'grid'|'list'>(tp.layout || 'grid');
  const [search, setSearch] = useState<string>(tp.search || '');
  const [typeFilter, setTypeFilter] = useState<string>(tp.type || '');
  const [systemFilter, setSystemFilter] = useState<string>(tp.system || '');
  const [pinned, setPinned] = useState<string[]>(tp.pinned || []);
  const [recent, setRecent] = useState<string[]>(tp.recent || []);

  // Persist picker prefs on change (debounced minimal)
  useEffect(() => {
    const next = {
      ...(prefs || {}),
      templatePicker: { layout, search, type: typeFilter, system: systemFilter, pinned, recent }
    } as any;
    savePrefs(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, search, typeFilter, systemFilter, pinned, recent]);

  // Build unified list of templates
  const all = useMemo(() => {
    const list: Array<{ id: string; source: 'local'|'db'; name: string; type: string; sections?: any[] }>= [];
    for (const t of localTemplates) list.push({ id: `local:${t.type}`, source: 'local', name: t.name, type: t.type as string, sections: (t as any).sections });
    for (const t of dbTemplates) list.push({ id: `db:${t.id}`, source: 'db', name: t.name, type: t.type, sections: (t as any).sections });
    return list;
  }, [localTemplates, dbTemplates]);

  // Infer systems from section names
  const systemOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of all) {
      const secs = Array.isArray(t.sections) ? t.sections : [];
      for (const s of secs) {
        const n = (s.title || s.name || '').toString().toLowerCase();
        if (!n) continue;
        const hit = ['cardio','resp','renal','nephro','neuro','heme','onc','endo','gi','liver','msk','id','imaging','labs'].find(k => n.includes(k));
        if (hit) set.add(hit);
      }
    }
    return Array.from(set).sort();
  }, [all]);

  const types = useMemo(() => Array.from(new Set(all.map(t => t.type))).sort(), [all]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const res = all.filter(t => {
      if (typeFilter && t.type !== typeFilter) return false;
      if (systemFilter) {
        const secs = Array.isArray(t.sections) ? t.sections : [];
        const hasSys = secs.some(s => (s.title || s.name || '').toString().toLowerCase().includes(systemFilter));
        if (!hasSys) return false;
      }
      if (q && !(t.name.toLowerCase().includes(q) || t.type.toLowerCase().includes(q))) return false;
      return true;
    });
    // Sort pinned first, then recent, then name
    return res.sort((a,b) => {
      const ap = pinned.includes(a.id) ? 1 : 0;
      const bp = pinned.includes(b.id) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const ar = recent.indexOf(a.id);
      const br = recent.indexOf(b.id);
      if (ar !== -1 || br !== -1) {
        if (ar === -1) return 1;
        if (br === -1) return -1;
        return ar - br;
      }
      return a.name.localeCompare(b.name);
    });
  }, [all, search, typeFilter, systemFilter, pinned, recent]);

  const togglePin = (id: string) => {
    setPinned(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleChoose = (t: { id: string; type: string }) => {
    // update recent list (most-recent-first, unique, cap 10)
    setRecent(prev => {
      const next = [t.id, ...prev.filter(x => x !== t.id)];
      return next.slice(0, 10);
    });
    onSelectTemplate(t.type);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Stethoscope size={20} className="text-medical-teal dark:text-blue-400" />
              Create a New Note
            </h2>
            <p className="text-muted-foreground text-xs">Choose a note type or search by system</p>
          </div>
        </div>

        <Card className="border-slate-200/60 bg-white/90 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800 dark:backdrop-blur-none">
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <SearchField value={search} onChange={setSearch} placeholder="Search templates…" />
            <FilterDropdown label="Type" options={types.map(t=>({ value: t, label: t }))} value={typeFilter} onChange={setTypeFilter} menuLabel="Filter by type" />
            <FilterDropdown label="System" options={systemOptions.map(s=>({ value: s, label: s }))} value={systemFilter} onChange={setSystemFilter} menuLabel="Filter by system" />
            <div className="ml-auto">
              <LayoutDensityControls layout={layout} onLayoutChange={setLayout} />
            </div>
          </CardContent>
        </Card>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.length} templates</span>
          {pinned.length > 0 && <><span>•</span><span>Pinned: {pinned.length}</span></>}
          {recent.length > 0 && <><span>•</span><span>Recent: {recent.length}</span></>}
        </div>

        {layout === 'grid' ? (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map(t => (
              <Card key={t.id} className="group overflow-hidden border-slate-200/60 bg-white/90 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800 dark:backdrop-blur-none transition-shadow hover:shadow-sm cursor-pointer" onClick={() => handleChoose(t)}>
                <CardHeader className="px-3 pt-3 pb-1 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-medical-teal/10 dark:bg-blue-500/10 grid place-items-center">
                      <FileText size={14} className="text-medical-teal dark:text-blue-400" />
                    </div>
                    <CardTitle className="truncate text-sm">{t.name}</CardTitle>
                  </div>
                  <button className={`h-7 w-7 rounded-md grid place-items-center ${pinned.includes(t.id) ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`} title={pinned.includes(t.id)?'Unpin':'Pin'} onClick={(e)=>{e.stopPropagation(); togglePin(t.id);}}>
                    <Star size={14} fill={pinned.includes(t.id)?'currentColor':'none'} />
                  </button>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="secondary" className="px-1 py-0 text-[10px]">{t.type}</Badge>
                    {t.source === 'local' ? <Badge variant="outline" className="px-1 py-0 text-[10px]">Built-in</Badge> : <Badge variant="outline" className="px-1 py-0 text-[10px]">Custom</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-3 divide-y rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800 dark:backdrop-blur-none">
            {filtered.map(t => (
              <div key={t.id} className="grid grid-cols-12 items-center p-2 gap-2 hover:bg-muted/40 cursor-pointer" onClick={()=>handleChoose(t)}>
                <div className="col-span-7 min-w-0 flex items-center gap-2">
                  <FileText size={14} className="text-medical-teal" />
                  <span className="truncate text-[12px] leading-5">{t.name}</span>
                </div>
                <div className="col-span-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="secondary" className="px-1 py-0 text-[10px]">{t.type}</Badge>
                  {t.source === 'local' ? <Badge variant="outline" className="px-1 py-0 text-[10px]">Built-in</Badge> : <Badge variant="outline" className="px-1 py-0 text-[10px]">Custom</Badge>}
                </div>
                <div className="col-span-2 ml-auto flex items-center justify-end">
                  <button className={`h-7 w-7 rounded-md grid place-items-center ${pinned.includes(t.id) ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'}`} title={pinned.includes(t.id)?'Unpin':'Pin'} onClick={(e)=>{e.stopPropagation(); togglePin(t.id);}}>
                    <Star size={14} fill={pinned.includes(t.id)?'currentColor':'none'} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button onClick={() => handleChoose({ id: 'local:blank', type: 'blank' })} className="bg-medical-teal hover:bg-medical-teal/90">
            Start from Blank
          </Button>
        </div>
      </div>
    </div>
  );
}
