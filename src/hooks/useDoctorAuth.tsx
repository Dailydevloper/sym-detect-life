/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext } from "react";
import { User } from "@/types";
import { doctorAuthApi } from "@/lib/api";

interface DoctorAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    additionalData?: { specialty?: string; licenseNumber?: string },
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const DoctorAuthContext = createContext<DoctorAuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const useDoctorAuth = () => {
  const context = useContext(DoctorAuthContext);
  if (!context) {
    throw new Error("useDoctorAuth must be used within a DoctorAuthProvider");
  }
  return context;
};

export const DoctorAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("doctor_access_token");
      const savedUser = localStorage.getItem("doctor_user");

      if (token && savedUser) {
        try {
          const response = await doctorAuthApi.getCurrentUser();
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem("doctor_access_token");
          localStorage.removeItem("doctor_refresh_token");
          localStorage.removeItem("doctor_user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await doctorAuthApi.login({
      email,
      password,
      role: "doctor",
    });
    const { user, accessToken, refreshToken } = response.data;

    localStorage.setItem("doctor_access_token", accessToken);
    localStorage.setItem("doctor_refresh_token", refreshToken);
    localStorage.setItem("doctor_user", JSON.stringify(user));
    setUser(user);
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    additionalData?: { specialty?: string; licenseNumber?: string },
  ) => {
    const response = await doctorAuthApi.register({
      email,
      password,
      fullName,
      role: "doctor",
      ...additionalData,
    });
    const { user, accessToken, refreshToken } = response.data;

    localStorage.setItem("doctor_access_token", accessToken);
    localStorage.setItem("doctor_refresh_token", refreshToken);
    localStorage.setItem("doctor_user", JSON.stringify(user));
    setUser(user);
  };

  const signOut = async () => {
    try {
      await doctorAuthApi.logout();
    } finally {
      localStorage.removeItem("doctor_access_token");
      localStorage.removeItem("doctor_refresh_token");
      localStorage.removeItem("doctor_user");
      setUser(null);
    }
  };

  return (
    <DoctorAuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut }}
    >
      {children}
    </DoctorAuthContext.Provider>
  );
};
