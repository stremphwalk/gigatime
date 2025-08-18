import { useUser, useClerk, useAuth as useClerkAuthBase } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import type { User } from "@shared/schema";
import { useSimpleAuth } from "./useSimpleAuth";

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  return key && key !== 'your_clerk_publishable_key_here';
};

export function useClerkAuth() {
  // If Clerk is not configured, fall back to simple auth
  if (!isClerkConfigured()) {
    return useSimpleAuth();
  }

  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useClerkAuthBase();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Clerk user with our database
  useEffect(() => {
    const syncUser = async () => {
      if (!clerkLoaded) {
        return;
      }

      if (!isSignedIn || !clerkUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // Get auth token from Clerk
        const token = await getToken();
        
        // Sync user data with our backend
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            profileImageUrl: clerkUser.imageUrl || ''
          }),
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          console.error('Failed to sync user with backend');
          setUser(null);
        }
      } catch (error) {
        console.error('Error syncing user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [clerkUser, clerkLoaded, isSignedIn, getToken]);

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: isSignedIn && !!user,
    login: () => {
      // Clerk handles login through its components
      console.log('Use Clerk components for login');
    },
    logout,
    refetch: () => {
      // Trigger re-sync
      window.location.reload();
    }
  };
}