import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RunList, ListPatient, RunListNote } from "@shared/schema";

export interface RunListPatientDTO {
  id: string;
  position: number;
  alias: string | null;
  active: boolean;
  archivedAt?: string | null;
  carryForwardOverrides?: Record<string, boolean> | null;
  note: {
    id: string;
    listPatientId: string;
    rawText: string;
    structuredSections: any;
    status: string;
    updatedAt?: string;
    expiresAt?: string;
  } | null;
}

export interface RunListResponse {
  runList: RunList;
  patients: RunListPatientDTO[];
}

export function useRunList(params?: { day?: string; carryForward?: boolean; autoclone?: boolean }) {
  const queryClient = useQueryClient();
  const day = params?.day;
  const carryForward = params?.carryForward ?? false;
  const autoclone = params?.autoclone ?? true;

  const { data, isLoading, refetch } = useQuery<RunListResponse>({
    queryKey: ["/api/run-list/today", { day, carryForward, autoclone }],
    queryFn: async () => {
      const url = new URL("/api/run-list/today", window.location.origin);
      if (day) url.searchParams.set("day", day);
      if (carryForward) url.searchParams.set("carryForward", "true");
      if (!autoclone) url.searchParams.set("autoclone", "false");
      const res = await apiRequest("GET", url.pathname + url.search);
      return res.json();
    },
  });

  const addPatient = useMutation({
    mutationFn: async ({ runListId, alias }: { runListId: string; alias?: string }) => {
      const res = await apiRequest("POST", `/api/run-list/${runListId}/patients`, alias ? { alias } : undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/run-list/today"] });
    }
  });

  const reorderPatients = useMutation({
    mutationFn: async ({ runListId, order }: { runListId: string; order: string[] }) => {
      const res = await apiRequest("PUT", `/api/run-list/${runListId}/patients/reorder`, { order });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/run-list/today"] });
    }
  });

  const updatePatient = useMutation({
    mutationFn: async ({ patientId, alias, active }: { patientId: string; alias?: string; active?: boolean }) => {
      const body: any = {};
      if (typeof alias === 'string') body.alias = alias;
      if (typeof active === 'boolean') body.active = active;
      const res = await apiRequest("PUT", `/api/run-list/patients/${patientId}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/run-list/today"] });
    }
  });

  const archivePatient = useMutation({
    mutationFn: async ({ patientId }: { patientId: string }) => {
      const res = await apiRequest("DELETE", `/api/run-list/patients/${patientId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/run-list/today"] });
    }
  });

  const saveNote = useMutation({
    mutationFn: async ({ listPatientId, rawText, status, structuredSections, expectedUpdatedAt }: { listPatientId: string; rawText?: string; status?: string; structuredSections?: any; expectedUpdatedAt?: string }) => {
      const body: any = {};
      if (typeof rawText === 'string') body.rawText = rawText;
      if (typeof status === 'string') body.status = status;
      if (structuredSections && typeof structuredSections === 'object') body.structuredSections = structuredSections;
      if (typeof expectedUpdatedAt === 'string') body.expectedUpdatedAt = expectedUpdatedAt;
      const res = await apiRequest("PUT", `/api/run-list/notes/${listPatientId}`, body);
      if (!res.ok) {
        const err: any = new Error('Save failed');
        (err.status as any) = res.status;
        throw err;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/run-list/today"] });
    }
  });

  const updateRunListMode = useMutation({
    mutationFn: async ({ runListId, mode }: { runListId: string; mode: 'prepost' | 'full' }) => {
      const res = await apiRequest("PUT", `/api/run-list/${runListId}/mode`, { mode });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/run-list/today"] });
    }
  });

  return {
    data,
    isLoading,
    refetch,
    addPatient: addPatient.mutateAsync,
    reorderPatients: reorderPatients.mutateAsync,
    updatePatient: updatePatient.mutateAsync,
    archivePatient: archivePatient.mutateAsync,
    saveNote: saveNote.mutateAsync,
    isSaving: saveNote.isPending,
    updateRunListMode: updateRunListMode.mutateAsync,
  };
}

