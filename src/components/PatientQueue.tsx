
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, UserPlus } from 'lucide-react';

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

interface PatientQueueProps {
  patients: PatientData[];
  onRemovePatient: (id: string) => void;
}

const PatientQueue = ({ patients, onRemovePatient }: PatientQueueProps) => {
  const getSeverityLabel = (value: string) => {
    const labels = ['', 'Minor', 'Minor', 'Mild', 'Mild', 'Moderate', 'Moderate', 'Severe', 'Severe', 'Critical', 'Critical'];
    return `${value} - ${labels[parseInt(value)] || 'Moderate'}`;
  };

  if (patients.length === 0) return null;

  return (
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
                  onClick={() => onRemovePatient(patient.id)}
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
  );
};

export default PatientQueue;
