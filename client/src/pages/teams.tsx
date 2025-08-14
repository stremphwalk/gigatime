import { useState, useEffect } from "react";
import { Sidebar } from "../components/sidebar";
import { TeamManagement } from "@/components/team-management";
import { useNotes } from "../hooks/use-notes";
import { apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";

export function Teams() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [currentView, setCurrentView] = useState<'notes' | 'teams' | 'smart-phrases' | 'template-builder'>('teams');
  const { notes, isLoading } = useNotes();

  // Initialize default templates and phrases on first load
  useEffect(() => {
    const initializeDefaults = async () => {
      try {
        await apiRequest("/api/init", "POST");
        await apiRequest("/api/init-user", "POST");
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

  const handleViewChange = (view: 'notes' | 'teams' | 'smart-phrases' | 'template-builder') => {
    setCurrentView(view);
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
      <div className="flex-1 overflow-y-auto">
        <TeamManagement />
      </div>
    </div>
  );
}