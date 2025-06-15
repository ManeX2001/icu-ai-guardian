
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, UserPlus } from 'lucide-react';

interface PatientData {
  id: string;
  age: string;
  severity: string;
  arrivalType: string;
  predictedLos: string;
  medicalPriority: string;
  economicPriority: string;
  operationalPriority: string;
}

interface RecommendationResult {
  admit: boolean;
  confidence: number;
  score: number;
  reasoning: string;
  scores: {
    medical_score: number;
    economic_score: number;
    operational_score: number;
    final_score: number;
  };
  alternatives: Array<{
    option: string;
    score: number;
  }>;
}

const PatientForm = () => {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [currentPatient, setCurrentPatient] = useState<PatientData>({
    id: '',
    age: '',
    severity: '5',
    arrivalType: 'walk-in',
    predictedLos: '3',
    medicalPriority: '0.4',
    economicPriority: '0.3',
    operationalPriority: '0.3'
  });
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addPatient = () => {
    if (!currentPatient.age) {
      toast({
        title: "Validation Error",
        description: "Please enter patient age before adding",
        variant: "destructive"
      });
      return;
    }

    const newPatient = {
      ...currentPatient,
      id: Date.now().toString()
    };

    setPatients([...patients, newPatient]);
    setCurrentPatient({
      id: '',
      age: '',
      severity: '5',
      arrivalType: 'walk-in',
      predictedLos: '3',
      medicalPriority: '0.4',
      economicPriority: '0.3',
      operationalPriority: '0.3'
    });
    
    toast({
      title: "Patient Added",
      description: `Patient (Age: ${newPatient.age}) added to queue successfully`,
    });
  };

  const removePatient = (id: string) => {
    setPatients(patients.filter(patient => patient.id !== id));
    toast({
      title: "Patient Removed",
      description: "Patient removed from queue",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate AI recommendation logic with enhanced scoring
    setTimeout(() => {
      const ageNum = parseInt(currentPatient.age);
      const severityNum = parseInt(currentPatient.severity);
      const medicalPriorityNum = parseFloat(currentPatient.medicalPriority);
      const economicPriorityNum = parseFloat(currentPatient.economicPriority);
      const operationalPriorityNum = parseFloat(currentPatient.operationalPriority);
      const losNum = parseInt(currentPatient.predictedLos);
      
      // Enhanced scoring algorithm
      const ageScore = ageNum > 70 ? 80 : ageNum > 50 ? 60 : 40;
      const severityScore = severityNum * 10;
      const arrivalScore = currentPatient.arrivalType === 'ambulance' ? 90 : 
                          currentPatient.arrivalType === 'transfer' ? 75 :
                          currentPatient.arrivalType === 'referral' ? 60 : 30;
      const losScore = losNum > 7 ? 80 : losNum > 3 ? 60 : 40;
      
      const medicalScore = Math.round((ageScore + severityScore + arrivalScore) / 3);
      const economicScore = Math.round(100 - (losNum * 8)); // Lower score for longer stays
      const operationalScore = Math.round(Math.random() * 40 + 60); // Simulated operational factors
      
      const finalScore = Math.round(
        medicalScore * medicalPriorityNum + 
        economicScore * economicPriorityNum + 
        operationalScore * operationalPriorityNum
      );
      
      const admit = finalScore > 65;
      const confidence = Math.min(95, finalScore + Math.random() * 20) / 100;
      
      const alternatives = [
        { option: "Outpatient monitoring with follow-up", score: Math.round(finalScore * 0.7) },
        { option: "Emergency department observation", score: Math.round(finalScore * 0.8) },
        { option: "Telemetry unit admission", score: Math.round(finalScore * 0.9) }
      ].sort((a, b) => b.score - a.score);
      
      const result: RecommendationResult = {
        admit,
        confidence,
        score: finalScore,
        reasoning: admit 
          ? `High priority admission recommended. Patient profile (Age: ${ageNum}, Severity: ${severityNum}/10, Arrival: ${currentPatient.arrivalType}, Predicted LOS: ${losNum} days) indicates immediate care needed. Medical priority weighted at ${Math.round(medicalPriorityNum * 100)}%.`
          : `Standard care pathway recommended. Patient metrics suggest outpatient or observation care may be sufficient. Consider alternatives based on bed availability and resource allocation.`,
        scores: {
          medical_score: medicalScore,
          economic_score: economicScore,
          operational_score: operationalScore,
          final_score: finalScore
        },
        alternatives
      };
      
      setRecommendation(result);
      setLoading(false);
      
      toast({
        title: "AI Recommendation Generated",
        description: admit ? "Patient should be admitted to ICU" : "Alternative care recommended",
      });
    }, 2000);
  };

  const getSeverityLabel = (value: string) => {
    const labels = ['', 'Minor', 'Minor', 'Mild', 'Mild', 'Moderate', 'Moderate', 'Severe', 'Severe', 'Critical', 'Critical'];
    return `${value} - ${labels[parseInt(value)] || 'Moderate'}`;
  };

  const getTotalPriority = () => {
    const total = parseFloat(currentPatient.medicalPriority) + parseFloat(currentPatient.economicPriority) + parseFloat(currentPatient.operationalPriority);
    return Math.round(total * 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Patient Queue */}
      {patients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Patient Queue ({patients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((patient) => (
                <div key={patient.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Patient #{patient.id.slice(-4)}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePatient(patient.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Age:</strong> {patient.age}</div>
                    <div><strong>Severity:</strong> {getSeverityLabel(patient.severity)}</div>
                    <div><strong>Arrival:</strong> {patient.arrivalType}</div>
                    <div><strong>Predicted LOS:</strong> {patient.predictedLos} days</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧾 Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="age">Patient Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={currentPatient.age}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, age: e.target.value })}
                  placeholder="Enter patient age"
                  required
                  min="0"
                  max="120"
                />
                <div className="text-sm text-gray-500">Age in years (0-120)</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="severity">Medical Severity Score</Label>
                <Input
                  id="severity"
                  type="range"
                  min="1"
                  max="10"
                  value={currentPatient.severity}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, severity: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1 - Minor</span>
                  <span>{getSeverityLabel(currentPatient.severity)}</span>
                  <span>10 - Critical</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="arrivalType">Arrival Type</Label>
                <Select value={currentPatient.arrivalType} onValueChange={(value) => setCurrentPatient({ ...currentPatient, arrivalType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="ambulance">Ambulance</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="predictedLos">Predicted Length of Stay</Label>
                <Select value={currentPatient.predictedLos} onValueChange={(value) => setCurrentPatient({ ...currentPatient, predictedLos: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="4">4 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="10">10 days</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" onClick={addPatient} variant="outline" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Queue
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Analyzing..." : "Get AI Recommendation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Decision Priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Decision Priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm">Adjust the importance of different factors in admission decisions</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Medical Priority</Label>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentPatient.medicalPriority}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, medicalPriority: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Low</span>
                  <span>{Math.round(parseFloat(currentPatient.medicalPriority) * 100)}%</span>
                  <span>High</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Economic Priority</Label>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentPatient.economicPriority}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, economicPriority: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Low</span>
                  <span>{Math.round(parseFloat(currentPatient.economicPriority) * 100)}%</span>
                  <span>High</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Operational Priority</Label>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentPatient.operationalPriority}
                  onChange={(e) => setCurrentPatient({ ...currentPatient, operationalPriority: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Low</span>
                  <span>{Math.round(parseFloat(currentPatient.operationalPriority) * 100)}%</span>
                  <span>High</span>
                </div>
              </div>
              
              <div className={`p-3 rounded-md ${getTotalPriority() === 100 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="text-sm font-medium">
                  Total Priority: {getTotalPriority()}%
                </div>
                {getTotalPriority() !== 100 && (
                  <div className="text-xs text-yellow-600 mt-1">
                    Priorities should total 100%
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {recommendation && (
        <Card className={`border-2 ${recommendation.admit ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Decision */}
              <div>
                <div className={`text-2xl font-bold mb-4 ${recommendation.admit ? 'text-red-600' : 'text-green-600'}`}>
                  {recommendation.admit ? '✅ ADMIT TO ICU' : '❌ ALTERNATIVE CARE'}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Confidence:</span> {Math.round(recommendation.confidence * 100)}%
                  </div>
                  <div>
                    <span className="font-semibold">Final Score:</span> {recommendation.score}/100
                  </div>
                  <div>
                    <span className="font-semibold">Reasoning:</span>
                    <p className="mt-1 text-gray-700 text-sm">{recommendation.reasoning}</p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <h4 className="font-semibold mb-4">Score Breakdown</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Medical Score</span>
                      <span>{recommendation.scores.medical_score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${recommendation.scores.medical_score}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Economic Score</span>
                      <span>{recommendation.scores.economic_score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${recommendation.scores.economic_score}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Operational Score</span>
                      <span>{recommendation.scores.operational_score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${recommendation.scores.operational_score}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm mb-1 font-semibold">
                      <span>Final Score</span>
                      <span>{recommendation.scores.final_score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-yellow-500 h-3 rounded-full" style={{ width: `${recommendation.scores.final_score}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Options */}
            <div>
              <h4 className="font-semibold mb-3">Alternative Options</h4>
              <div className="space-y-2">
                {recommendation.alternatives.map((alt, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="text-sm"><strong>{index + 1}.</strong> {alt.option}</span>
                    <span className="text-sm font-medium">{alt.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => toast({ title: "Recommendation Accepted", description: "Patient admission decision logged" })}
              >
                Accept Recommendation
              </Button>
              <Button 
                variant="outline"
                onClick={() => setRecommendation(null)}
              >
                New Assessment
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.print()}
              >
                Print Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientForm;
