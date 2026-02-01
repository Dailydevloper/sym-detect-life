import React from "react";
import { useDoctorAuth } from "@/hooks/useDoctorAuth";
import { useQuery } from "@tanstack/react-query";
import { doctorPortalApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Stethoscope,
  Video,
  Users,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface DoctorStats {
  todayAppointments: number;
  upcomingAppointments: number;
  totalPatients: number;
  completedToday: number;
  pendingAppointments: number;
  monthlyRevenue: number;
}

interface Appointment {
  id: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string;
}

const DoctorDashboard = () => {
  const { user, signOut } = useDoctorAuth();

  const { data: stats } = useQuery<DoctorStats>({
    queryKey: ["doctor-stats", user?.id],
    queryFn: async () => {
      const response = await doctorPortalApi.getStats();
      return response.data;
    },
    enabled: !!user,
  });

  const { data: todayAppointments } = useQuery<Appointment[]>({
    queryKey: ["doctor-today-appointments", user?.id],
    queryFn: async () => {
      const response = await doctorPortalApi.getTodayAppointments();
      return response.data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-white/70">Doctor Workspace</p>
                  <h1 className="text-3xl font-semibold">
                    Welcome back, Dr. {user?.full_name || "Doctor"}
                  </h1>
                </div>
              </div>
              <p className="mt-3 text-white/80 max-w-xl">
                Your dedicated clinical landing page. Review today’s schedule,
                manage visits, and keep patient care on track.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                asChild
                className="bg-white text-blue-700 hover:bg-white/90"
              >
                <Link to="/appointments">View Appointments</Link>
              </Button>
              <Button variant="secondary" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats?.todayAppointments ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Appointments today
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="w-4 h-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats?.upcomingAppointments ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Users className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats?.totalPatients ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Active patients</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {stats?.completedToday ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Visits completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Today’s Schedule</CardTitle>
              <Badge variant="secondary">
                {todayAppointments?.length ?? 0} visits
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {(todayAppointments || []).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {appointment.patient_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.reason || "Consultation"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Clock className="w-3 h-3" />
                      {format(new Date(appointment.appointment_date), "MMM d")}•{" "}
                      {appointment.appointment_time}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{appointment.status}</Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/video-call/${appointment.id}`}>
                        <Video className="w-4 h-4 mr-1" />
                        Join
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {(todayAppointments || []).length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No appointments scheduled for today.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/appointments">
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Appointments
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/health-records">
                  <FileText className="w-4 h-4 mr-2" />
                  Review Records
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/video-call/demo">
                  <Video className="w-4 h-4 mr-2" />
                  Test Video Room
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
