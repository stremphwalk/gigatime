import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ClipboardList, User } from "lucide-react";
import { useSimpleAuth as useAuth } from "../hooks/useSimpleAuth";

export function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
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
                <User size={16} />
                <span>Sign In</span>
              </div>
            )}
          </Button>

          <div className="text-center text-xs text-gray-500">
            <p>Development Mode - Click to authenticate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}