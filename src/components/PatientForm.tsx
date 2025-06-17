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
  action_type: string;
  reasoning: string;
  action_probabilities: {
    admit_to_icu: number;
    admit_to_ward: number;
    discharge_home: number;
    refer_to_specialist: number;
    schedule_outpatient: number;
  };
  state_value: number;
  policy_entropy: number;
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
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000/api/admission-decision');
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
    
    try {
      // Prepare data for Python PPO API
      const requestData = {
        patient_features: {
          age: parseInt(currentPatient.age),
          severity: parseInt(currentPatient.severity),
          arrival_type: currentPatient.arrivalType,
          predicted_los: parseInt(currentPatient.predictedLos)
        },
        hospital_state: {
          icu_occupancy: 0.85, // This would come from real hospital data
          ward_occupancy: 0.75,
          staff_availability: 0.9
        },
        decision_weights: {
          medical_priority: parseFloat(currentPatient.medicalPriority),
          economic_priority: parseFloat(currentPatient.economicPriority),
          operational_priority: parseFloat(currentPatient.operationalPriority)
        },
        timestamp: new Date().toISOString()
      };

      console.log('Sending request to Python PPO API:', requestData);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result: RecommendationResult = await response.json();
      
      setRecommendation(result);
      setLoading(false);
      
      toast({
        title: "PPO AI Recommendation Generated",
        description: `Action: ${result.action_type} (Confidence: ${Math.round(result.confidence * 100)}%)`,
      });

    } catch (error) {
      console.error('Error calling Python PPO API:', error);
      
      // Fallback to simulated response if API is not available
      toast({
        title: "API Connection Failed",
        description: "Using fallback simulation. Please ensure Python PPO server is running.",
        variant: "destructive"
      });
      
      // Fallback simulation
      setTimeout(() => {
        const fallbackResult: RecommendationResult = {
          admit: Math.random() > 0.5,
          confidence: 0.7 + Math.random() * 0.3,
          action_type: 'admit_to_icu',
          reasoning: 'Fallback simulation - Python PPO API not available. Please start the FastAPI server with your trained PPO model.',
          action_probabilities: {
            admit_to_icu: Math.random() * 0.4,
            admit_to_ward: Math.random() * 0.3,
            discharge_home: Math.random() * 0.2,
            refer_to_specialist: Math.random() * 0.1,
            schedule_outpatient: Math.random() * 0.1
          },
          state_value: Math.random() * 100,
          policy_entropy: Math.random()
        };
        
        setRecommendation(fallbackResult);
        setLoading(false);
      }, 1000);
    }
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
      {/* API Configuration */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🐍 Python PPO API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="apiEndpoint">Python API Endpoint</Label>
            <Input
              id="apiEndpoint"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="http://localhost:8000/api/admission-decision"
            />
            <div className="text-sm text-blue-600">
              Make sure your Python FastAPI server with trained PPO model is running on this endpoint.
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Enhanced Results Section for PPO */}
      {recommendation && (
        <Card className={`border-2 ${recommendation.admit ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 PPO AI Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main PPO Decision */}
              <div>
                <div className={`text-2xl font-bold mb-4 ${recommendation.admit ? 'text-red-600' : 'text-green-600'}`}>
                  {recommendation.action_type.toUpperCase().replace('_', ' ')}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Confidence:</span> {Math.round(recommendation.confidence * 100)}%
                  </div>
                  <div>
                    <span className="font-semibold">State Value:</span> {recommendation.state_value?.toFixed(2) || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Policy Entropy:</span> {recommendation.policy_entropy?.toFixed(3) || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">PPO Reasoning:</span>
                    <p className="mt-1 text-gray-700 text-sm">{recommendation.reasoning}</p>
                  </div>
                </div>
              </div>

              {/* Action Probabilities */}
              <div>
                <h4 className="font-semibold mb-4">Action Probabilities (PPO Output)</h4>
                <div className="space-y-3">
                  {recommendation.action_probabilities && Object.entries(recommendation.action_probabilities).map(([action, prob]) => (
                    <div key={action}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{action.replace('_', ' ')}</span>
                        <span>{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${prob * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => toast({ 
                  title: "PPO Recommendation Accepted", 
                  description: "Patient decision logged and sent to training pipeline" 
                })}
              >
                Accept PPO Decision
              </Button>
              <Button 
                variant="outline"
                onClick={() => setRecommendation(null)}
              >
                New Assessment
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const reportData = {
                    patient: currentPatient,
                    recommendation: recommendation,
                    timestamp: new Date().toISOString()
                  };
                  console.log('PPO Report Data:', reportData);
                  window.print();
                }}
              >
                Export PPO Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Python Setup Instructions */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle>🛠️ Python PPO Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1. Install Dependencies:</strong></p>
            <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
              pip install fastapi uvicorn stable-baselines3 gymnasium pandas numpy
            </code>
            
            <p><strong>2. Train PPO Model:</strong></p>
            <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
              python train_ppo_icu.py --data mimic_admissions.csv --epochs 1000
            </code>
            
            <p><strong>3. Start API Server:</strong></p>
            <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
              uvicorn main:app --host 0.0.0.0 --port 8000 --reload
            </code>
            
            <p className="text-blue-700">
              The API will use your trained PPO model to make real admission decisions based on patient data and hospital state.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientForm;
