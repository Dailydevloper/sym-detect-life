
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Activity, Calendar, ShoppingCart, FileText, TrendingUp, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  date: string;
  severity?: string;
  status?: string;
}

const Dashboard = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [symptomChecks, appointments, orders, healthRecords] = await Promise.all([
        supabase.from('symptom_checks').select('*').eq('user_id', user.id),
        supabase.from('appointments').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('health_records').select('*').eq('user_id', user.id)
      ]);

      return {
        symptomChecks: symptomChecks.data?.length || 0,
        appointments: appointments.data?.length || 0,
        orders: orders.data?.length || 0,
        healthRecords: healthRecords.data?.length || 0
      };
    },
    enabled: !!user
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const [recentSymptomChecks, recentAppointments] = await Promise.all([
        supabase
          .from('symptom_checks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('appointments')
          .select('*, doctors(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      const activities: ActivityItem[] = [
        ...(recentSymptomChecks.data || []).map(check => ({
          type: 'symptom_check',
          title: 'Symptom Analysis',
          description: `Analyzed symptoms: ${check.symptoms.slice(0, 3).join(', ')}`,
          date: check.created_at,
          severity: check.severity_level
        })),
        ...(recentAppointments.data || []).map(appointment => ({
          type: 'appointment',
          title: `Appointment with ${appointment.doctors.name}`,
          description: appointment.doctors.specialty,
          date: appointment.created_at,
          status: appointment.status
        }))
      ];

      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    },
    enabled: !!user
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'symptom_check': return <Activity className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Health Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track your health journey and manage your medical data
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Symptom Checks
                  </p>
                  <p className="text-2xl font-bold">{stats?.symptomChecks || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Appointments
                  </p>
                  <p className="text-2xl font-bold">{stats?.appointments || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Medicine Orders
                  </p>
                  <p className="text-2xl font-bold">{stats?.orders || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Health Records
                  </p>
                  <p className="text-2xl font-bold">{stats?.healthRecords || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest health-related activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="p-2 rounded-full bg-white dark:bg-gray-700">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                          {activity.severity && (
                            <Badge className={getSeverityColor(activity.severity)}>
                              {activity.severity}
                            </Badge>
                          )}
                          {activity.status && (
                            <Badge variant="outline">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Access your most used health features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/symptom-checker">
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  Check Symptoms
                </Button>
              </Link>
              
              <Link to="/appointments">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </Link>
              
              <Link to="/medicine-store">
                <Button className="w-full justify-start" variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Order Medicine
                </Button>
              </Link>
              
              <Link to="/health-records">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  View Health Records
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Health Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Daily Health Tips</CardTitle>
            <CardDescription>
              Personalized recommendations for better health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Stay Hydrated
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Drink at least 8 glasses of water daily to maintain optimal health.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Regular Exercise
                </h4>
                <p className="text-sm text-green-700 dark:text-green-200">
                  Aim for 30 minutes of moderate exercise most days of the week.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Quality Sleep
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-200">
                  Get 7-9 hours of quality sleep each night for better recovery.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
