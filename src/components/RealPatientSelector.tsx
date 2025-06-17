
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientDataService, RealPatientData } from '../services/patientDataService';
import { Shuffle, Database } from 'lucide-react';

interface RealPatientSelectorProps {
  onPatientSelected: (patient: RealPatientData) => void;
}

const RealPatientSelector = ({ onPatientSelected }: RealPatientSelectorProps) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [currentPatient, setCurrentPatient] = useState<RealPatientData | null>(null);

  const allPatients = PatientDataService.getAllPatients();

  const handleRandomPatient = () => {
    const randomPatient = PatientDataService.getRandomPatient();
    setCurrentPatient(randomPatient);
    setSelectedPatientId(randomPatient.icustay_id);
    onPatientSelected(randomPatient);
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = PatientDataService.getPatientById(patientId);
    if (patient) {
      setCurrentPatient(patient);
      setSelectedPatientId(patientId);
      onPatientSelected(patient);
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Real Patient Data (MIMIC-like)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={selectedPatientId} onValueChange={handlePatientSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a patient by ICU Stay ID" />
            </SelectTrigger>
            <SelectContent>
              {allPatients.map((patient) => (
                <SelectItem key={patient.icustay_id} value={patient.icustay_id}>
                  ID: {patient.icustay_id} | Age: {Math.round(patient.age)} | {patient.gender} | {patient.admission_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRandomPatient} variant="outline">
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>

        {currentPatient && (
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">Patient {currentPatient.icustay_id} - Real Vitals</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Age:</strong> {Math.round(currentPatient.age)}</div>
              <div><strong>Gender:</strong> {currentPatient.gender}</div>
              <div><strong>Heart Rate:</strong> {currentPatient.HeartRate.toFixed(1)} bpm</div>
              <div><strong>Blood Pressure:</strong> {currentPatient.SysBP.toFixed(0)}/{currentPatient.DiastolicBP.toFixed(0)}</div>
              <div><strong>Resp Rate:</strong> {currentPatient.RespRate.toFixed(1)}</div>
              <div><strong>SpO2:</strong> {currentPatient.SpO2.toFixed(1)}%</div>
              <div><strong>Temperature:</strong> {currentPatient.Temperature.toFixed(1)}°F</div>
              <div><strong>Admission:</strong> {currentPatient.admission_type}</div>
              <div className={`col-span-2 ${currentPatient.in_icu_death ? 'text-red-600' : 'text-green-600'}`}>
                <strong>Actual Outcome:</strong> {currentPatient.in_icu_death ? 'ICU Death' : 'Survived ICU'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealPatientSelector;
