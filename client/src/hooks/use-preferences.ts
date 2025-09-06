import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type ViewLayout = 'grid'|'list';
type Language = 'en'|'fr';
type PrefData = {
  language?: Language;
  view?: { templates?: ViewLayout; smartPhrases?: ViewLayout; autocomplete?: ViewLayout; community?: ViewLayout }
};

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

  const updateLanguage = (language: Language) => {
    const next: PrefData = { ...(data?.data || {}) } as PrefData;
    next.language = language;
    mutate.mutate(next);
  };

  return {
    prefs: data?.data || {},
    updateView,
    updateLanguage,
    savePrefs: (next: PrefData) => mutate.mutate(next),
    isSaving: mutate.isPending
  };
}
