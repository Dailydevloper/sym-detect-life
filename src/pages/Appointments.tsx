
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Star, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Appointments = () => {
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: appointments } = useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors (*)
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({
        title: "Appointment booked",
        description: "Your appointment has been scheduled successfully"
      });
      resetForm();
    }
  });

  const resetForm = () => {
    setSelectedDoctor(null);
    setAppointmentDate('');
    setAppointmentTime('');
    setNotes('');
  };

  const handleBookAppointment = () => {
    if (!selectedDoctor || !appointmentDate || !appointmentTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    bookAppointmentMutation.mutate({
      user_id: user?.id,
      doctor_id: selectedDoctor.id,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      notes: notes || null
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Book Appointments
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Schedule consultations with our qualified healthcare professionals
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book New Appointment</CardTitle>
                <CardDescription>
                  Select a doctor and schedule your consultation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Doctor</Label>
                  <div className="grid gap-3 mt-2">
                    {doctors?.map((doctor) => (
                      <Card
                        key={doctor.id}
                        className={`cursor-pointer transition-colors ${
                          selectedDoctor?.id === doctor.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={doctor.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'}
                              alt={doctor.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold">{doctor.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {doctor.specialty}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-xs">{doctor.rating}</span>
                                </div>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs">{doctor.experience_years} years</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs font-medium">${doctor.consultation_fee}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedDoctor && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="09:00">09:00 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                            <SelectItem value="11:00">11:00 AM</SelectItem>
                            <SelectItem value="14:00">02:00 PM</SelectItem>
                            <SelectItem value="15:00">03:00 PM</SelectItem>
                            <SelectItem value="16:00">04:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any specific concerns or symptoms..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleBookAppointment}
                      disabled={bookAppointmentMutation.isPending}
                      className="w-full"
                    >
                      {bookAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
                <CardDescription>
                  Manage your scheduled appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments && appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{appointment.doctors.name}</h3>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {appointment.doctors.specialty}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.appointment_time}
                            </div>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No appointments scheduled yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
