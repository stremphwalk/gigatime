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
  const queryClient = useQueryClient();
  
  const { data: templates, isLoading } = useQuery<NoteTemplate[]>({
    queryKey: ["/api/note-templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      console.log('[useNoteTemplates] Creating template - Request data:', templateData);
      try {
        const response = await apiRequest("POST", "/api/note-templates", templateData);
        console.log('[useNoteTemplates] Create response received, parsing JSON...');
        const result = await response.json();
        console.log('[useNoteTemplates] Create response parsed:', result);
        return result;
      } catch (error) {
        console.error('[useNoteTemplates] Error in mutationFn:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useNoteTemplates] Create mutation successful, invalidating cache', data);
      queryClient.invalidateQueries({ queryKey: ["/api/note-templates"] });
    },
    onError: (error) => {
      console.error('[useNoteTemplates] Create mutation failed:', error);
      // Error will be handled by the component
    },
    onMutate: async (templateData) => {
      console.log('[useNoteTemplates] Create mutation starting with data:', templateData);
    },
    onSettled: (data, error) => {
      console.log('[useNoteTemplates] Create mutation settled:', { data, error });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: { id: string } & any) => {
      console.log('[useNoteTemplates] Updating template - Request data:', { id, templateData });
      try {
        const response = await apiRequest("PUT", `/api/note-templates/${id}`, templateData);
        console.log('[useNoteTemplates] Update response received, parsing JSON...');
        const result = await response.json();
        console.log('[useNoteTemplates] Update response parsed:', result);
        return result;
      } catch (error) {
        console.error('[useNoteTemplates] Error in update mutationFn:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useNoteTemplates] Update mutation successful, invalidating cache', data);
      queryClient.invalidateQueries({ queryKey: ["/api/note-templates"] });
    },
    onError: (error) => {
      console.error('[useNoteTemplates] Update mutation failed:', error);
      // Error will be handled by the component
    },
    onMutate: async (data) => {
      console.log('[useNoteTemplates] Update mutation starting with data:', data);
    },
    onSettled: (data, error) => {
      console.log('[useNoteTemplates] Update mutation settled:', { data, error });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/note-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/note-templates"] });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: async (data: any) => {
      console.log('[useNoteTemplates] createTemplate called with:', data);
      try {
        const result = await createTemplateMutation.mutateAsync(data);
        console.log('[useNoteTemplates] createTemplate completed:', result);
        return result;
      } catch (error) {
        console.error('[useNoteTemplates] createTemplate error:', error);
        throw error;
      }
    },
    updateTemplate: async (data: any) => {
      console.log('[useNoteTemplates] updateTemplate called with:', data);
      try {
        const result = await updateTemplateMutation.mutateAsync(data);
        console.log('[useNoteTemplates] updateTemplate completed:', result);
        return result;
      } catch (error) {
        console.error('[useNoteTemplates] updateTemplate error:', error);
        throw error;
      }
    },
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isCreating: createTemplateMutation.isPending || updateTemplateMutation.isPending,
    createError: createTemplateMutation.error,
    updateError: updateTemplateMutation.error,
    isCreateError: createTemplateMutation.isError,
    isUpdateError: updateTemplateMutation.isError,
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
