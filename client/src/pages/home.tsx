import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { NoteEditor } from "../components/note-editor";
import { TeamCollaboration } from "../components/team-collaboration";
import { useNotes } from "../hooks/use-notes";
import { apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";

export default function Home() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [currentView, setCurrentView] = useState<'notes' | 'teams'>('notes');
  const { notes, isLoading } = useNotes();

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

  const handleCreateNote = (templateType?: string) => {
    setSelectedNote(null);
    setIsCreatingNote(true);
    setCurrentView('notes');
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
    setCurrentView('notes');
  };

  const handleNoteSaved = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
  };

  const handleViewChange = (view: 'notes' | 'teams') => {
    setCurrentView(view);
    if (view === 'teams') {
      setSelectedNote(null);
      setIsCreatingNote(false);
    }
  };

  return (
    <div className="flex h-screen bg-clinical-white text-text-primary overflow-hidden">
      <Sidebar 
        onCreateNote={handleCreateNote}
        onNoteSelect={handleNoteSelect}
        selectedNote={selectedNote}
        isLoading={isLoading}
        notes={notes || []}
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'notes' ? (
          <NoteEditor 
            note={selectedNote}
            isCreating={isCreatingNote}
            onNoteSaved={handleNoteSaved}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold text-text-primary mb-6">Team Collaboration</h1>
              <TeamCollaboration />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
