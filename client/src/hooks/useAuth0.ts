import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';

export function useAuth() {
  const noAuth = import.meta.env.VITE_NO_AUTH === '1';

  // Bypass auth entirely in local dev when VITE_NO_AUTH=1
  if (noAuth) {
    const mockUser: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'doctor@hospital.com',
      firstName: 'Dr. Sarah',
      lastName: 'Mitchell',
      profileImageUrl: '',
      specialty: 'Emergency Medicine',
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    };

    return {
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      loginWithRedirect: async () => {},
      logout: async () => {},
      getAccessTokenSilently: async () => '',
      refetch: async () => ({ data: mockUser }),
    } as const;
  }

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
