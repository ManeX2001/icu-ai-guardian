
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface DecisionPrioritiesProps {
  currentPatient: PatientData;
  onPatientChange: (patient: PatientData) => void;
}

const DecisionPriorities = ({ currentPatient, onPatientChange }: DecisionPrioritiesProps) => {
  const getTotalPriority = () => {
    const total = parseFloat(currentPatient.medicalPriority) + 
                  parseFloat(currentPatient.economicPriority) + 
                  parseFloat(currentPatient.operationalPriority);
    return Math.round(total * 100);
  };

  return (
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
              onChange={(e) => onPatientChange({ ...currentPatient, medicalPriority: e.target.value })}
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
              onChange={(e) => onPatientChange({ ...currentPatient, economicPriority: e.target.value })}
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
              onChange={(e) => onPatientChange({ ...currentPatient, operationalPriority: e.target.value })}
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
  );
};

export default DecisionPriorities;
