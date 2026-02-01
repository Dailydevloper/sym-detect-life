import React from "react";
import { Navigate } from "react-router-dom";
import { useDoctorAuth } from "@/hooks/useDoctorAuth";

const DoctorProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useDoctorAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/doctor-auth" replace />;
  }

  return <>{children}</>;
};

export default DoctorProtectedRoute;
