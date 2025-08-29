import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AutocompleteItem {
  id: string;
  text: string;
  category: string;
  isPriority: boolean;
  dosage?: string;
  frequency?: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutocompleteItem {
  text: string;
  category: string;
  isPriority: boolean;
  dosage?: string;
  frequency?: string;
  description?: string;
}

async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res;
}

export function useAutocompleteItems(category?: string) {
  const queryClient = useQueryClient();

  // Fetch autocomplete items
  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/autocomplete-items", category],
    queryFn: async () => {
      const url = category 
        ? `/api/autocomplete-items?category=${encodeURIComponent(category)}`
        : "/api/autocomplete-items";
      const response = await apiRequest("GET", url);
      return response.json() as Promise<AutocompleteItem[]>;
    },
  });

  // Create autocomplete item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: CreateAutocompleteItem) => {
      const response = await apiRequest("POST", "/api/autocomplete-items", itemData);
      return response.json() as Promise<AutocompleteItem>;
    },
    onSuccess: () => {
      // Invalidate both the specific category query and the general query
      queryClient.invalidateQueries({ queryKey: ["/api/autocomplete-items"] });
    },
    onError: (error) => {
      console.error("Failed to create autocomplete item:", error);
    },
  });

  // Update autocomplete item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...itemData }: { id: string } & Partial<CreateAutocompleteItem>) => {
      const response = await apiRequest("PUT", `/api/autocomplete-items/${id}`, itemData);
      return response.json() as Promise<AutocompleteItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autocomplete-items"] });
    },
    onError: (error) => {
      console.error("Failed to update autocomplete item:", error);
    },
  });

  // Delete autocomplete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/autocomplete-items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/autocomplete-items"] });
    },
    onError: (error) => {
      console.error("Failed to delete autocomplete item:", error);
    },
  });

  return {
    items,
    isLoading,
    error,
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    isCreating: createItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    createError: createItemMutation.error,
    updateError: updateItemMutation.error,
    deleteError: deleteItemMutation.error,
  };
}