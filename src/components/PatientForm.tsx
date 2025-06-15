
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface PatientData {
  age: string;
  severity: string;
  arrival: string;
}

interface RecommendationResult {
  admit: boolean;
  confidence: number;
  score: number;
  reasoning: string;
}

const PatientForm = () => {
  const [patientData, setPatientData] = useState<PatientData>({
    age: '',
    severity: '1',
    arrival: 'Ambulance'
  });
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate AI recommendation logic
    setTimeout(() => {
      const ageNum = parseInt(patientData.age);
      const severityNum = parseInt(patientData.severity);
      
      // Simple logic for demonstration
      const baseScore = (ageNum > 70 ? 30 : 20) + (severityNum ? 40 : 10) + (patientData.arrival === 'Ambulance' ? 20 : 10);
      const admit = baseScore > 60;
      const confidence = Math.min(95, baseScore + Math.random() * 20);
      
      const result: RecommendationResult = {
        admit,
        confidence: Math.round(confidence),
        score: baseScore,
        reasoning: admit 
          ? `High priority admission recommended. Patient age (${ageNum}), severity level (${severityNum ? 'High' : 'Low'}), and arrival type (${patientData.arrival}) indicate immediate ICU care needed.`
          : `Standard care recommended. Patient metrics suggest monitoring in general ward may be sufficient at this time.`
      };
      
      setRecommendation(result);
      setLoading(false);
      
      toast({
        title: "AI Recommendation Generated",
        description: admit ? "Patient should be admitted to ICU" : "Standard care recommended",
      });
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧾 New Patient Admission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={patientData.age}
                onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                placeholder="Enter patient age"
                required
                min="0"
                max="120"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="severity">Severity Level</Label>
              <Select value={patientData.severity} onValueChange={(value) => setPatientData({ ...patientData, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High Priority</SelectItem>
                  <SelectItem value="0">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival Type</Label>
              <Select value={patientData.arrival} onValueChange={(value) => setPatientData({ ...patientData, arrival: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ambulance">Ambulance</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Analyzing..." : "Get AI Recommendation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {recommendation && (
        <Card className={`border-2 ${recommendation.admit ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`text-xl font-bold ${recommendation.admit ? 'text-red-600' : 'text-green-600'}`}>
              {recommendation.admit ? '✅ ADMIT TO ICU' : '❌ STANDARD CARE'}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Confidence:</span> {recommendation.confidence}%
              </div>
              <div>
                <span className="font-semibold">Score:</span> {recommendation.score}
              </div>
            </div>
            <div>
              <span className="font-semibold">Reasoning:</span>
              <p className="mt-1 text-gray-700">{recommendation.reasoning}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => toast({ title: "Patient Admitted", description: "Patient has been admitted to ICU" })}
              >
                Admit Patient
              </Button>
              <Button 
                variant="outline"
                onClick={() => toast({ title: "Patient Discharged", description: "Patient sent to general ward" })}
              >
                General Ward
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientForm;
