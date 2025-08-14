import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Note, NoteTemplate, InsertNote } from "@shared/schema";

export function useNotes() {
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<InsertNote>) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...noteData }: { id: string } & Partial<InsertNote>) => {
      const response = await apiRequest("PUT", `/api/notes/${id}`, noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
  });

  return {
    notes,
    isLoading,
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    isCreating: createNoteMutation.isPending || updateNoteMutation.isPending,
  };
}

export function useNoteTemplates() {
  const { data: templates, isLoading } = useQuery<NoteTemplate[]>({
    queryKey: ["/api/note-templates"],
  });

  return {
    templates,
    isLoading,
  };
}

export function useNote(id: string) {
  const { data: note, isLoading } = useQuery<Note>({
    queryKey: ["/api/notes", id],
    enabled: !!id,
  });

  return {
    note,
    isLoading,
  };
}
