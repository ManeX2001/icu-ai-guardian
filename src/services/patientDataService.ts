
export interface RealPatientData {
  icustay_id: string;
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
  in_hospital_death: boolean;
  in_icu_death: boolean;
}

// Your actual patient data
const REAL_PATIENT_DATA: RealPatientData[] = [
  {
    icustay_id: "201204",
    DiastolicBP: 54.25925925925926,
    HeartRate: 72.94444444444444,
    MeanBP: 73.37037037037037,
    RespRate: 18.555555555555557,
    SpO2: 98.0925925925926,
    SysBP: 136.2962962962963,
    Temperature: 96.5090909090909,
    age: 80.56089930793216,
    gender: "F",
    admission_type: "EMERGENCY",
    in_hospital_death: false,
    in_icu_death: false
  },
  {
    icustay_id: "204132",
    DiastolicBP: 90.09433962264151,
    HeartRate: 111.93373493975903,
    MeanBP: 101.27848101265823,
    RespRate: 20.433734939759034,
    SpO2: 96.5670731707317,
    SysBP: 139.41509433962264,
    Temperature: 98.47441860465115,
    age: 41.055929506679846,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: true,
    in_icu_death: true
  },
  {
    icustay_id: "205170",
    DiastolicBP: 64.65384615384616,
    HeartRate: 76.96,
    MeanBP: 74.15384615384616,
    RespRate: 14.527027027027026,
    SpO2: 98.52054794520548,
    SysBP: 105.88461538461539,
    Temperature: 97.63333333333334,
    age: 62.463294293609145,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: false,
    in_icu_death: false
  },
  {
    icustay_id: "209797",
    DiastolicBP: 62.15714285714286,
    HeartRate: 71.2,
    MeanBP: 72.68115942028986,
    RespRate: 12.80281690140845,
    SpO2: 98.70422535211267,
    SysBP: 106.85714285714286,
    Temperature: 97.39375,
    age: 65.30310967880955,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: false,
    in_icu_death: false
  },
  {
    icustay_id: "210164",
    DiastolicBP: 69.85185185185185,
    HeartRate: 91.66666666666667,
    MeanBP: 80.62962962962963,
    RespRate: 15.766666666666667,
    SpO2: 99.9,
    SysBP: 116.88888888888889,
    Temperature: 98.05714285714285,
    age: 43.85306100590666,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: false,
    in_icu_death: false
  },
  {
    icustay_id: "210474",
    DiastolicBP: 72.80392156862744,
    HeartRate: 80.70270270270271,
    MeanBP: 95.28,
    RespRate: 26.931506849315067,
    SpO2: 93.72972972972973,
    SysBP: 159.86274509803923,
    Temperature: 98.53571428571429,
    age: 80.96068398737546,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: true,
    in_icu_death: false
  },
  {
    icustay_id: "210989",
    DiastolicBP: 55.5,
    HeartRate: 109.4493041749503,
    MeanBP: 72.61764705882354,
    RespRate: 21.80439121756487,
    SpO2: 96.65737051792829,
    SysBP: 130.7058823529412,
    Temperature: 99.75,
    age: 40.60551477298654,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: false,
    in_icu_death: false
  },
  {
    icustay_id: "213315",
    DiastolicBP: 70.53947368421052,
    HeartRate: 68.24358974358974,
    MeanBP: 82.40789473684211,
    RespRate: 12.538461538461538,
    SpO2: 98.9090909090909,
    SysBP: 120.42105263157895,
    Temperature: 97.6263157894737,
    age: 65.16824124775015,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: false,
    in_icu_death: false
  },
  {
    icustay_id: "214180",
    DiastolicBP: 63.30232558139535,
    HeartRate: 105.0909090909091,
    MeanBP: 73.04651162790698,
    RespRate: 18.88888888888889,
    SpO2: 95.0,
    SysBP: 105.77272727272727,
    Temperature: 99.06153846153846,
    age: 53.50507985398129,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: false,
    in_icu_death: false
  },
  {
    icustay_id: "216185",
    DiastolicBP: 61.28395061728395,
    HeartRate: 79.60727272727273,
    MeanBP: 75.97560975609755,
    RespRate: 20.76086956521739,
    SpO2: 95.99651567944251,
    SysBP: 124.67901234567901,
    Temperature: 98.32957746478873,
    age: 48.94745088346389,
    gender: "M",
    admission_type: "EMERGENCY",
    in_hospital_death: false,
    in_icu_death: false
  }
  // Adding first 10 patients - you can add more as needed
];

export class PatientDataService {
  static getAllPatients(): RealPatientData[] {
    return REAL_PATIENT_DATA;
  }

  static getRandomPatient(): RealPatientData {
    const randomIndex = Math.floor(Math.random() * REAL_PATIENT_DATA.length);
    return REAL_PATIENT_DATA[randomIndex];
  }

  static getPatientById(icustay_id: string): RealPatientData | undefined {
    return REAL_PATIENT_DATA.find(patient => patient.icustay_id === icustay_id);
  }

  static calculateSeverityScore(patient: RealPatientData): number {
    // Calculate severity based on vital signs
    let score = 1; // Base score
    
    // Heart rate abnormalities
    if (patient.HeartRate > 100 || patient.HeartRate < 60) score += 2;
    
    // Blood pressure abnormalities
    if (patient.SysBP > 140 || patient.SysBP < 90) score += 2;
    if (patient.DiastolicBP > 90 || patient.DiastolicBP < 60) score += 1;
    
    // Respiratory rate
    if (patient.RespRate > 20 || patient.RespRate < 12) score += 2;
    
    // SpO2
    if (patient.SpO2 < 95) score += 3;
    
    // Temperature
    if (patient.Temperature > 100.4 || patient.Temperature < 96) score += 1;
    
    // Age factor
    if (patient.age > 75) score += 2;
    
    return Math.min(score, 10); // Cap at 10
  }

  static formatPatientForAPI(patient: RealPatientData) {
    return {
      patient_features: {
        age: Math.round(patient.age),
        severity: this.calculateSeverityScore(patient),
        arrival_type: patient.admission_type.toLowerCase(),
        predicted_los: Math.round(Math.random() * 7) + 1, // Still simulated
        heart_rate: patient.HeartRate,
        systolic_bp: patient.SysBP,
        diastolic_bp: patient.DiastolicBP,
        respiratory_rate: patient.RespRate,
        spo2: patient.SpO2,
        temperature: patient.Temperature,
        gender: patient.gender
      },
      hospital_state: {
        icu_occupancy: 0.85, // Still simulated - you'd need real hospital data
        ward_occupancy: 0.75,
        staff_availability: 0.9
      },
      patient_id: patient.icustay_id,
      actual_outcomes: {
        in_hospital_death: patient.in_hospital_death,
        in_icu_death: patient.in_icu_death
      }
    };
  }
}
