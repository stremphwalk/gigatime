import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button as UIButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface VentilationSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (line: string) => void;
}

export function VentilationSettingsPopup({ isOpen, onClose, onConfirm }: VentilationSettingsPopupProps) {
  const [mode, setMode] = useState('');
  const [fio2, setFio2] = useState<string>('40');
  const [peep, setPeep] = useState<string>('8');
  const [rr, setRr] = useState<string>('16');
  const [tv, setTv] = useState<string>('6 mL/kg');
  const [ps, setPs] = useState<string>('');
  const [pc, setPc] = useState<string>('');
  const [ie, setIe] = useState<string>('');
  const [pplat, setPplat] = useState<string>('');
  const [pip, setPip] = useState<string>('');
  const [ett, setEtt] = useState<string>('');

  const buildLine = () => {
    const parts: string[] = [];
    parts.push('Vent:');
    if (mode) parts.push(mode);
    if (fio2) parts.push(`FiO2 ${fio2}%`);
    if (peep) parts.push(`PEEP ${peep}`);
    if (rr) parts.push(`RR ${rr}`);
    if (tv) parts.push(`TV ${tv}`);
    if (ps) parts.push(`PS ${ps}`);
    if (pc) parts.push(`PC ${pc}`);
    if (ie) parts.push(`I:E ${ie}`);
    if (pplat) parts.push(`Pplat ${pplat}`);
    if (pip) parts.push(`PIP ${pip}`);
    if (ett) parts.push(`ETT ${ett}`);
    return parts.join(', ');
  };

  const handleConfirm = () => {
    const line = buildLine();
    onConfirm(line);
  };

  // Quick mode suggestions
  const modes = ['AC/VC', 'SIMV', 'PC', 'PSV'];
  const applyMode = (m: string) => setMode(m);

  // Presets
  const applyPreset = (type: 'post-intubation' | 'ards' | 'copd' | 'weaning') => {
    switch (type) {
      case 'post-intubation':
        setMode('AC/VC'); setFio2('40'); setPeep('8'); setRr('16'); setTv('6 mL/kg'); setPs(''); setPc(''); setIe(''); setPplat(''); setPip(''); break;
      case 'ards':
        setMode('AC/VC'); setFio2('40'); setPeep('10'); setRr('18'); setTv('6 mL/kg'); setPs(''); setPc(''); setIe('1:2'); setPplat('≤ 30'); setPip(''); break;
      case 'copd':
        setMode('AC/VC'); setFio2('30'); setPeep('5'); setRr('12'); setTv('6–8 mL/kg'); setPs(''); setPc(''); setIe('1:3'); setPplat(''); setPip(''); break;
      case 'weaning':
        setMode('PSV'); setFio2('30'); setPeep('5'); setRr(''); setTv(''); setPs('10'); setPc(''); setIe(''); setPplat(''); setPip(''); break;
    }
  };

  // FiO2 slider velocity-aware stepping: coarse (5s) when moving fast, fine (1s) when moving slowly
  const fio2LastTimeRef = useRef<number>(0);
  const fio2LastValRef = useRef<number>(Number(fio2) || 40);
  const handleFio2Change = (v: number[]) => {
    const now = performance.now();
    const raw = v[0];
    const lastT = fio2LastTimeRef.current || now;
    const lastV = fio2LastValRef.current;
    const dt = now - lastT;
    const dv = Math.abs(raw - lastV);
    // Heuristic: if user is moving quickly (large value change in short time), snap to nearest 5
    const fast = (dt < 60 && dv >= 2) || dv >= 5;
    const val = fast ? Math.max(21, Math.min(100, Math.round(raw / 5) * 5)) : raw;
    fio2LastTimeRef.current = now;
    fio2LastValRef.current = val;
    setFio2(String(val));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ventilation Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Mode and suggestions */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <Label>Mode</Label>
              <Input value={mode} onChange={e => setMode(e.target.value)} placeholder="AC/VC, PC, PSV, etc." />
            </div>
            <div className="flex gap-2 flex-wrap">
              {modes.map(m => (
                <UIButton key={m} type="button" variant="outline" size="sm" onClick={() => applyMode(m)} className="h-8 text-xs">{m}</UIButton>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            <Badge onClick={() => applyPreset('post-intubation')} className="cursor-pointer" variant="outline">Post-intubation</Badge>
            <Badge onClick={() => applyPreset('ards')} className="cursor-pointer" variant="outline">ARDS (low VT)</Badge>
            <Badge onClick={() => applyPreset('copd')} className="cursor-pointer" variant="outline">COPD</Badge>
            <Badge onClick={() => applyPreset('weaning')} className="cursor-pointer" variant="outline">Weaning (PSV)</Badge>
          </div>

          {/* Sliders for common numeric fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>FiO2 (%)</Label>
                <span className="text-xs text-gray-500">{fio2 || '—'}%</span>
              </div>
              <Slider value={[Number(fio2) || 21]} min={21} max={100} step={1} onValueChange={handleFio2Change} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>PEEP (cmH2O)</Label>
                <span className="text-xs text-gray-500">{peep || '—'}</span>
              </div>
              <Slider value={[Number(peep) || 5]} min={0} max={18} step={1} onValueChange={v => setPeep(String(v[0]))} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>RR (bpm)</Label>
                <span className="text-xs text-gray-500">{rr || '—'}</span>
              </div>
              <Slider value={[Number(rr) || 12]} min={6} max={35} step={1} onValueChange={v => setRr(String(v[0]))} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>PS (cmH2O)</Label>
                <span className="text-xs text-gray-500">{ps || '—'}</span>
              </div>
              <Slider value={[Number(ps) || 0]} min={0} max={20} step={1} onValueChange={v => setPs(String(v[0]))} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>PC (cmH2O)</Label>
                <span className="text-xs text-gray-500">{pc || '—'}</span>
              </div>
              <Slider value={[Number(pc) || 0]} min={0} max={30} step={1} onValueChange={v => setPc(String(v[0]))} />
            </div>
            <div>
              <Label>TV (mL or mL/kg)</Label>
              <Input value={tv} onChange={e => setTv(e.target.value)} placeholder="450 mL or 6 mL/kg" />
            </div>
          </div>

          {/* Remaining text fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>I:E</Label>
              <Input value={ie} onChange={e => setIe(e.target.value)} placeholder="1:2" />
            </div>
            <div>
              <Label>Pplat (cmH2O)</Label>
              <Input value={pplat} onChange={e => setPplat(e.target.value)} placeholder="22" />
            </div>
            <div>
              <Label>PIP (cmH2O)</Label>
              <Input value={pip} onChange={e => setPip(e.target.value)} placeholder="30" />
            </div>
            <div>
              <Label>ETT</Label>
              <Input value={ett} onChange={e => setEtt(e.target.value)} placeholder="7.5 @ 22 cm" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
