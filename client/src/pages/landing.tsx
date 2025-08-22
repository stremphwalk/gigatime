import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, Stethoscope, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-medical-teal/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Stethoscope className="h-12 w-12 text-professional-blue mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">MedDoc Pro</h1>
          </div>
          <h2 className="text-2xl text-gray-700 mb-4">
            Professional Medical Documentation Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Streamline your clinical workflow with intelligent note templates, 
            smart phrase autocomplete, and secure team collaboration.
          </p>
          <Button 
            size="lg" 
            className="bg-professional-blue hover:bg-professional-blue/90"
            onClick={() => window.location.href = "/api/login"}
          >
            Sign In with Replit
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-2 hover:border-professional-blue/50 transition-colors">
            <CardHeader>
              <FileText className="h-10 w-10 text-professional-blue mb-2" />
              <CardTitle>Smart Note Templates</CardTitle>
              <CardDescription>
                Pre-built templates for admission, progress, and consultation notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Customizable medical sections</li>
                <li>• Template builder with drag & drop</li>
                <li>• Export to plain text</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-medical-teal/50 transition-colors">
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-medical-teal mb-2" />
              <CardTitle>Smart Phrases</CardTitle>
              <CardDescription>
                Autocomplete common medical phrases and save time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Custom trigger phrases</li>
                <li>• Medical condition autocomplete</li>
                <li>• Medication database integration</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-success-green/50 transition-colors">
            <CardHeader>
              <Users className="h-10 w-10 text-success-green mb-2" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Collaborate with up to 6 team members securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Unique group codes</li>
                <li>• 7-day team sessions</li>
                <li>• Shared calendars & tasks</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-warning-orange/50 transition-colors">
            <CardHeader>
              <Zap className="h-10 w-10 text-warning-orange mb-2" />
              <CardTitle>Medical Tools</CardTitle>
              <CardDescription>
                Specialized tools for clinical documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pertinent negatives tool</li>
                <li>• Lab values tracking</li>
                <li>• Physical exam templates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-professional-blue/50 transition-colors">
            <CardHeader>
              <Shield className="h-10 w-10 text-professional-blue mb-2" />
              <CardTitle>Secure & Compliant</CardTitle>
              <CardDescription>
                Built with healthcare privacy and security in mind
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Secure authentication</li>
                <li>• Data encryption</li>
                <li>• Privacy-first design</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-medical-teal/50 transition-colors">
            <CardHeader>
              <FileText className="h-10 w-10 text-medical-teal mb-2" />
              <CardTitle>Export & Integration</CardTitle>
              <CardDescription>
                Export your notes to various formats and systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Plain text export</li>
                <li>• Copy to clipboard</li>
                <li>• Template sharing</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Ready to get started?</CardTitle>
              <CardDescription>
                Sign in with your Replit account to access all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-professional-blue hover:bg-professional-blue/90"
                onClick={() => window.location.href = "/api/login"}
              >
                Sign In Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}