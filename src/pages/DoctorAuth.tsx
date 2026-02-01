import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDoctorAuth } from "@/hooks/useDoctorAuth";
import { Stethoscope, ShieldCheck, UserRound, KeyRound } from "lucide-react";

const DoctorAuth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading, signIn, signUp } = useDoctorAuth();

  // Redirect if already authenticated
  if (!authLoading && user) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to="/doctor-dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!email || !password) {
        toast({
          title: "Validation Error",
          description: "Email and password are required.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isSignUp) {
        if (!fullName || !specialty || !licenseNumber) {
          toast({
            title: "Validation Error",
            description:
              "Full name, specialty, and license number are required for doctor registration.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Register as doctor
        await signUp(email, password, fullName, {
          specialty,
          licenseNumber,
        });
        toast({
          title: "Success!",
          description: "Your doctor account has been created successfully.",
        });
      } else {
        // Login as doctor
        await signIn(email, password);
        toast({
          title: "Welcome back, Doctor!",
          description: "You've been signed in successfully.",
        });
      }
    } catch (error: unknown) {
      let errorMessage = "Authentication failed";

      const axiosError = error as {
        response?: {
          data?: {
            error?: string;
            errors?: Array<{ msg?: string; message?: string }>;
          };
        };
      };

      if (axiosError?.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
      } else if (axiosError?.response?.data?.errors) {
        const errors = axiosError.response.data.errors;
        errorMessage = errors.map((err) => err.msg || err.message).join(", ");
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600/20 via-sky-500/10 to-indigo-500/20 border border-white/10 p-10 text-white shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">
                Doctor Portal
              </p>
              <h2 className="text-2xl font-semibold">Clinical Workspace</h2>
            </div>
          </div>

          <p className="text-white/80 leading-relaxed mb-8">
            A dedicated space built for physicians. Manage your schedule,
            conduct consultations, and keep patient care workflows organized.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              <span>Verified medical access and secure sessions</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <UserRound className="w-5 h-5 text-sky-300" />
              <span>Doctor-only workspace separated from patients</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <KeyRound className="w-5 h-5 text-violet-300" />
              <span>Independent authentication and access control</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isSignUp ? "Create Doctor Account" : "Doctor Sign In"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isSignUp
                ? "Get access to your clinical workspace"
                : "Welcome back to your doctor workspace"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Dr. Ayesha Khan"
                  />
                </div>

                <div>
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Input
                    id="specialty"
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Cardiology, Dermatology, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="licenseNumber">
                    Medical License Number *
                  </Label>
                  <Input
                    id="licenseNumber"
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Medical license ID"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="doctor@clinic.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your password"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create Doctor Account"
                  : "Sign In"}
            </Button>

            {isSignUp && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By registering, you confirm that you are a licensed medical
                professional. Your credentials will be verified.
              </p>
            )}

            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "New doctor? Create an account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorAuth;
