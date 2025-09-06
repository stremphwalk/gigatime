import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Team, TeamMember, User, TeamTodo, TeamCalendarEvent, TeamBulletinPost } from "@shared/schema";

export interface TeamWithMembers extends TeamMember {
  team: Team;
}

export function useTeams() {
  return useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams"],
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery<(TeamMember & { user: User })[]>({
    queryKey: ["/api/teams", teamId, "members"],
    enabled: !!teamId,
  });
}

export function useTeamTodos(teamId: string) {
  return useQuery<(TeamTodo & { createdBy: User; assignedTo?: User; assignees?: User[] })[]>({
    queryKey: ["/api/teams", teamId, "todos"],
    enabled: !!teamId,
  });
}

export function useCreateTodo(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TeamTodo> & { assigneeIds?: string[] }) => {
      return await apiRequest("POST", `/api/teams/${teamId}/todos`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "todos"] }),
  });
}

export function useUpdateTodo(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeamTodo> & { assigneeIds?: string[] } }) => {
      return await apiRequest("PUT", `/api/todos/${id}`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "todos"] }),
  });
}

export function useDeleteTodo(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "todos"] }),
  });
}

export function useTeamCalendar(teamId: string) {
  return useQuery<TeamCalendarEvent[]>({
    queryKey: ["/api/teams", teamId, "calendar"],
    enabled: !!teamId,
  });
}

export function useCreateEvent(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TeamCalendarEvent>) => {
      return await apiRequest("POST", `/api/teams/${teamId}/calendar`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "calendar"] }),
  });
}

export function useUpdateEvent(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeamCalendarEvent> }) => {
      return await apiRequest("PUT", `/api/calendar/${id}`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "calendar"] }),
  });
}

export function useDeleteEvent(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/calendar/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "calendar"] }),
  });
}

export function useRenameTeam(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string | null }) => {
      return await apiRequest("POST", `/api/teams/${teamId}/rename`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams"] }),
  });
}

export function useDisbandTeam(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/teams/${teamId}/disband`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams"] }),
  });
}

export function useRemoveMember(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberUserId: string) => {
      return await apiRequest("POST", `/api/teams/${teamId}/members/${memberUserId}/remove`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "members"] }),
  });
}

export function useTransferAdmin(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (newAdminUserId: string) => {
      return await apiRequest("POST", `/api/teams/${teamId}/transfer-admin`, { newAdminUserId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "members"] }),
  });
}

export function useTeamBulletin(teamId: string) {
  return useQuery<TeamBulletinPost[]>({
    queryKey: ["/api/teams", teamId, "bulletin"],
    enabled: !!teamId,
  });
}

export function useCreateBulletinPost(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TeamBulletinPost>) => {
      return await apiRequest("POST", `/api/teams/${teamId}/bulletin`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "bulletin"] }),
  });
}

export function useUpdateBulletinPost(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeamBulletinPost> }) => {
      return await apiRequest("PUT", `/api/bulletin/${id}`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "bulletin"] }),
  });
}

export function useDeleteBulletinPost(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/bulletin/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/teams", teamId, "bulletin"] }),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("POST", "/api/teams/create", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });
}

export function useJoinTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { groupCode: string }) => {
      return await apiRequest("POST", "/api/teams/join", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });
}

export function useLeaveTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamId: string) => {
      return await apiRequest("POST", `/api/teams/${teamId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });
}

export function useProlongTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      return await apiRequest("POST", `/api/teams/${teamId}/prolong`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });
}
