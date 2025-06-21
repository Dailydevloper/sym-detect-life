
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ShoppingCart, BarChart3, Calendar, FileText, Brain, Heart, Stethoscope } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      title: "AI Symptom Checker",
      description: "Get instant AI-powered analysis of your symptoms with personalized recommendations.",
      icon: Brain,
      link: "/symptom-checker",
      color: "bg-blue-100 dark:bg-blue-900"
    },
    {
      title: "Medicine Store",
      description: "Order prescription and over-the-counter medicines with secure delivery.",
      icon: ShoppingCart,
      link: "/medicine-store",
      color: "bg-green-100 dark:bg-green-900"
    },
    {
      title: "Doctor Appointments",
      description: "Book consultations with qualified healthcare professionals.",
      icon: Calendar,
      link: "/appointments",
      color: "bg-purple-100 dark:bg-purple-900"
    },
    {
      title: "Health Dashboard",
      description: "Track your health metrics, history, and progress over time.",
      icon: BarChart3,
      link: "/dashboard",
      color: "bg-orange-100 dark:bg-orange-900"
    },
    {
      title: "Health Records",
      description: "Securely store and manage your medical history and documents.",
      icon: FileText,
      link: "/health-records",
      color: "bg-teal-100 dark:bg-teal-900"
    },
    {
      title: "Profile Management",
      description: "Update your personal information and medical preferences.",
      icon: Activity,
      link: "/profile",
      color: "bg-rose-100 dark:bg-rose-900"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to HealthCare AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Your comprehensive healthcare companion powered by artificial intelligence. 
            Get instant symptom analysis, book appointments, order medicines, and manage your health records all in one place.
          </p>
          {user && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Stethoscope className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ready to continue your health journey?
              </p>
              <Link to="/dashboard">
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-xl transition-shadow duration-300 group">
                <CardHeader>
                  <div className={`w-14 h-14 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={feature.link}>
                    <Button className="w-full group-hover:bg-blue-700 transition-colors">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Why Choose HealthCare AI?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced artificial intelligence for accurate symptom analysis and health insights.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Care</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with qualified healthcare professionals for consultations and treatment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All your healthcare needs in one secure, easy-to-use platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
