
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Camera } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Profile = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully"
      });
    }
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setDateOfBirth(profile.date_of_birth || '');
      setGender(profile.gender || '');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || '');
    }
  }, [profile, user]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      full_name: fullName,
      phone,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      email: user?.email
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <Button variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your basic profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  Privacy Settings
                </Button>
                <Button variant="outline" className="w-full">
                  Notification Preferences
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
                <CardDescription>
                  Emergency contact and medical details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Emergency contact name and phone"
                  />
                </div>
                
                <div>
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Input
                    id="allergies"
                    placeholder="List any known allergies"
                  />
                </div>
                
                <div>
                  <Label htmlFor="medications">Current Medications</Label>
                  <Input
                    id="medications"
                    placeholder="List current medications"
                  />
                </div>

                <Button variant="outline" className="w-full">
                  Save Medical Information
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
