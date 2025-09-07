import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FileText,
  Plus,
  Folder,
  Settings,
  Zap,
  Users,
  ChevronDown,
  User
} from "lucide-react";
import { useNoteTemplates } from "../hooks/use-notes";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { useSimpleAuth as useAuth } from "../hooks/useSimpleAuth";
import { useTranslation } from 'react-i18next';

import { cn } from "@/lib/utils";
import { ArinoteLogo } from "@/components/arinote-logo";
import type { Note } from "@shared/schema";

interface SidebarProps {
  onCreateNote: (templateType?: string) => void;
  onNoteSelect: (note: Note) => void;
  selectedNote: Note | null;
  isLoading: boolean;
  notes: Note[];
  currentView: 'notes' | 'teams' | 'smart-phrases' | 'template-builder' | 'autocomplete-builder' | 'community' | 'settings' | 'notes-library' | 'run-list';
  onViewChange: (view: 'notes' | 'teams' | 'smart-phrases' | 'template-builder' | 'autocomplete-builder' | 'community' | 'settings' | 'notes-library' | 'run-list') => void;
}

export function Sidebar({ onCreateNote, onNoteSelect, selectedNote, isLoading, notes, currentView, onViewChange }: SidebarProps) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState({
    notes: true,
    smartPhrases: false
  });
  // Notes Library moved to its own page
  
  const { templates } = useNoteTemplates();
  const { phrases } = useSmartPhrases();
  const { user, logout } = useAuth();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-80 bg-sidebar-grey dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 dark:bg-gray-800 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
        <div className="flex items-center justify-start space-x-3">
          <ArinoteLogo size={32} className="flex-shrink-0" />
          <h1 className="text-2xl font-bold arinote-gradient tracking-tight">Arinote</h1>
        </div>
      </div>
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Notes Section */}
        <div className="bg-slate-50/50 dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200/60 dark:border-gray-700">
          <Button
            variant="ghost"
            className={cn(
              "w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
            )}
            onClick={() => toggleSection('notes')}
            data-testid="toggle-notes-section"
          >
            <div className="flex items-center space-x-3">
              <FileText className="text-medical-teal dark:text-blue-400" size={16} />
              <span className="font-medium text-gray-900 dark:text-gray-100">{t('nav.notes')}</span>
            </div>
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                expandedSections.notes && "rotate-180"
              )}
            />
          </Button>
          
          {expandedSections.notes && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs hover:bg-professional-blue hover:text-white dark:hover:bg-blue-600 text-gray-700 dark:text-gray-300"
                onClick={() => onCreateNote()}
                data-testid="button-create-blank-note"
              >
                <Plus size={12} className="mr-2" />
                {t('notes.create')}
              </Button>
              {/* Removed template dropdown from sidebar */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                data-testid="button-notes-library"
                onClick={() => onViewChange('notes-library')}
              >
                <Folder size={12} className="mr-2" />
                {t('notes.library')}
                <Badge variant="secondary" className="ml-auto text-xs dark:bg-gray-600 dark:text-gray-200">
                  {notes.length}
                </Badge>
              </Button>
              
              {/* Run the list */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
                  currentView === 'run-list' && "bg-[color:var(--brand-50)] dark:bg-blue-900/50 border border-[color:var(--brand-200)] dark:border-[color:var(--brand-600)]"
                )}
                onClick={() => onViewChange('run-list')}
                data-testid="button-run-list"
              >
                <FileText size={12} className="mr-2" />
                Run the list
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
                  currentView === 'template-builder' && "bg-[color:var(--brand-50)] dark:bg-blue-900/50 border border-[color:var(--brand-200)] dark:border-[color:var(--brand-600)]"
                )}
                onClick={() => onViewChange('template-builder')}
                data-testid="button-template-builder"
              >
                <Settings size={12} className="mr-2" />
                {t('nav.templates')}
                <Badge variant="secondary" className="ml-auto text-xs dark:bg-gray-600 dark:text-gray-200">
                  {templates?.length || 0}
                </Badge>
              </Button>
            </div>
          )}
        </div>

        {/* Smart Phrases Section */}
        <div className="bg-slate-50/50 dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200/60 dark:border-gray-700">
          <Button
            variant="ghost"
            className={cn(
              "w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
            )}
            onClick={() => toggleSection('smartPhrases')}
            data-testid="toggle-smart-phrases-section"
          >
            <div className="flex items-center space-x-3">
              <Zap className="text-medical-teal dark:text-blue-400" size={16} />
              <span className="font-medium text-gray-900 dark:text-gray-100">{t('nav.smartPhrases')}</span>
            </div>
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                expandedSections.smartPhrases && "rotate-180"
              )}
            />
          </Button>
          
          {expandedSections.smartPhrases && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
                  currentView === 'smart-phrases' && "bg-[color:var(--brand-50)] dark:bg-blue-900/50 border border-[color:var(--brand-200)] dark:border-[color:var(--brand-600)]"
                )}
                onClick={() => onViewChange('smart-phrases')}
                data-testid="button-smart-phrases-library"
              >
                <Zap size={12} className="mr-2" />
                {t('common.create')} {t('nav.smartPhrases')}
                <Badge variant="secondary" className="ml-auto text-xs dark:bg-gray-600 dark:text-gray-200">
                  {phrases?.length || 0}
                </Badge>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
                  currentView === 'autocomplete-builder' && "bg-[color:var(--brand-50)] dark:bg-blue-900/50 border border-[color:var(--brand-200)] dark:border-[color:var(--brand-600)]"
                )}
                onClick={() => onViewChange('autocomplete-builder')}
                data-testid="button-autocomplete-builder"
              >
                <Settings size={12} className="mr-2" />
                Create New Auto-complete
              </Button>
            </div>
          )}
        </div>

        {/* Teams Section (hidden in production) */}
        {!import.meta.env.PROD && (
          <div className="bg-slate-50/50 dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200/60 dark:border-gray-700">
            <Button
              variant="ghost"
              className={cn(
                "w-full p-3 text-left flex items-center justify-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg",
                currentView === 'teams' && "bg-[color:var(--brand-50)] dark:bg-blue-900/50 border border-[color:var(--brand-200)] dark:border-[color:var(--brand-600)]"
              )}
              onClick={() => onViewChange('teams')}
              data-testid="teams-menu-button"
            >
              <Users className="text-medical-teal dark:text-blue-400" size={16} />
              <span className="font-medium text-gray-900 dark:text-gray-100">Teams</span>
            </Button>
          </div>
        )}

        {/* Community Section */}
        <div className="bg-slate-50/50 dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200/60 dark:border-gray-700">
          <Button
            variant="ghost"
            className={cn(
              "w-full p-3 text-left flex items-center justify-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg",
              currentView === 'community' && "bg-[color:var(--brand-50)] dark:bg-blue-900/50 border border-[color:var(--brand-200)] dark:border-[color:var(--brand-600)]"
            )}
            onClick={() => onViewChange('community')}
            data-testid="community-menu-button"
          >
            <Users className="text-medical-teal dark:text-blue-400" size={16} />
            <span className="font-medium text-gray-900 dark:text-gray-100">{t('nav.community')}</span>
          </Button>
        </div>

        {/* Recent Notes */}
        <div className="bg-slate-50/50 dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200/60 dark:border-gray-700">
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">{t('sidebar.recentNotes')}</h3>
          </div>
          <div className="p-2 space-y-2 max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400">{t('sidebar.loadingNotes')}</div>
            ) : notes.length === 0 ? (
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400">{t('sidebar.noNotes')}</div>
            ) : (
              notes.slice(0, 5).map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors",
                    selectedNote?.id === note.id && "bg-[color:var(--brand-50)] dark:bg-blue-900/50 border border-[color:var(--brand-200)] dark:border-[color:var(--brand-600)]"
                  )}
                  onClick={() => onNoteSelect(note)}
                  data-testid={`note-item-${note.id}`}
                >
                  <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{note.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                    <span>{formatDate(note.createdAt)}</span>
                    <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
                    <span>{formatTime(note.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* User Profile */}
      <div className="p-4 border-t border-slate-200/60 dark:border-gray-700 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 dark:bg-gray-800 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-professional-blue dark:bg-blue-600 text-white">
              <User size={16} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.specialty || 'Healthcare Professional'}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* AI toggle removed as per updated requirements */}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  title="User menu"
                  data-testid="user-cog-button"
                >
                  <Settings size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewChange('settings')} data-testid="open-settings">{t('nav.settings')}</DropdownMenuItem>
                <DropdownMenuItem onClick={logout} data-testid="logout-or-switch">{t('nav.logout')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
