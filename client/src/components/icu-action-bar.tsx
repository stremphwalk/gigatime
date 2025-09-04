import React from 'react';
import { Button } from '@/components/ui/button';
import { Beaker, Camera, Pill, Wind, Droplets, FlaskConical } from 'lucide-react';

interface IcuActionBarProps {
  onLabs: () => void;
  onImaging: () => void;
  onMeds: () => void;
  onDrips: () => void;
  onVent: () => void;
  onIO: () => void;
}

export function IcuActionBar({ onLabs, onImaging, onMeds, onDrips, onVent, onIO }: IcuActionBarProps) {
  return (
    <div className="w-14 flex-shrink-0">
      <div className="sticky top-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex flex-col gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10" title="Labs" onClick={onLabs}>
            <Beaker size={18} />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" title="Imaging" onClick={onImaging}>
            <Camera size={18} />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" title="Medications" onClick={onMeds}>
            <Pill size={18} />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" title="Drips" onClick={onDrips}>
            <FlaskConical size={18} />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" title="Ventilation" onClick={onVent}>
            <Wind size={18} />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" title="I&O" onClick={onIO}>
            <Droplets size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

