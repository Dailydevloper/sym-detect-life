import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { Heart } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  // Redirect if already authenticated
  if (!authLoading && user) {
    // Redirect based on user role
    if (user.role === "doctor") {
      return <Navigate to="/doctor-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName, "patient");
        toast({
          title: "Success!",
          description: "Your account has been created successfully.",
        });
      } else {
        await signIn(email, password, "patient");
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          error.message ||
          "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isSignUp ? "Create Account" : "Welcome Back"}
      subtitle={
        isSignUp ? "Join our healthcare platform" : "Sign in to your account"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUp && (
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1"
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
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
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleAuthButton />

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Are you a medical professional?
          </p>
          <Link
            to="/doctor-auth"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
          >
            Sign in as Doctor →
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Auth;
