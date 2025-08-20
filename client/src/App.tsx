import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth0";
import { GlobalDictation } from "@/components/global-dictation";
import { ClerkProvider } from "@clerk/clerk-react";
import { Auth0ProviderWrapper } from "@/providers/Auth0Provider";
import Home from "./pages/home";
import { Teams } from "./pages/teams";
import { LoginPage } from "./pages/login";
import LandingNew from "./pages/landing-new";
import { AuthCallback } from "./pages/auth-callback";
import NotFound from "./pages/not-found";

// Check if Clerk is configured
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = clerkPubKey && clerkPubKey !== 'your_clerk_publishable_key_here';

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Development bypass - add ?dev=true to URL to skip auth
  const isDevelopment = import.meta.env.DEV;
  const urlParams = new URLSearchParams(window.location.search);
  const devBypass = isDevelopment && urlParams.get('dev') === 'true';

  // Show loading state while checking authentication
  if (isLoading && !devBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Force authentication state based on user presence or dev bypass
  const shouldShowApp = (isAuthenticated && user) || devBypass;

  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      {shouldShowApp ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/teams" component={Teams} />
        </>
      ) : (
        <Route path="/" component={LandingNew} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const AppContent = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="medical-app-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
          <GlobalDictation />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );

  // Wrap with Auth0Provider (which handles its own check for configuration)
  const AppWithAuth = (
    <Auth0ProviderWrapper>
      {isClerkConfigured ? (
        <ClerkProvider publishableKey={clerkPubKey}>
          {AppContent}
        </ClerkProvider>
      ) : (
        AppContent
      )}
    </Auth0ProviderWrapper>
  );

  return AppWithAuth;
}

export default App;
