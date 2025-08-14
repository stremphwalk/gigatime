import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Team, TeamMember, User } from "@shared/schema";

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

export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("/api/teams/create", "POST", data);
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
      return await apiRequest("/api/teams/join", "POST", data);
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
      return await apiRequest(`/api/teams/${teamId}/leave`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });
}