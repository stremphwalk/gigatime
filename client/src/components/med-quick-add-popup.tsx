import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { searchMedications, type MedicationInfo } from '@/lib/medications';
import { Badge } from '@/components/ui/badge';
import { Pill } from 'lucide-react';
import { useAutocompleteItems } from '@/hooks/use-autocomplete-items';

interface MedQuickAddPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (line: string) => void;
  dripsOnly?: boolean;
}

export function MedQuickAddPopup({ isOpen, onClose, onConfirm, dripsOnly }: MedQuickAddPopupProps) {
  const [query, setQuery] = useState('');
  const [dose, setDose] = useState('');
  const [freq, setFreq] = useState('');
  const [results, setResults] = useState<MedicationInfo[]>([]);
  const [selected, setSelected] = useState<MedicationInfo | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState<null | { text: string; dosages?: string[]; freqs?: string[] }>(null);
  const { items: customItems } = useAutocompleteItems('medications');
  const [customSelDose, setCustomSelDose] = useState<string>('');
  const [customSelFreq, setCustomSelFreq] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setQuery(''); setDose(''); setFreq(''); setResults([]); setSelected(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      let list = searchMedications(query, 8);
      if (dripsOnly) {
        list = list.filter(m => /norepinephrine|levophed|epinephrine|vasopressin|dopamine|dobutamine|phenylephrine/i.test(m.name));
      }
      setResults(list);
    } else {
      setResults([]);
    }
  }, [query, dripsOnly]);

  const customSuggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [] as typeof customItems;
    return customItems
      .filter(item => item.text.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q))
      .sort((a, b) => Number(b.isPriority) - Number(a.isPriority))
      .slice(0, 6);
  }, [customItems, query]);

  const buildLine = () => {
    const base = selected ? selected.name : query;
    const full = [base, dose, freq].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    return full;
  };

  const handleConfirm = () => {
    let line = '';
    if (showCustomPicker) {
      line = [showCustomPicker.text, customSelDose, customSelFreq].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    } else {
      line = buildLine();
    }
    if (!line) return;
    onConfirm(line);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{dripsOnly ? 'Add Drip' : 'Add Medication'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={query} onChange={e => { setQuery(e.target.value); setSelected(null); }} placeholder={dripsOnly ? 'e.g., Norepinephrine' : 'Search medication or type free-form'} />
          {(customSuggestions.length > 0 || results.length > 0) && (
            <Card>
              <CardContent className="p-0 max-h-64 overflow-y-auto">
                {customSuggestions.length > 0 && (
                  <>
                    <div className="p-2 bg-purple-50 border-b flex items-center gap-2 text-xs font-medium text-purple-700"><Pill size={14} className="text-purple-600"/> Custom</div>
                    {customSuggestions.map((item) => (
                      <button key={item.id} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-2" onClick={() => {
                        if (item.dosageOptions?.length || item.frequencyOptions?.length) {
                          setShowCustomPicker({ text: item.text, dosages: item.dosageOptions, freqs: item.frequencyOptions });
                        } else {
                          onConfirm([item.text, item.dosage, item.frequency].filter(Boolean).join(' ').trim());
                          onClose();
                        }
                      }}>
                        <Pill size={16} className="text-purple-600 mt-0.5"/>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.text}</div>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                            {item.dosage && <span>Dosage: {item.dosage}</span>}
                            {item.frequency && <span>Frequency: {item.frequency}</span>}
                            {item.isPriority && <Badge variant="outline" className="text-[10px]">Priority</Badge>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
                {results.length > 0 && (
                  <>
                    <div className="p-2 bg-purple-50 border-b flex items-center gap-2 text-xs font-medium text-purple-700"><Pill size={14} className="text-purple-600"/> Common Medications</div>
                    {results.map((m) => (
                      <button key={m.name} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-2" onClick={() => { setSelected(m); setDose(''); setFreq(''); }}>
                        <Pill size={16} className="text-purple-600 mt-0.5"/>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{m.name}</div>
                          {m.genericName && (<div className="text-xs text-gray-400 italic">{m.genericName}</div>)}
                          {m.brandNames && m.brandNames.length > 0 && (<div className="text-xs text-blue-600">Brand: {m.brandNames.slice(0,2).join(', ')}{m.brandNames.length>2?'...':''}</div>)}
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">{m.subcategory || m.category}</Badge>
                            {m.indication && (<span className="text-xs text-gray-500 truncate max-w-32">{m.indication}</span>)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs px-1 py-0">{m.commonDosages.length} dosages</Badge>
                            <Badge variant="secondary" className="text-xs px-1 py-0">{m.commonFrequencies.length} frequencies</Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* If a medication is selected, show dosage/frequency pickers */}
          {selected && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="text-sm font-medium">{selected.name}</div>
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Dosage</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.commonDosages.map(d => (
                      <Button key={d} variant={dose===d?'default':'outline'} size="sm" className="h-7 text-xs" onClick={() => { setDose(d); if (freq) { onConfirm(buildLine()); onClose(); }}}>{d}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Frequency</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.commonFrequencies.map(f => (
                      <Button key={f} variant={freq===f?'default':'outline'} size="sm" className="h-7 text-xs" onClick={() => { setFreq(f); if (dose) { onConfirm(buildLine()); onClose(); }}}>{f}</Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={dose} onChange={e => setDose(e.target.value)} placeholder="Custom dose" />
                  <Input value={freq} onChange={e => setFreq(e.target.value)} placeholder="Custom frequency" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        {showCustomPicker && (
          <Card className="mt-2">
            <CardContent className="p-3 space-y-3">
              <div className="text-sm font-medium">{showCustomPicker.text}</div>
              {showCustomPicker.dosages && showCustomPicker.dosages.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Dosage</div>
                  <div className="flex flex-wrap gap-1">
                    {showCustomPicker.dosages.map(d => (
                      <Button key={d} variant={customSelDose===d?'default':'outline'} size="sm" className="h-7 text-xs" onClick={() => { setCustomSelDose(d); if (customSelFreq) { onConfirm([showCustomPicker.text, d, customSelFreq].filter(Boolean).join(' ')); onClose(); }}}>{d}</Button>
                    ))}
                  </div>
                </div>
              )}
              {showCustomPicker.freqs && showCustomPicker.freqs.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Frequency</div>
                  <div className="flex flex-wrap gap-1">
                    {showCustomPicker.freqs.map(f => (
                      <Button key={f} variant={customSelFreq===f?'default':'outline'} size="sm" className="h-7 text-xs" onClick={() => { setCustomSelFreq(f); if (customSelDose) { onConfirm([showCustomPicker.text, customSelDose, f].filter(Boolean).join(' ')); onClose(); }}}>{f}</Button>
                    ))}
                  </div>
                </div>
              )}
              {(!showCustomPicker.dosages?.length && !showCustomPicker.freqs?.length) && (
                <div className="text-xs text-gray-500">No options provided. Selecting will insert the medication name only.</div>
              )}
            </CardContent>
          </Card>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
