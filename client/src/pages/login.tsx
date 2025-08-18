import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ClipboardList, User, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth0";

const isDevelopment = window.location.hostname === 'localhost';
const hasAuth0 = !!import.meta.env.VITE_AUTH0_DOMAIN && !!import.meta.env.VITE_AUTH0_CLIENT_ID;

export function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { loginWithRedirect } = useAuth();

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      if (hasAuth0) {
        await loginWithRedirect();
      } else {
        // Development mode - redirect to mock login
        window.location.href = "/api/auth/login";
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-teal/10 to-professional-blue/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-medical-teal rounded-xl flex items-center justify-center">
            <ClipboardList className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-medical-teal">CharTNote</h1>
            <p className="text-gray-600 mt-2">Medical Documentation System</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome Back</h2>
            <p className="text-gray-600 text-sm">
              Access your medical documentation workspace
            </p>
          </div>

          <Button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-medical-teal hover:bg-medical-teal/90"
            size="lg"
            data-testid="login-button"
          >
            {isLoggingIn ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {hasAuth0 ? <Shield size={16} /> : <User size={16} />}
                <span>{hasAuth0 ? 'Sign In with Auth0' : 'Sign In (Dev Mode)'}</span>
              </div>
            )}
          </Button>

          <div className="text-center text-xs text-gray-500">
            {hasAuth0 ? (
              <p>Secure authentication via Auth0</p>
            ) : (
              <p>Development Mode - Click to authenticate</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}