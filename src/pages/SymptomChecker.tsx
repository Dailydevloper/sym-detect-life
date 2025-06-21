
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Brain, CheckCircle } from 'lucide-react';

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const addSymptom = () => {
    if (currentSymptom.trim() && !symptoms.includes(currentSymptom.trim())) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast({
        title: "No symptoms",
        description: "Please add at least one symptom",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate AI diagnosis (in real app, this would call an AI service)
      const mockDiagnosis = {
        condition: "Common Cold",
        severity: "low",
        recommendations: [
          "Get plenty of rest",
          "Stay hydrated",
          "Consider over-the-counter pain relievers",
          "Consult a doctor if symptoms worsen"
        ],
        confidence: 85
      };

      // Save to database
      const { error } = await supabase
        .from('symptom_checks')
        .insert({
          user_id: user?.id,
          symptoms,
          ai_diagnosis: mockDiagnosis.condition,
          recommendations: mockDiagnosis.recommendations.join('; '),
          severity_level: mockDiagnosis.severity
        });

      if (error) throw error;

      setDiagnosis(mockDiagnosis);
      
      toast({
        title: "Analysis complete",
        description: "Your symptoms have been analyzed"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Symptom Checker
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Describe your symptoms and get AI-powered health insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Enter Your Symptoms
              </CardTitle>
              <CardDescription>
                Add your symptoms one by one for accurate analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a symptom..."
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                />
                <Button onClick={addSymptom}>Add</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeSymptom(symptom)}
                  >
                    {symptom} ×
                  </Badge>
                ))}
              </div>

              <Button 
                onClick={analyzeSymptoms} 
                disabled={loading || symptoms.length === 0}
                className="w-full"
              >
                {loading ? "Analyzing..." : "Analyze Symptoms"}
              </Button>
            </CardContent>
          </Card>

          {diagnosis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSeverityIcon(diagnosis.severity)}
                  AI Analysis Results
                </CardTitle>
                <CardDescription>
                  Based on the symptoms you provided
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Possible Condition</Label>
                  <p className="text-lg font-semibold">{diagnosis.condition}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Severity Level</Label>
                  <Badge className={getSeverityColor(diagnosis.severity)}>
                    {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)}
                  </Badge>
                </div>

                <div>
                  <Label className="text-sm font-medium">Confidence</Label>
                  <p className="text-lg">{diagnosis.confidence}%</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Recommendations</Label>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {diagnosis.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Disclaimer:</strong> This is not a substitute for professional medical advice. 
                    Please consult with a healthcare provider for proper diagnosis and treatment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
