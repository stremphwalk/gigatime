import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0, // Always check authentication status
    gcTime: 0, // Don't cache auth results
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Invalidate the user query to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Clear cache even on error
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  });

  return {
    user,
    isLoading,
    refetch,
    isAuthenticated: !!user && !error,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
    error,
  };
}