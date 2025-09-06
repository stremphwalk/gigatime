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
  mode?: 'hidden' | 'icons' | 'full';
  onModeChange?: (mode: 'hidden' | 'icons' | 'full') => void;
}

export function SectionNavigator({ 
  sections, 
  isOpen, 
  onToggle, 
  onSectionSelect, 
  currentSection,
  mode = 'full',
  onModeChange
}: SectionNavigatorProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Auto-detect which section is currently in view
  useEffect(() => {
    if (mode === 'hidden') return;

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
  }, [mode, sections]);

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

    // ICU systems specific
    if (name.includes('neuro')) return '🧠';
    if (name.includes('cardio') || name.includes('cv') || name.includes('cardiovascular')) return '🫀';
    if (name.includes('resp') || name.includes('pulm') || name.includes('respiratory') || name.includes('pulmonary')) return '🫁';
    if (name.includes('gastro') || name === 'gi' || name.includes('abdomen') || name.includes('abdominal')) return '🍽️';
    if (name.includes('nephro') || name.includes('renal') || name.includes('metabolic')) return '💧';
    if (name.includes('infect')) return '🦠';
    if (name.includes('hema') || name.includes('hematology')) return '🩸';

    // General sections
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

  const showIcons = () => {
    if (!onModeChange) return;
    onModeChange('icons');
  };

  const showFull = () => {
    if (!onModeChange) return;
    onModeChange('full');
  };

  const hideCompletely = () => {
    if (!onModeChange) return;
    onModeChange('hidden');
  };

  const halfClose = () => {
    if (!onModeChange) return;
    onModeChange('icons');
  };

  // Hidden mode - completely collapsed
  if (mode === 'hidden') {
    return (
      <div className="w-8 flex-shrink-0">
        <div className="sticky top-6">
          <Button
            onClick={showIcons}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            data-testid="button-section-navigator-show"
          >
            <ChevronDown size={14} className="rotate-[-90deg]" />
          </Button>
        </div>
      </div>
    );
  }

  // Icons mode - slim sidebar with just emojis
  if (mode === 'icons') {
    return (
      <div className="w-12 flex-shrink-0">
        <div className="sticky top-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="p-2">
              <div className="flex flex-col gap-1 mb-2">
                <Button
                  onClick={showFull}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Expand to full view"
                  data-testid="button-section-navigator-expand"
                >
                  <ChevronDown size={12} className="rotate-90" />
                </Button>
                <Button
                  onClick={hideCompletely}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Hide completely"
                  data-testid="button-section-navigator-hide"
                >
                  <X size={10} />
                </Button>
              </div>
              
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {sections.map((section, index) => {
                  const isActive = activeSection === section.id || currentSection === section.id;
                  
                  return (
                    <Button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-8 h-8 p-0 transition-all duration-150",
                        isActive 
                          ? "bg-medical-teal/15 text-medical-teal border border-medical-teal/30" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                      )}
                      title={`${section.name} (Section ${index + 1})`}
                      data-testid={`button-navigate-section-icon-${section.id}`}
                    >
                      <span className="text-sm">{getSectionIcon(section)}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full mode - complete details but more subtle
  return (
    <div className="w-64 flex-shrink-0">
      <div className="sticky top-6">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-lg shadow-sm">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ScrollText size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sections</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={halfClose}
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Half close (icons only)"
                  data-testid="button-section-navigator-half-close"
                >
                  <ChevronDown size={10} className="rotate-[-90deg]" />
                </Button>
                <Button
                  onClick={hideCompletely}
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Full close (hide completely)"
                  data-testid="button-section-navigator-full-close"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>
            
            <div className="space-y-0.5 max-h-[65vh] overflow-y-auto">
              {sections.map((section, index) => {
                const isActive = activeSection === section.id || currentSection === section.id;
                
                return (
                  <Button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left p-2 h-auto min-h-[2rem] transition-all duration-150 rounded-md",
                      isActive 
                        ? "bg-medical-teal/8 text-medical-teal border-l-2 border-medical-teal/60" 
                        : "hover:bg-gray-50/80 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    )}
                    data-testid={`button-navigate-section-${section.id}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-xs">{getSectionIcon(section)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {section.name}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                          Section {index + 1}
                        </div>
                      </div>
                      {isActive && (
                        <ChevronDown size={10} className="text-medical-teal/60 flex-shrink-0" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-100/60 dark:border-gray-700/60">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                {sections.length} sections
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
