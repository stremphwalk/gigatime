import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PertinentNegativePreset, InsertPertinentNegativePreset } from "@shared/schema";

export const usePertinentNegativePresets = () => {
  return useQuery<PertinentNegativePreset[]>({
    queryKey: ["/api/pertinent-negative-presets"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreatePertinentNegativePreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preset: Omit<InsertPertinentNegativePreset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      return apiRequest("POST", "/api/pertinent-negative-presets", preset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pertinent-negative-presets"] });
    },
  });
};

export const useDeletePertinentNegativePreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/pertinent-negative-presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pertinent-negative-presets"] });
    },
  });
};