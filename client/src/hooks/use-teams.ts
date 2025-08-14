import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Team, TeamTodo, TeamCalendarEvent, InsertTeamTodo, InsertTeamCalendarEvent } from "@shared/schema";

export function useTeamTodos(teamId: string) {
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery<TeamTodo[]>({
    queryKey: ["/api/teams", teamId, "todos"],
    enabled: !!teamId,
  });

  const createTodoMutation = useMutation({
    mutationFn: async (todoData: Partial<InsertTeamTodo>) => {
      const response = await apiRequest("POST", `/api/teams/${teamId}/todos`, todoData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "todos"] });
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, ...todoData }: { id: string } & Partial<InsertTeamTodo>) => {
      const response = await apiRequest("PUT", `/api/todos/${id}`, todoData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "todos"] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "todos"] });
    },
  });

  return {
    todos,
    isLoading,
    createTodo: createTodoMutation.mutateAsync,
    updateTodo: updateTodoMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,
    isCreating: createTodoMutation.isPending || updateTodoMutation.isPending,
  };
}

export function useTeamCalendar(teamId: string) {
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery<TeamCalendarEvent[]>({
    queryKey: ["/api/teams", teamId, "calendar"],
    enabled: !!teamId,
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<InsertTeamCalendarEvent>) => {
      const response = await apiRequest("POST", `/api/teams/${teamId}/calendar`, eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "calendar"] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: { id: string } & Partial<InsertTeamCalendarEvent>) => {
      const response = await apiRequest("PUT", `/api/calendar/${id}`, eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "calendar"] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/calendar/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "calendar"] });
    },
  });

  return {
    events,
    isLoading,
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    isCreating: createEventMutation.isPending || updateEventMutation.isPending,
  };
}
