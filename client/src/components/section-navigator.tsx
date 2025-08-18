import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollText, ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  name: string;
  type?: string;
}

interface SectionNavigatorProps {
  sections: Section[];
  isOpen: boolean;
  onToggle: () => void;
  onSectionSelect: (sectionId: string) => void;
  currentSection?: string;
}

export function SectionNavigator({ 
  sections, 
  isOpen, 
  onToggle, 
  onSectionSelect, 
  currentSection 
}: SectionNavigatorProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Auto-detect which section is currently in view
  useEffect(() => {
    if (!isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const sectionId = entry.target.getAttribute('data-section-id');
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      { threshold: [0.3, 0.7], rootMargin: '-100px 0px -100px 0px' }
    );

    // Observe all section cards
    const sectionElements = document.querySelectorAll('[data-section-id]');
    sectionElements.forEach((el) => observer.observe(el.closest('.section-card') || el));

    return () => observer.disconnect();
  }, [isOpen, sections]);

  const handleSectionClick = (sectionId: string) => {
    onSectionSelect(sectionId);
    setActiveSection(sectionId);
    
    // Smooth scroll to section
    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (sectionElement) {
      const sectionCard = sectionElement.closest('.section-card');
      if (sectionCard) {
        sectionCard.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  };

  const getSectionIcon = (section: Section) => {
    const name = section.name.toLowerCase();
    const type = section.type;
    
    if (type === 'chiefComplaint' || name.includes('chief complaint') || name.includes('reason')) return '📋';
    if (type === 'historyPresentIllness' || name.includes('hpi') || name.includes('history of present')) return '📖';
    if (type === 'pastMedicalHistory' || name.includes('past medical') || name.includes('pmh')) return '🏥';
    if (type === 'medications' || name.includes('medication') || name.includes('meds')) return '💊';
    if (type === 'allergies' || name.includes('allergies') || name.includes('allergy')) return '⚠️';
    if (type === 'socialHistory' || name.includes('social history') || name.includes('social hx')) return '🏠';
    if (type === 'familyHistory' || name.includes('family history') || name.includes('fhx')) return '👨‍👩‍👧‍👦';
    if (type === 'reviewOfSystems' || name.includes('review of systems') || name.includes('ros')) return '🔍';
    if (type === 'physicalExam' || name.includes('physical') || name.includes('exam')) return '🩺';
    if (type === 'labs' || name.includes('lab') || name.includes('laboratory')) return '🧪';
    if (type === 'imaging' || name.includes('imaging') || name.includes('radiology')) return '📷';
    if (name.includes('assessment') || name.includes('impression')) return '🎯';
    if (name.includes('plan') || name.includes('management')) return '📝';
    return '📄';
  };

  // Always show in sidebar layout
  return (
    <div className="w-full">
      <Card className="shadow-lg border-medical-teal/20 bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText size={16} className="text-medical-teal" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sections</span>
          </div>
          
          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {sections.map((section, index) => {
              const isActive = activeSection === section.id || currentSection === section.id;
              
              return (
                <Button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left p-2 h-auto min-h-[2.5rem] transition-all duration-150",
                    isActive 
                      ? "bg-medical-teal/10 text-medical-teal border-l-2 border-medical-teal" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
                  )}
                  data-testid={`button-navigate-section-${section.id}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm">{getSectionIcon(section)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {section.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Section {index + 1}
                      </div>
                    </div>
                    {isActive && (
                      <ChevronDown size={14} className="text-medical-teal flex-shrink-0" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {sections.length} sections • Click to navigate
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}