
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
import { FileText, Upload, Download, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const HealthRecords = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [recordType, setRecordType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: healthRecords } = useQuery({
    queryKey: ['health-records', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const addRecordMutation = useMutation({
    mutationFn: async (recordData: any) => {
      const { data, error } = await supabase
        .from('health_records')
        .insert(recordData);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      toast({
        title: "Record added",
        description: "Health record has been saved successfully"
      });
      resetForm();
    }
  });

  const resetForm = () => {
    setIsAdding(false);
    setRecordType('');
    setTitle('');
    setDescription('');
  };

  const handleAddRecord = () => {
    if (!recordType || !title) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    addRecordMutation.mutate({
      user_id: user?.id,
      record_type: recordType,
      title,
      description: description || null,
      data: {}
    });
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'symptom_check': return 'bg-blue-100 text-blue-800';
      case 'prescription': return 'bg-green-100 text-green-800';
      case 'lab_result': return 'bg-yellow-100 text-yellow-800';
      case 'consultation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecordTypeIcon = (type: string) => {
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Health Records
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Manage and track your medical history and health data
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Records</h2>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Record
          </Button>
        </div>

        {isAdding && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Health Record</CardTitle>
              <CardDescription>
                Create a new record to track your health information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="record-type">Record Type</Label>
                  <Select value={recordType} onValueChange={setRecordType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="symptom_check">Symptom Check</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="lab_result">Lab Result</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Record title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddRecord} disabled={addRecordMutation.isPending}>
                  {addRecordMutation.isPending ? "Adding..." : "Add Record"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {healthRecords && healthRecords.length > 0 ? (
            healthRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRecordTypeIcon(record.record_type)}
                      <h3 className="font-semibold">{record.title}</h3>
                    </div>
                    <Badge className={getRecordTypeColor(record.record_type)}>
                      {record.record_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  {record.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {record.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                    {record.file_url && (
                      <Button size="sm" variant="outline">
                        <FileText className="w-3 h-3 mr-1" />
                        View File
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No health records yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start tracking your health by adding your first record
              </p>
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Record
              </Button>
            </div>
          )}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Upload Medical Documents</CardTitle>
            <CardDescription>
              Upload lab results, prescriptions, or other medical documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop files here, or click to browse
              </p>
              <Button variant="outline">
                Choose Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthRecords;
