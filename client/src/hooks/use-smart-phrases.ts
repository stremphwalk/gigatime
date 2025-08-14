import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SmartPhrase, InsertSmartPhrase } from "@shared/schema";

export function useSmartPhrases() {
  const queryClient = useQueryClient();

  const { data: phrases, isLoading } = useQuery<SmartPhrase[]>({
    queryKey: ["/api/smart-phrases"],
  });

  const createPhraseMutation = useMutation({
    mutationFn: async (phraseData: Partial<InsertSmartPhrase>) => {
      const response = await apiRequest("POST", "/api/smart-phrases", phraseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-phrases"] });
    },
  });

  const updatePhraseMutation = useMutation({
    mutationFn: async ({ id, ...phraseData }: { id: string } & Partial<InsertSmartPhrase>) => {
      const response = await apiRequest("PUT", `/api/smart-phrases/${id}`, phraseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-phrases"] });
    },
  });

  const deletePhraseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/smart-phrases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-phrases"] });
    },
  });

  const searchPhrases = async (query: string): Promise<SmartPhrase[]> => {
    const response = await apiRequest("GET", `/api/smart-phrases?q=${encodeURIComponent(query)}`);
    return response.json();
  };

  return {
    phrases,
    isLoading,
    createPhrase: createPhraseMutation.mutateAsync,
    updatePhrase: updatePhraseMutation.mutateAsync,
    deletePhrase: deletePhraseMutation.mutateAsync,
    searchPhrases,
    isCreating: createPhraseMutation.isPending || updatePhraseMutation.isPending,
  };
}
