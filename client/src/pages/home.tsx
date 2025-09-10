import { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/sidebar";
import { NoteEditor } from "../components/note-editor";
import NoteWelcome from "../components/note-welcome";
import { TeamManagement } from "@/components/team-management";
import { SmartPhrasesManager } from "../components/smart-phrases-manager-v2";
import { TemplateBuilderManager } from "../components/template-builder-manager";
import { AutocompleteBuilder } from "../components/autocomplete-builder";
import { useNotes } from "../hooks/use-notes";
import CommunityPage from "./community";
import SettingsPage from "./settings";
import NotesLibrary from "./notes-library";
import { RunListView } from "@/components/run-list-view";
import { apiRequest } from "@/lib/queryClient";
import { ConfirmLeaveModal } from "@/components/confirm-leave-modal";
import type { Note } from "@shared/schema";
import { useLocation } from "wouter";

export default function Home() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [notesPanelMode, setNotesPanelMode] = useState<'welcome' | 'editor'>('welcome');
  const [initialTemplateType, setInitialTemplateType] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'notes' | 'teams' | 'smart-phrases' | 'template-builder' | 'autocomplete-builder' | 'community' | 'settings' | 'notes-library' | 'run-list'>('notes');
  const { notes, isLoading } = useNotes();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [location, navigate] = useLocation();
  const currentPathRef = useRef<string>(location);
  const suppressGuardRef = useRef(false);

  // Initialize default templates and phrases on first load
  useEffect(() => {
    const initializeDefaults = async () => {
      try {
        await apiRequest("POST", "/api/init");
        await apiRequest("POST", "/api/init-user");
      } catch (error) {
        console.log("Defaults already initialized or error occurred");
      }
    };
    initializeDefaults();
  }, []);

  // Warn on browser/tab close if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Track current path for route guard
  useEffect(() => {
    currentPathRef.current = location;
  }, [location]);

  // Intercept SPA route changes (pushState/replaceState) and back/forward (popstate)
  useEffect(() => {
    const origPushState = history.pushState.bind(history);
    const origReplaceState = history.replaceState.bind(history);

    function guardIfNeeded(url?: string | URL | null) {
      if (suppressGuardRef.current || !hasUnsavedChanges) return false;
      try {
        if (!url) return true;
        const u = new URL(String(url), window.location.origin);
        const next = u.pathname + u.search + u.hash;
        const curr = window.location.pathname + window.location.search + window.location.hash;
        return next !== curr;
      } catch {
        return hasUnsavedChanges;
      }
    }

    history.pushState = function (data: any, title: string, url?: string | URL | null) {
      if (guardIfNeeded(url)) {
        const u = url ? new URL(String(url), window.location.origin) : null;
        setPendingPath(u ? u.pathname + u.search + u.hash : null);
        setConfirmOpen(true);
        return;
      }
      return origPushState(data, title, url as any);
    } as any;

    history.replaceState = function (data: any, title: string, url?: string | URL | null) {
      if (guardIfNeeded(url)) {
        const u = url ? new URL(String(url), window.location.origin) : null;
        setPendingPath(u ? u.pathname + u.search + u.hash : null);
        setConfirmOpen(true);
        return;
      }
      return origReplaceState(data, title, url as any);
    } as any;

    const onPopState = () => {
      if (suppressGuardRef.current || !hasUnsavedChanges) return;
      const attempted = window.location.pathname + window.location.search + window.location.hash;
      setPendingPath(attempted);
      // Revert to current and prompt
      suppressGuardRef.current = true;
      navigate(currentPathRef.current);
      setTimeout(() => { suppressGuardRef.current = false; }, 0);
      setConfirmOpen(true);
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      history.pushState = origPushState as any;
      history.replaceState = origReplaceState as any;
      window.removeEventListener('popstate', onPopState);
    };
  }, [hasUnsavedChanges, navigate]);

  const handleCreateNote = (templateType?: string) => {
    const doIt = () => {
      setSelectedNote(null);
      setIsCreatingNote(true);
      setInitialTemplateType(templateType || null);
      setNotesPanelMode('welcome');
      setCurrentView('notes');
    };
    if (hasUnsavedChanges) {
      setPendingAction(() => doIt);
      setConfirmOpen(true);
    } else {
      doIt();
    }
  };

  const handleNoteSelect = (note: Note) => {
    const doIt = () => {
      setSelectedNote(note);
      setIsCreatingNote(false);
      setNotesPanelMode('editor');
      setCurrentView('notes');
    };
    if (hasUnsavedChanges) {
      setPendingAction(() => doIt);
      setConfirmOpen(true);
    } else {
      doIt();
    }
  };

  const handleNoteSaved = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
  };

  const handleViewChange = (view: 'notes' | 'teams' | 'smart-phrases' | 'template-builder' | 'autocomplete-builder' | 'community' | 'settings' | 'notes-library' | 'run-list') => {
    const doIt = () => {
      setCurrentView(view);
      if (view === 'teams' || view === 'smart-phrases' || view === 'template-builder' || view === 'settings' || view === 'notes-library') {
        setSelectedNote(null);
        setIsCreatingNote(false);
      }
    };
    if (hasUnsavedChanges && view !== currentView) {
      setPendingAction(() => doIt);
      setConfirmOpen(true);
    } else {
      doIt();
    }
  };

  return (
    <div className="flex h-screen bg-clinical-white dark:bg-gray-900 text-text-primary dark:text-gray-100 overflow-hidden">
      <Sidebar 
        onCreateNote={handleCreateNote}
        onNoteSelect={handleNoteSelect}
        selectedNote={selectedNote}
        isLoading={isLoading}
        notes={notes || []}
        currentView={currentView as any}
        onViewChange={handleViewChange as any}
      />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 dark:bg-gray-900">
        {currentView === 'notes' ? (
          notesPanelMode === 'welcome' ? (
            <NoteWelcome
              onSelectTemplate={(type) => {
                setInitialTemplateType(type);
                setIsCreatingNote(true);
                setSelectedNote(null);
                setNotesPanelMode('editor');
              }}
            />
          ) : (
            <NoteEditor 
              note={selectedNote}
              isCreating={isCreatingNote}
              onNoteSaved={handleNoteSaved}
              initialTemplateType={initialTemplateType || undefined}
              onDirtyChange={setHasUnsavedChanges}
              onRequestReturn={() => handleCreateNote()}
              onRequestOpenNote={(id) => {
                const target = (notes || []).find(n => n.id === id);
                if (target) handleNoteSelect(target);
              }}
            />
          )
        ) : currentView === 'teams' ? (
          <div className="flex-1 overflow-y-auto">
            <TeamManagement />
          </div>
        ) : currentView === 'smart-phrases' ? (
          <SmartPhrasesManager />
        ) : currentView === 'template-builder' ? (
          <TemplateBuilderManager />
        ) : currentView === 'autocomplete-builder' ? (
          <AutocompleteBuilder />
        ) : currentView === 'community' ? (
          <CommunityPage />
        ) : currentView === 'settings' ? (
          <SettingsPage />
        ) : currentView === 'notes-library' ? (
          <NotesLibrary onOpenNote={handleNoteSelect} />
        ) : currentView === 'run-list' ? (
          <RunListView onDirtyChange={setHasUnsavedChanges} />
        ) : null}
        <ConfirmLeaveModal 
          open={confirmOpen}
          onCancel={() => { setConfirmOpen(false); setPendingAction(null); setPendingPath(null); }}
          onConfirm={() => { 
            setConfirmOpen(false); 
            const act = pendingAction; 
            const path = pendingPath; 
            setPendingAction(null); 
            setPendingPath(null);
            setHasUnsavedChanges(false);
            if (act) { act(); }
            if (path) {
              suppressGuardRef.current = true;
              navigate(path);
              setTimeout(() => { suppressGuardRef.current = false; }, 0);
            }
          }}
        />
      </div>
    </div>
  );
}
