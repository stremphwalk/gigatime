import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, Download, Copy } from 'lucide-react';
import { LayoutDensityControls } from '@/components/library/LayoutDensityControls';
import { usePreferences } from '@/hooks/use-preferences';
import { Badge as SBadge } from '@/components/ui/badge';

type CommunityItem = {
  id: string;
  kind: 'template' | 'smart-phrase' | 'autocomplete';
  title: string;
  description?: string | null;
  category?: string | null;
  shortCode?: string | null;
  downloadCount?: number | null;
  createdAt?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail?: string | null;
};

const SYSTEM_CATEGORIES = [
  'general','cardiology','pulmonary','gastrointestinal','neurology','renal','heme-onc','endocrine','infectious-disease','msk','ob','peds','icu','ed'
];

function kindHue(kind: CommunityItem['kind']) {
  if (kind === 'template') return 'bg-[color:var(--brand-50)] border-[color:var(--brand-200)]';
  if (kind === 'smart-phrase') return 'bg-purple-50 border-purple-200';
  return 'bg-green-50 border-green-200';
}

function kindLabel(kind: CommunityItem['kind']) {
  if (kind === 'template') return 'Template';
  if (kind === 'smart-phrase') return 'Smart Phrase';
  return 'Autocomplete';
}

export default function CommunityPage() {
  const [tab, setTab] = useState<'all'|'popular'>('all');
  const [type, setType] = useState<'all'|'templates'|'smart-phrases'|'autocomplete'>('all');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<'newest'|'downloads'>("newest");
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState<'grid'|'list'>('grid');
  const { prefs, updateView } = usePreferences();
  useEffect(() => { if (prefs.view?.community) setLayout(prefs.view.community); }, [prefs.view?.community]);
  useEffect(() => { updateView('community', layout); }, [layout]);
  const pageSize = 20;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [total, setTotal] = useState(0);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tab', tab);
      params.set('type', type);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      const resp = await fetch(`/api/community?${params.toString()}`);
      const data = await resp.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, type, q, category, sort, page]);

  const handleImport = async (it: CommunityItem) => {
    if (!it.shortCode) return;
    const apiType = it.kind === 'template' ? 'note-templates' : (it.kind === 'smart-phrase' ? 'smart-phrases' : 'autocomplete-items');
    try {
      const resp = await fetch(`/api/share/${apiType}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codes: [it.shortCode] }) });
      const data = await resp.json();
      if (data?.results?.[0]?.success) {
        // Refresh counts
        fetchItems();
        alert('Imported successfully');
      } else {
        alert(data?.results?.[0]?.message || 'Import failed');
      }
    } catch (e) {
      alert('Import failed');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const densityCls = 'text-[12px] leading-5';
  const padCls = 'p-2';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Community Library</h1>
          <p className="text-muted-foreground text-sm">Browse public templates, smart phrases, and autocompletes shared by the community.</p>
        </div>

        <Tabs value={tab} onValueChange={(v)=>{ setTab(v as any); setPage(1); setSort(v==='popular'?'downloads':'newest'); }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="mt-4">
          <CardContent className="p-4 flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Search keywords…" value={q} onChange={(e)=>{setQ(e.target.value); setPage(1);}} className="pl-8 w-72"/>
            </div>
            <Separator orientation="vertical" className="h-6"/>
            <Select value={type} onValueChange={(v)=>{ setType(v as any); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="templates">Templates</SelectItem>
                <SelectItem value="smart-phrases">Smart Phrases</SelectItem>
                <SelectItem value="autocomplete">Autocomplete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v)=>{ setCategory(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Category (systems)"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {SYSTEM_CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v)=>{ setSort(v as any); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="downloads">Most Downloaded</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-3">
              <LayoutDensityControls layout={layout} onLayoutChange={setLayout} />
              <span className="text-xs text-muted-foreground">{loading ? 'Loading…' : `${total} items`}</span>
            </div>
          </CardContent>
        </Card>
        {layout === 'grid' ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {items.map((it) => (
              <Card key={`${it.kind}-${it.id}`} className={`border ${kindHue(it.kind)} overflow-hidden`}>
                <CardHeader className={`pb-0 ${padCls}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`truncate font-medium ${densityCls}`}>{it.kind === 'smart-phrase' ? `/${it.title}` : it.title}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">{kindLabel(it.kind)}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {it.category && (<SBadge variant="secondary" className="px-1 py-0 text-[10px]">{it.category}</SBadge>)}
                    <span className="truncate">by {it.userFirstName || ''} {it.userLastName || ''}{!it.userFirstName && !it.userLastName ? (it.userEmail || 'Unknown') : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className={`${padCls} pt-0`}>
                  <p className={`text-muted-foreground ${densityCls} line-clamp-2 min-h-[2.5rem]`}>{it.description || 'No description'}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {it.shortCode && (
                        <>
                          <Badge variant="outline" className="text-[10px]">{it.shortCode}</Badge>
                          <button className="h-6 w-6 rounded-md hover:bg-muted/70 grid place-items-center" title="Copy code" onClick={()=>navigator.clipboard.writeText(it.shortCode!)}><Copy className="h-3 w-3"/></button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{it.downloadCount || 0} downloads</span>
                      <Button size="sm" variant="outline" onClick={()=>handleImport(it)} disabled={!it.shortCode}><Download className="h-4 w-4 mr-1"/>Import</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-4 divide-y rounded-xl border bg-background/40">
            {items.map((it) => (
              <div key={`${it.kind}-${it.id}`} className={`grid grid-cols-12 items-center ${padCls} gap-2`}>
                <div className="col-span-5 min-w-0">
                  <div className={`truncate font-medium ${densityCls}`}>{it.kind === 'smart-phrase' ? `/${it.title}` : it.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <SBadge variant="secondary" className="px-1 py-0 text-[10px]">{kindLabel(it.kind)}</SBadge>
                    {it.category && (<SBadge variant="secondary" className="px-1 py-0 text-[10px]">{it.category}</SBadge>)}
                  </div>
                </div>
                <div className="col-span-4 min-w-0">
                  <p className={`truncate text-muted-foreground ${densityCls}`}>{it.description || 'No description'}</p>
                </div>
                <div className="col-span-3 ml-auto flex items-center justify-end gap-3 text-[11px] text-muted-foreground">
                  {it.shortCode && (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">{it.shortCode}</Badge>
                      <button className="h-6 w-6 rounded-md hover:bg-muted/70 grid place-items-center" title="Copy code" onClick={()=>navigator.clipboard.writeText(it.shortCode!)}><Copy className="h-3 w-3"/></button>
                    </div>
                  )}
                  <span>{it.downloadCount || 0} dl</span>
                  <Button size="sm" variant="outline" onClick={()=>handleImport(it)} disabled={!it.shortCode}><Download className="h-4 w-4 mr-1"/>Import</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
