import { useAuth0 as useAuth0Original } from '@auth0/auth0-react';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';

export function useAuth() {
  const auth0Available = !!import.meta.env.VITE_AUTH0_DOMAIN && !!import.meta.env.VITE_AUTH0_CLIENT_ID;
  
  // Use Auth0 if configured
  const auth0 = auth0Available ? useAuth0Original() : null;
  
  // Fallback to server session check
  const { data: sessionUser, isLoading: sessionLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    enabled: !auth0Available,
    retry: false,
  });

  if (auth0Available && auth0) {
    return {
      user: auth0.user ? {
        id: auth0.user.sub,
        email: auth0.user.email,
        firstName: auth0.user.given_name || auth0.user.name?.split(' ')[0] || '',
        lastName: auth0.user.family_name || auth0.user.name?.split(' ').slice(1).join(' ') || '',
        profileImageUrl: auth0.user.picture
      } : null,
      isLoading: auth0.isLoading,
      isAuthenticated: auth0.isAuthenticated,
      loginWithRedirect: auth0.loginWithRedirect,
      logout: auth0.logout,
      getAccessTokenSilently: auth0.getAccessTokenSilently
    };
  }

  // Fallback for development without Auth0
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
      return 'mock-token';
    }
  };
}