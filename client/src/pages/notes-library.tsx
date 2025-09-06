import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotes, useNoteTemplates } from '@/hooks/use-notes';
import type { Note } from '@shared/schema';

interface NotesLibraryProps {
  onOpenNote: (note: Note) => void;
}

export default function NotesLibrary({ onOpenNote }: NotesLibraryProps) {
  const { notes = [], deleteNote } = useNotes();
  const { templates = [] } = useNoteTemplates();

  const [q, setQ] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sort, setSort] = useState<'updated'|'created'>('updated');

  const filtered = useMemo(() => {
    const now = Date.now();
    const inRange = (d?: string | Date | null) => {
      if (!d) return true;
      const t = new Date(d).getTime();
      if (timeFilter === '24h') return now - t <= 24*60*60*1000;
      if (timeFilter === '7d') return now - t <= 7*24*60*60*1000;
      if (timeFilter === '30d') return now - t <= 30*24*60*60*1000;
      return true;
    };
    return (notes || [])
      .filter(n => !templateFilter || n.templateType === templateFilter)
      .filter(n => inRange(n.updatedAt || n.createdAt))
      .filter(n => {
        const k = q.trim().toLowerCase();
        if (!k) return true;
        return (n.title || '').toLowerCase().includes(k);
      })
      .sort((a,b) => {
        const ka = sort === 'updated' ? (a.updatedAt || a.createdAt || 0) : (a.createdAt || 0);
        const kb = sort === 'updated' ? (b.updatedAt || b.createdAt || 0) : (b.createdAt || 0);
        return new Date(kb as any).getTime() - new Date(ka as any).getTime();
      });
  }, [notes, q, templateFilter, timeFilter, sort]);

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Notes Library</h1>
            <p className="text-muted-foreground text-xs">Browse, open, and manage your saved notes</p>
          </div>
        </div>
        <Card className="border-muted/60">
          <CardContent className="flex flex-wrap items-center gap-2 p-2">
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 min-w-[180px] px-2 py-1 text-xs rounded border border-gray-200"
            />
            <Separator orientation="vertical" className="h-6"/>
            <select
              value={templateFilter}
              onChange={(e)=>setTemplateFilter(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-gray-200"
            >
              <option value="">All templates</option>
              {Array.from(new Set(templates?.map(t => t.type) || [])).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={timeFilter}
              onChange={(e)=>setTimeFilter(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-gray-200"
            >
              <option value="all">All time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <select
              value={sort}
              onChange={(e)=>setSort(e.target.value as any)}
              className="px-2 py-1 text-xs rounded border border-gray-200"
            >
              <option value="updated">Sort: Updated</option>
              <option value="created">Sort: Created</option>
            </select>
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} notes</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="divide-y rounded-xl border bg-background/40">
          {filtered.length === 0 ? (
            <div className="p-6 text-xs text-muted-foreground">No notes found</div>
          ) : (
            filtered.map(n => (
              <div key={n.id} className="grid grid-cols-12 items-center p-2 gap-2 hover:bg-muted/40">
                <div className="col-span-6 min-w-0">
                  <div className="truncate font-medium text-[12px] leading-5">{n.title || 'Untitled'}</div>
                  <div className="text-[11px] text-muted-foreground">{formatDate(n.updatedAt || n.createdAt)} {formatTime(n.updatedAt || n.createdAt)}</div>
                </div>
                <div className="col-span-2">
                  <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] leading-4">{n.templateType || 'blank'}</Badge>
                </div>
                <div className="col-span-4 ml-auto flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={()=>onOpenNote(n)}>Open</Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={async ()=>{ if (confirm('Delete this note?')) await deleteNote(n.id); }}>Delete</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

