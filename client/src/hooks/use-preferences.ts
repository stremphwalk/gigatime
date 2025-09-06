import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type ViewLayout = 'grid'|'list';
type PrefData = { view?: { templates?: ViewLayout; smartPhrases?: ViewLayout; autocomplete?: ViewLayout; community?: ViewLayout } };

export function usePreferences() {
  const qc = useQueryClient();

  const { data } = useQuery<{ userId: string; data: PrefData }>({ queryKey: ["/api/user-preferences"] });

  const mutate = useMutation({
    mutationFn: async (data: PrefData) => {
      const res = await apiRequest('PUT', '/api/user-preferences', { data });
      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user-preferences"] });
    }
  });

  const updateView = (section: keyof NonNullable<PrefData['view']>, layout: ViewLayout) => {
    const next: PrefData = { ...(data?.data || {}) } as PrefData;
    next.view = { ...(next.view || {}), [section]: layout } as any;
    mutate.mutate(next);
  };

  return {
    prefs: data?.data || {},
    updateView,
    savePrefs: (next: PrefData) => mutate.mutate(next),
    isSaving: mutate.isPending
  };
}
