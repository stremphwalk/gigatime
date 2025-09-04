import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ImagingStudy } from './imaging-autocomplete';
import { IMAGING_STUDIES } from './imaging-autocomplete';

interface ImagingQuickDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (study: ImagingStudy, negatives: string[]) => void;
}

export function ImagingQuickDialog({ isOpen, onClose, onSelect }: ImagingQuickDialogProps) {
  const [q, setQ] = useState('');
  const [study, setStudy] = useState<ImagingStudy | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return IMAGING_STUDIES.filter(it => it.abbreviation.toLowerCase().includes(s) || it.fullName.toLowerCase().includes(s));
  }, [q]);

  const toggle = (neg: string) => {
    setSelected(prev => prev.includes(neg) ? prev.filter(n => n !== neg) : [...prev, neg]);
  };

  const handleInsert = () => {
    if (!study) return;
    onSelect(study, selected);
    onClose();
    setQ(''); setStudy(null); setSelected([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Imaging</DialogTitle>
        </DialogHeader>
        {!study ? (
          <div className="space-y-3">
            <Input placeholder="Search imaging (e.g., CXR, CT HEAD)" value={q} onChange={e => setQ(e.target.value)} />
            <div className="max-h-56 overflow-y-auto space-y-1">
              {filtered.map((it) => (
                <button key={it.abbreviation} className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded flex items-center justify-between" onClick={() => setStudy(it)}>
                  <span className="flex items-center gap-2"><Badge variant="secondary" className="text-xs">{it.abbreviation}</Badge> {it.fullName}</span>
                  <Badge variant="outline" className="text-xs">{it.category}</Badge>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{study.abbreviation}</Badge>
              <span className="font-medium">{study.fullName}</span>
              <Button variant="ghost" size="sm" onClick={() => { setStudy(null); setSelected([]); }}>← Back</Button>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Select pertinent negatives</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {study.pertinentNegatives.map(neg => (
                  <label key={neg} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selected.includes(neg)} onChange={() => toggle(neg)} />
                    <span>{neg}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleInsert} disabled={!study}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

