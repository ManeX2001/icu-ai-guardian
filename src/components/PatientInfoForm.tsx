
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

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

interface PatientInfoFormProps {
  currentPatient: PatientData;
  onPatientChange: (patient: PatientData) => void;
  onAddPatient: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

const PatientInfoForm = ({ 
  currentPatient, 
  onPatientChange, 
  onAddPatient, 
  onSubmit, 
  loading 
}: PatientInfoFormProps) => {
  const getSeverityLabel = (value: string) => {
    const labels = ['', 'Minor', 'Minor', 'Mild', 'Mild', 'Moderate', 'Moderate', 'Severe', 'Severe', 'Critical', 'Critical'];
    return `${value} - ${labels[parseInt(value)] || 'Moderate'}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧾 Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="age">Patient Age</Label>
            <Input
              id="age"
              type="number"
              value={currentPatient.age}
              onChange={(e) => onPatientChange({ ...currentPatient, age: e.target.value })}
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
              onChange={(e) => onPatientChange({ ...currentPatient, severity: e.target.value })}
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
            <Select value={currentPatient.arrivalType} onValueChange={(value) => onPatientChange({ ...currentPatient, arrivalType: value })}>
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
            <Select value={currentPatient.predictedLos} onValueChange={(value) => onPatientChange({ ...currentPatient, predictedLos: value })}>
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
            <Button type="button" onClick={onAddPatient} variant="outline" className="flex-1">
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
  );
};

export default PatientInfoForm;
