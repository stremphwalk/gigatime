import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AutocompleteItem {
  id: string;
  text: string;
  category: string;
  isPriority: boolean;
  shortCode?: string;
  dosage?: string;
  frequency?: string;
  dosageOptions?: string[];
  frequencyOptions?: string[];
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutocompleteItem {
  text: string;
  category: string;
  isPriority: boolean;
  isPublic?: boolean;
  dosage?: string;
  frequency?: string;
  dosageOptions?: string[];
  frequencyOptions?: string[];
  description?: string;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const body = await res.text();
    throw new Error(body || `Non-JSON response (${contentType}) from ${res.url}`);
  }
  return (await res.json()) as T;
}

// Use the shared, hardened apiRequest from lib/queryClient

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
      return parseJsonOrThrow<AutocompleteItem[]>(response);
    },
  });

  // Create autocomplete item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: CreateAutocompleteItem) => {
      const response = await apiRequest("POST", "/api/autocomplete-items", itemData);
      return parseJsonOrThrow<AutocompleteItem>(response);
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
      return parseJsonOrThrow<AutocompleteItem>(response);
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
      return parseJsonOrThrow(response);
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
