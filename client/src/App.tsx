import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useSimpleAuth as useAuth } from "@/hooks/useSimpleAuth";
import { GlobalDictation } from "@/components/global-dictation";
import Home from "./pages/home";
import { Teams } from "./pages/teams";
import { LoginPage } from "./pages/login";
import NotFound from "./pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();



  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Force authentication state based on user presence
  const shouldShowApp = isAuthenticated && user;

  return (
    <Switch>
      {shouldShowApp ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/teams" component={Teams} />
        </>
      ) : (
        <Route path="/" component={LoginPage} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
}

export default App;
