import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { NoteEditor } from "@/components/note-editor";
import { useNotes } from "@/hooks/use-notes";
import { apiRequest } from "@/lib/queryClient";
import type { Note } from "@shared/schema";

export default function Home() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const { notes, isLoading } = useNotes();

  // Initialize default templates and phrases on first load
  useEffect(() => {
    const initializeDefaults = async () => {
      try {
        await apiRequest("POST", "/api/init");
      } catch (error) {
        console.log("Defaults already initialized or error occurred");
      }
    };
    initializeDefaults();
  }, []);

  const handleCreateNote = (templateType?: string) => {
    setSelectedNote(null);
    setIsCreatingNote(true);
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
  };

  const handleNoteSaved = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
  };

  return (
    <div className="flex h-screen bg-clinical-white text-text-primary overflow-hidden">
      <Sidebar 
        onCreateNote={handleCreateNote}
        onNoteSelect={handleNoteSelect}
        selectedNote={selectedNote}
        isLoading={isLoading}
        notes={notes || []}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NoteEditor 
          note={selectedNote}
          isCreating={isCreatingNote}
          onNoteSaved={handleNoteSaved}
        />
      </div>
    </div>
  );
}
