import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, 
  Plus, 
  Folder, 
  Settings, 
  Zap, 
  Users, 
  ChevronDown,
  ClipboardList,
  User
} from "lucide-react";
import { useNoteTemplates } from "../hooks/use-notes";
import { useSmartPhrases } from "../hooks/use-smart-phrases";
import { SmartPhraseDialog } from "./smart-phrase-dialog";
import { TemplateBuilderDialog } from "./template-builder-dialog";
import { cn } from "@/lib/utils";
import type { Note } from "@shared/schema";

interface SidebarProps {
  onCreateNote: (templateType?: string) => void;
  onNoteSelect: (note: Note) => void;
  selectedNote: Note | null;
  isLoading: boolean;
  notes: Note[];
  currentView: 'notes' | 'teams';
  onViewChange: (view: 'notes' | 'teams') => void;
}

export function Sidebar({ onCreateNote, onNoteSelect, selectedNote, isLoading, notes, currentView, onViewChange }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    notes: true,
    smartPhrases: true
  });
  
  const { templates } = useNoteTemplates();
  const { phrases } = useSmartPhrases();

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
    <div className="w-80 bg-sidebar-grey border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-medical-teal rounded-lg flex items-center justify-center">
            <ClipboardList className="text-white" size={16} />
          </div>
          <h1 className="text-xl font-semibold text-medical-teal">CharTNote</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <Button
            variant="ghost"
            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
            onClick={() => toggleSection('notes')}
            data-testid="toggle-notes-section"
          >
            <div className="flex items-center space-x-3">
              <FileText className="text-medical-teal" size={16} />
              <span className="font-medium">Notes</span>
            </div>
            <ChevronDown 
              className={cn(
                "text-gray-400 transition-transform",
                expandedSections.notes ? "rotate-0" : "-rotate-90"
              )} 
              size={14} 
            />
          </Button>
          
          {expandedSections.notes && (
            <div className="border-t border-gray-100 p-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs hover:bg-professional-blue hover:text-white"
                onClick={() => onCreateNote()}
                data-testid="button-create-blank-note"
              >
                <Plus size={12} className="mr-2" />
                New Blank Note
              </Button>
              
              <Select onValueChange={(value) => onCreateNote(value)}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-template">
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.type}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs hover:bg-gray-100"
                data-testid="button-notes-library"
              >
                <Folder size={12} className="mr-2" />
                Notes Library
                <Badge variant="secondary" className="ml-auto text-xs">
                  {notes.length}
                </Badge>
              </Button>
              
              <TemplateBuilderDialog />
            </div>
          )}
        </div>

        {/* Smart Phrases Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <Button
            variant="ghost"
            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-lg"
            onClick={() => toggleSection('smartPhrases')}
            data-testid="toggle-smart-phrases-section"
          >
            <div className="flex items-center space-x-3">
              <Zap className="text-medical-teal" size={16} />
              <span className="font-medium">Smart Phrases</span>
            </div>
            <ChevronDown 
              className={cn(
                "text-gray-400 transition-transform",
                expandedSections.smartPhrases ? "rotate-0" : "-rotate-90"
              )} 
              size={14} 
            />
          </Button>
          
          {expandedSections.smartPhrases && (
            <div className="border-t border-gray-100 p-2 space-y-1">
              <SmartPhraseDialog />
              
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-gray-600">Phrase Library</span>
                  <Badge variant="secondary" className="text-xs">
                    {phrases?.length || 0}
                  </Badge>
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {phrases?.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-2">No smart phrases yet</p>
                  ) : (
                    phrases?.map((phrase) => (
                      <div 
                        key={phrase.id}
                        className="text-xs p-2 bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer"
                        data-testid={`phrase-item-${phrase.id}`}
                      >
                        <div className="font-medium">/{phrase.trigger}</div>
                        {phrase.description && (
                          <div className="text-gray-500 mt-1 truncate">{phrase.description}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Teams Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <Button
            variant="ghost"
            className={cn(
              "w-full p-3 text-left flex items-center space-x-3 hover:bg-gray-50 rounded-lg",
              currentView === 'teams' && "bg-blue-50 border border-professional-blue"
            )}
            onClick={() => onViewChange('teams')}
            data-testid="teams-menu-button"
          >
            <Users className="text-medical-teal" size={16} />
            <span className="font-medium">Teams</span>
            <Badge className="ml-auto bg-success-green text-white text-xs">6</Badge>
          </Button>
        </div>

        {/* Recent Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-medium text-sm text-gray-700">Recent Notes</h3>
          </div>
          <div className="p-2 space-y-2 max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="p-2 text-xs text-gray-500">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="p-2 text-xs text-gray-500">No notes yet</div>
            ) : (
              notes.slice(0, 5).map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors",
                    selectedNote?.id === note.id && "bg-blue-50 border border-professional-blue"
                  )}
                  onClick={() => onNoteSelect(note)}
                  data-testid={`note-item-${note.id}`}
                >
                  <div className="text-sm font-medium truncate">{note.title}</div>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span>{formatDate(note.createdAt)}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{formatTime(note.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-professional-blue text-white">
              <User size={16} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Dr. Sarah Mitchell</div>
            <div className="text-xs text-gray-500 truncate">Emergency Medicine</div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
