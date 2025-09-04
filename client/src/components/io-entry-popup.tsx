import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IOEntryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (line: string) => void;
}

export function IOEntryPopup({ isOpen, onClose, onConfirm }: IOEntryPopupProps) {
  const [inMl, setInMl] = useState<string>('');
  const [outMl, setOutMl] = useState<string>('');
  const [period, setPeriod] = useState<string>('24h');

  const formatL = (ml: number) => `${(ml / 1000).toFixed(1)} L`;

  const handleConfirm = () => {
    const inVal = parseFloat(inMl) || 0;
    const outVal = parseFloat(outMl) || 0;
    const net = inVal - outVal;
    const sign = net >= 0 ? '+' : '';
    const line = `I/O last ${period}: In ${formatL(inVal)}, Out ${formatL(outVal)}, Net ${sign}${formatL(Math.abs(net))}`;
    onConfirm(line);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Fluid Balance (I&O)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Intake (mL)</Label>
            <Input value={inMl} onChange={e => setInMl(e.target.value)} placeholder="e.g., 2100" />
          </div>
          <div>
            <Label>Output (mL)</Label>
            <Input value={outMl} onChange={e => setOutMl(e.target.value)} placeholder="e.g., 1800" />
          </div>
          <div>
            <Label>Period</Label>
            <Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="24h" />
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

