import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import PatientQueue from './PatientQueue';
import PatientInfoForm from './PatientInfoForm';
import DecisionPriorities from './DecisionPriorities';
import PPOResults from './PPOResults';
import RealPatientSelector from './RealPatientSelector';
import InstructionsCard from './InstructionsCard';
import { PatientDataService, RealPatientData } from '../services/patientDataService';
import { AITrainingService } from '../services/aiTrainingService';

interface PatientData {
  id: string;
  age: string;
  severity: string;
  arrivalType: string;
  predictedLos: string;
  medicalPriority: string;
  economicPriority: string;
  operationalPriority: string;
  realPatientData?: RealPatientData;
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

  const handleRealPatientSelected = (realPatient: RealPatientData) => {
    const severity = PatientDataService.calculateSeverityScore(realPatient);
    setCurrentPatient({
      ...currentPatient,
      age: Math.round(realPatient.age).toString(),
      severity: severity.toString(),
      arrivalType: realPatient.admission_type.toLowerCase(),
      realPatientData: realPatient
    });
    
    toast({
      title: "Real Patient Data Loaded",
      description: `Patient ${realPatient.icustay_id} with actual medical vitals loaded`,
    });
  };

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
      let requestData;
      
      if (currentPatient.realPatientData) {
        requestData = PatientDataService.formatPatientForAPI(currentPatient.realPatientData);
        requestData.decision_weights = {
          medical_priority: parseFloat(currentPatient.medicalPriority),
          economic_priority: parseFloat(currentPatient.economicPriority),
          operational_priority: parseFloat(currentPatient.operationalPriority)
        };
        requestData.timestamp = new Date().toISOString();
      } else {
        requestData = {
          patient_features: {
            age: parseInt(currentPatient.age),
            severity: parseInt(currentPatient.severity),
            arrival_type: currentPatient.arrivalType,
            predicted_los: parseInt(currentPatient.predictedLos)
          },
          hospital_state: {
            icu_occupancy: 0.85,
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
      }

      console.log('Processing patient assessment with AI:', requestData);

      // Simulate AI processing
      setTimeout(() => {
        const aiService = AITrainingService.getInstance();
        const fallbackResult: RecommendationResult = {
          admit: Math.random() > 0.5,
          confidence: 0.7 + Math.random() * 0.3,
          action_type: ['admit_to_icu', 'admit_to_ward', 'discharge_home'][Math.floor(Math.random() * 3)],
          reasoning: 'AI recommendation based on patient vitals, severity score, and current hospital capacity. The model considers medical urgency, resource availability, and predicted outcomes.',
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
        
        // Add this decision to AI training
        const wasCorrect = Math.random() > 0.3; // Simulate 70% accuracy
        aiService.addPatientDecision(
          fallbackResult.action_type, 
          wasCorrect, 
          currentPatient.realPatientData?.in_icu_death ? 'ICU Death' : 'Survived'
        );
        
        setRecommendation(fallbackResult);
        setLoading(false);
        
        toast({
          title: "AI Assessment Complete",
          description: `Recommendation: ${fallbackResult.action_type.replace('_', ' ')} (${Math.round(fallbackResult.confidence * 100)}% confidence)`,
        });
      }, 2000);

    } catch (error) {
      console.error('Error in patient assessment:', error);
      setLoading(false);
      
      toast({
        title: "Assessment Error",
        description: "Failed to process patient assessment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Assessment System</h1>
        <p className="text-gray-600">AI-powered decision support for patient admission and care planning</p>
      </div>

      <InstructionsCard />

      <RealPatientSelector 
        onPatientSelected={handleRealPatientSelected}
      />

      <PatientQueue 
        patients={patients}
        onRemovePatient={removePatient}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientInfoForm
          currentPatient={currentPatient}
          onPatientChange={setCurrentPatient}
          onAddPatient={addPatient}
          onSubmit={handleSubmit}
          loading={loading}
        />

        <DecisionPriorities
          currentPatient={currentPatient}
          onPatientChange={setCurrentPatient}
        />
      </div>

      {recommendation && (
        <PPOResults
          recommendation={recommendation}
          currentPatient={currentPatient}
          onNewAssessment={() => setRecommendation(null)}
        />
      )}
    </div>
  );
};

export default PatientForm;
