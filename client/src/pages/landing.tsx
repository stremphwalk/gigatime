import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Zap, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth0";

export default function Landing() {
  const { loginWithRedirect, isAuthenticated } = useAuth();
  
  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = "/";
    } else {
      loginWithRedirect();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-50)] to-[color:var(--brand-100)] dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Medical Documentation Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Streamline your clinical note-taking with intelligent templates, smart phrases, and seamless team collaboration.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="bg-[color:var(--brand-700)] hover:opacity-95 text-white px-8 py-3 text-lg"
            data-testid="button-get-started"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Sign In to Get Started'}
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <FileText className="mx-auto h-12 w-12 text-[color:var(--brand-700)] mb-4" />
              <CardTitle>Smart Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Pre-built templates for admission notes, progress notes, and consultations to speed up documentation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Smart Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Autocomplete common medical phrases and templates with intelligent suggestions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work together with team members using shared group codes and collaborative tools.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="mx-auto h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built with healthcare standards in mind, ensuring your data is secure and accessible.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to improve your workflow?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join healthcare professionals who trust our platform for efficient clinical documentation.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            variant="outline"
            className="border-[color:var(--brand-700)] text-[color:var(--brand-700)] hover:bg-[color:var(--brand-700)] hover:text-white px-8 py-3 text-lg"
            data-testid="button-login-secondary"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}
