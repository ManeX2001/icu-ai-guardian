
export interface PatientApiRequest {
  patient_features: {
    age: number;
    severity: number;
    arrival_type: string;
    predicted_los: number;
  };
  hospital_state: {
    icu_occupancy: number;
    ward_occupancy: number;
    staff_availability: number;
  };
  decision_weights: {
    medical_priority: number;
    economic_priority: number;
    operational_priority: number;
  };
  timestamp: string;
}

export interface PPOApiResponse {
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

export class PPOApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async getAdmissionRecommendation(data: PatientApiRequest): Promise<PPOApiResponse> {
    const response = await fetch(`${this.baseUrl}/api/admission-decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`PPO API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModelInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/model-info`);
    if (!response.ok) {
      throw new Error(`Model info request failed: ${response.status}`);
    }
    return await response.json();
  }
}
