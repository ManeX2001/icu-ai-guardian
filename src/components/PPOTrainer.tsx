
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PatientData {
  DiastolicBP: number;
  HeartRate: number;
  MeanBP: number;
  RespRate: number;
  SpO2: number;
  SysBP: number;
  Temperature: number;
  age: number;
  gender: string;
  admission_type: string;
}

interface PredictionResponse {
  action: number;
  action_name: string;
  action_probabilities: Record<string, number>;
  confidence: number;
  state_value: number;
  reasoning: string;
}

const PPOTrainer = () => {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [isTraining, setIsTraining] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [patient, setPatient] = useState<PatientData>({
    DiastolicBP: 70,
    HeartRate: 80,
    MeanBP: 85,
    RespRate: 16,
    SpO2: 98,
    SysBP: 120,
    Temperature: 98.6,
    age: 65,
    gender: 'M',
    admission_type: 'EMERGENCY'
  });
  const { toast } = useToast();

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      toast({
        title: "Backend Status",
        description: `Status: ${data.status}, Model loaded: ${data.model_loaded}`,
      });
    } catch (error) {
      toast({
        title: "Backend Error",
        description: "Cannot connect to Python backend. Make sure it's running on port 8000.",
        variant: "destructive"
      });
    }
  };

  const trainModel = async () => {
    setIsTraining(true);
    try {
      const response = await fetch(`${apiUrl}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epochs: 10 })
      });
      
      if (!response.ok) throw new Error('Training failed');
      
      const result = await response.json();
      toast({
        title: "Training Complete",
        description: `Completed ${result.epochs_completed} epochs with final reward: ${result.final_reward.toFixed(2)}`,
      });
    } catch (error) {
      toast({
        title: "Training Error",
        description: "Failed to train model. Check backend connection.",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  const makePrediction = async () => {
    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient)
      });
      
      if (!response.ok) throw new Error('Prediction failed');
      
      const result = await response.json();
      setPrediction(result);
      toast({
        title: "Prediction Complete",
        description: `Recommended: ${result.action_name} (${(result.confidence * 100).toFixed(1)}% confidence)`,
      });
    } catch (error) {
      toast({
        title: "Prediction Error",
        description: "Failed to get prediction. Check backend connection.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Backend Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Backend Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apiUrl">Python API URL</Label>
            <Input
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
            />
          </div>
          <Button onClick={checkBackendHealth} variant="outline">
            Check Backend Health
          </Button>
        </CardContent>
      </Card>

      {/* Training */}
      <Card>
        <CardHeader>
          <CardTitle>PPO Training</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={trainModel} 
            disabled={isTraining}
            className="w-full"
          >
            {isTraining ? 'Training PPO Model...' : 'Train PPO Model (10 epochs)'}
          </Button>
        </CardContent>
      </Card>

      {/* Patient Input */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age</Label>
              <Input
                type="number"
                value={patient.age}
                onChange={(e) => setPatient({...patient, age: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label>Heart Rate</Label>
              <Input
                type="number"
                value={patient.HeartRate}
                onChange={(e) => setPatient({...patient, HeartRate: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label>Systolic BP</Label>
              <Input
                type="number"
                value={patient.SysBP}
                onChange={(e) => setPatient({...patient, SysBP: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label>Diastolic BP</Label>
              <Input
                type="number"
                value={patient.DiastolicBP}
                onChange={(e) => setPatient({...patient, DiastolicBP: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label>SpO2</Label>
              <Input
                type="number"
                value={patient.SpO2}
                onChange={(e) => setPatient({...patient, SpO2: Number(e.target.value)})}
              />
            </div>
            <div>
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                value={patient.Temperature}
                onChange={(e) => setPatient({...patient, Temperature: Number(e.target.value)})}
              />
            </div>
          </div>
          <Button onClick={makePrediction} className="w-full">
            Get PPO Prediction
          </Button>
        </CardContent>
      </Card>

      {/* Prediction Results */}
      {prediction && (
        <Card>
          <CardHeader>
            <CardTitle>PPO Prediction Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold text-blue-600">
              {prediction.action_name}
            </div>
            <div>
              <strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%
            </div>
            <div>
              <strong>State Value:</strong> {prediction.state_value.toFixed(2)}
            </div>
            <div>
              <strong>Action Probabilities:</strong>
              <div className="mt-2 space-y-1">
                {Object.entries(prediction.action_probabilities).map(([action, prob]) => (
                  <div key={action} className="flex justify-between">
                    <span>{action}:</span>
                    <span>{(prob * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <strong>Reasoning:</strong>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                {prediction.reasoning}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PPOTrainer;
