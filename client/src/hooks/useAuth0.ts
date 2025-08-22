import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';

export function useAuth() {
  const { data: sessionUser, isLoading: sessionLoading, refetch } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    user: sessionUser || null,
    isLoading: sessionLoading,
    isAuthenticated: !!sessionUser,
    loginWithRedirect: async () => {
      window.location.href = '/api/auth/login';
    },
    logout: async () => {
      window.location.href = '/api/auth/logout';
    },
    getAccessTokenSilently: async () => {
      return '';
    },
    refetch,
  };
}