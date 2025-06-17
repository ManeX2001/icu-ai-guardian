
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class PatientDataProcessor:
    """Handle patient data processing and feature engineering"""
    
    def __init__(self):
        self.feature_stats = {
            'age': {'min': 18, 'max': 100, 'mean': 65, 'std': 15},
            'diastolic_bp': {'min': 40, 'max': 120, 'mean': 70, 'std': 15},
            'heart_rate': {'min': 40, 'max': 150, 'mean': 80, 'std': 20},
            'mean_bp': {'min': 50, 'max': 120, 'mean': 85, 'std': 15},
            'resp_rate': {'min': 8, 'max': 40, 'mean': 18, 'std': 5},
            'spo2': {'min': 70, 'max': 100, 'mean': 97, 'std': 3},
            'sys_bp': {'min': 70, 'max': 200, 'mean': 125, 'std': 20},
            'temperature': {'min': 95, 'max': 105, 'mean': 98.6, 'std': 2}
        }
        
        # Load sample training data
        self.training_data = self.load_sample_data()
    
    def process_patient_data(self, patient_data: Dict) -> np.ndarray:
        """Convert patient dictionary to normalized state vector"""
        features = []
        
        # Process each feature
        for feature_name in ['age', 'diastolic_bp', 'heart_rate', 'mean_bp', 
                           'resp_rate', 'spo2', 'sys_bp', 'temperature']:
            value = patient_data.get(feature_name, self.feature_stats[feature_name]['mean'])
            normalized = self.normalize_feature(feature_name, value)
            features.append(normalized)
        
        # Gender encoding
        gender = patient_data.get('gender', 'M')
        features.append(1.0 if gender == 'F' else 0.0)
        
        # Admission type encoding
        admission_type = patient_data.get('admission_type', 'EMERGENCY')
        features.append(1.0 if admission_type == 'EMERGENCY' else 0.0)
        
        # Hospital capacity features
        icu_capacity = patient_data.get('icu_capacity', 20)
        icu_occupied = patient_data.get('icu_occupied', 15)
        icu_utilization = min(icu_occupied / icu_capacity, 1.0)
        features.append(icu_utilization)
        
        # Ward utilization (estimated)
        ward_utilization = 0.75  # Default assumption
        features.append(ward_utilization)
        
        return np.array(features, dtype=np.float32)
    
    def normalize_feature(self, feature_name: str, value: float) -> float:
        """Normalize feature using z-score normalization"""
        stats = self.feature_stats[feature_name]
        normalized = (value - stats['mean']) / (stats['std'] * 2)  # Scale to roughly [-1, 1]
        return np.clip(normalized, -2, 2)  # Clip extreme values
    
    def calculate_risk_score(self, patient_data: Dict) -> float:
        """Calculate comprehensive risk score (0-10)"""
        risk = 0
        
        # Age factor
        age = patient_data.get('age', 50)
        if age > 80:
            risk += 2.5
        elif age > 65:
            risk += 1.5
        elif age > 50:
            risk += 0.5
        
        # Vital signs assessment
        vital_risks = self.assess_vital_risks(patient_data)
        risk += vital_risks
        
        # Emergency admission
        if patient_data.get('admission_type') == 'EMERGENCY':
            risk += 1.0
        
        # Gender factor (statistical adjustment)
        if patient_data.get('gender') == 'F' and age > 65:
            risk += 0.3
        
        return min(risk, 10.0)
    
    def assess_vital_risks(self, patient_data: Dict) -> float:
        """Assess risk from vital signs"""
        risk = 0
        
        # Heart rate
        hr = patient_data.get('heart_rate', 70)
        if hr > 120:
            risk += 2.0
        elif hr > 100:
            risk += 1.0
        elif hr < 50:
            risk += 1.5
        
        # Blood pressure
        sys_bp = patient_data.get('sys_bp', 120)
        dia_bp = patient_data.get('diastolic_bp', 80)
        
        if sys_bp > 180 or sys_bp < 90:
            risk += 2.0
        elif sys_bp > 140 or sys_bp < 100:
            risk += 1.0
        
        if dia_bp > 110 or dia_bp < 60:
            risk += 1.5
        
        # Oxygen saturation
        spo2 = patient_data.get('spo2', 98)
        if spo2 < 88:
            risk += 3.0
        elif spo2 < 92:
            risk += 2.0
        elif spo2 < 95:
            risk += 1.0
        
        # Respiratory rate
        resp_rate = patient_data.get('resp_rate', 16)
        if resp_rate > 30 or resp_rate < 8:
            risk += 2.0
        elif resp_rate > 24 or resp_rate < 12:
            risk += 1.0
        
        # Temperature
        temp = patient_data.get('temperature', 98.6)
        if temp > 103 or temp < 95:
            risk += 2.0
        elif temp > 101 or temp < 96:
            risk += 1.0
        
        return risk
    
    def load_training_data(self) -> List[Dict]:
        """Load training data with outcomes"""
        # In a real implementation, this would load from a database or file
        return self.training_data
    
    def load_sample_data(self) -> List[Dict]:
        """Generate sample training data"""
        sample_data = []
        
        # Generate diverse patient scenarios
        for i in range(100):
            # Random patient with correlated vitals
            age = np.random.randint(18, 95)
            is_emergency = np.random.choice([True, False], p=[0.7, 0.3])
            
            # Generate correlated vitals
            if np.random.random() < 0.3:  # 30% high-risk patients
                hr = np.random.normal(110, 20)
                sys_bp = np.random.normal(160, 30)
                spo2 = np.random.normal(92, 5)
                resp_rate = np.random.normal(25, 8)
                outcome = np.random.choice(['icu', 'ward'], p=[0.7, 0.3])
            else:  # Normal patients
                hr = np.random.normal(75, 15)
                sys_bp = np.random.normal(125, 20)
                spo2 = np.random.normal(97, 2)
                resp_rate = np.random.normal(16, 4)
                outcome = np.random.choice(['discharge', 'ward'], p=[0.6, 0.4])
            
            patient = {
                'patient_id': f'train_{i:04d}',
                'age': max(18, min(100, age)),
                'gender': np.random.choice(['M', 'F']),
                'heart_rate': max(40, min(150, hr)),
                'sys_bp': max(70, min(200, sys_bp)),
                'diastolic_bp': max(40, min(120, sys_bp * 0.6 + np.random.normal(0, 5))),
                'mean_bp': max(50, min(120, sys_bp * 0.8 + np.random.normal(0, 5))),
                'spo2': max(70, min(100, spo2)),
                'resp_rate': max(8, min(40, resp_rate)),
                'temperature': np.random.normal(98.6, 1.5),
                'admission_type': 'EMERGENCY' if is_emergency else 'ELECTIVE',
                'actual_outcome': outcome,
                'high_risk': spo2 < 95 or hr > 110 or sys_bp > 160
            }
            
            sample_data.append(patient)
        
        logger.info(f"Generated {len(sample_data)} training samples")
        return sample_data
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Return feature importance scores"""
        return {
            'age': 0.15,
            'spo2': 0.20,
            'heart_rate': 0.18,
            'sys_bp': 0.15,
            'resp_rate': 0.12,
            'temperature': 0.08,
            'admission_type': 0.07,
            'gender': 0.05
        }
    
    def validate_patient_data(self, patient_data: Dict) -> Dict[str, Any]:
        """Validate and clean patient data"""
        cleaned_data = patient_data.copy()
        issues = []
        
        # Check required fields
        required_fields = ['age', 'heart_rate', 'sys_bp', 'spo2']
        for field in required_fields:
            if field not in cleaned_data or cleaned_data[field] is None:
                issues.append(f"Missing required field: {field}")
                # Set default value
                if field in self.feature_stats:
                    cleaned_data[field] = self.feature_stats[field]['mean']
        
        # Validate ranges
        for field, stats in self.feature_stats.items():
            if field in cleaned_data:
                value = cleaned_data[field]
                if value < stats['min'] or value > stats['max']:
                    issues.append(f"{field} out of range: {value}")
                    # Clip to valid range
                    cleaned_data[field] = np.clip(value, stats['min'], stats['max'])
        
        return {
            'data': cleaned_data,
            'issues': issues,
            'is_valid': len(issues) == 0
        }
