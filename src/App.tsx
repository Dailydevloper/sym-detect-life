import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PWAManager } from "@/components/PWAManager";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import SymptomChecker from "./pages/SymptomChecker";
import MedicineStore from "./pages/MedicineStore";
import Appointments from "./pages/Appointments";
import Dashboard from "./pages/Dashboard";
import HealthRecords from "./pages/HealthRecords";
import Profile from "./pages/Profile";
import VideoCall from "./pages/VideoCall";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <PWAManager />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/symptom-checker"
                element={
                  <ProtectedRoute>
                    <SymptomChecker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medicine-store"
                element={
                  <ProtectedRoute>
                    <MedicineStore />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/video-call/:appointmentId"
                element={
                  <ProtectedRoute>
                    <VideoCall />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="patient">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-records"
                element={
                  <ProtectedRoute>
                    <HealthRecords />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
