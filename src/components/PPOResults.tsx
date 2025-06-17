
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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

interface PPOResultsProps {
  recommendation: RecommendationResult;
  currentPatient: PatientData;
  onNewAssessment: () => void;
}

const PPOResults = ({ recommendation, currentPatient, onNewAssessment }: PPOResultsProps) => {
  const { toast } = useToast();

  const handleAcceptDecision = () => {
    toast({ 
      title: "PPO Recommendation Accepted", 
      description: "Patient decision logged and sent to training pipeline" 
    });
  };

  const handleExportReport = () => {
    const reportData = {
      patient: currentPatient,
      recommendation: recommendation,
      timestamp: new Date().toISOString()
    };
    console.log('PPO Report Data:', reportData);
    window.print();
  };

  return (
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
            onClick={handleAcceptDecision}
          >
            Accept PPO Decision
          </Button>
          <Button 
            variant="outline"
            onClick={onNewAssessment}
          >
            New Assessment
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportReport}
          >
            Export PPO Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PPOResults;
