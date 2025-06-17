
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import logging

logger = logging.getLogger(__name__)

class PatientDataProcessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.gender_encoder = LabelEncoder()
        self.admission_encoder = LabelEncoder()
        self.feature_columns = [
            'DiastolicBP', 'HeartRate', 'MeanBP', 'RespRate', 'SpO2', 
            'SysBP', 'Temperature', 'age'
        ]
        self.is_fitted = False
        
    def load_and_preprocess(self, csv_path: str):
        """Load CSV data and preprocess features"""
        try:
            # Load the data
            df = pd.read_csv(csv_path)
            logger.info(f"Loaded {len(df)} patient records")
            
            # Handle missing values
            df = df.fillna(df.median(numeric_only=True))
            
            # Encode categorical variables
            df['gender_encoded'] = self.gender_encoder.fit_transform(df['gender'])
            df['admission_encoded'] = self.admission_encoder.fit_transform(df['admission_type'])
            
            # Convert boolean death indicators to int
            df['in_hospital_death'] = df['in_hospital_death'].map({'TRUE': 1, 'FALSE': 0})
            df['in_icu_death'] = df['in_icu_death'].map({'TRUE': 1, 'FALSE': 0})
            
            # Prepare features for scaling
            feature_data = df[self.feature_columns].copy()
            feature_data['gender_encoded'] = df['gender_encoded']
            feature_data['admission_encoded'] = df['admission_encoded']
            
            # Fit and transform features
            scaled_features = self.scaler.fit_transform(feature_data)
            self.is_fitted = True
            
            # Create final dataset
            processed_data = {
                'features': scaled_features,
                'targets': df[['in_hospital_death', 'in_icu_death']].values,
                'raw_data': df
            }
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Error processing data: {e}")
            raise
    
    def process_single_patient(self, patient_dict):
        """Process a single patient record for prediction"""
        if not self.is_fitted:
            raise ValueError("Processor not fitted. Call load_and_preprocess first.")
        
        # Extract features in the correct order
        features = []
        for col in self.feature_columns:
            # Map API field names to CSV column names
            if col == 'DiastolicBP':
                features.append(patient_dict.get('diastolic_bp', 70))
            elif col == 'HeartRate':
                features.append(patient_dict.get('heart_rate', 80))
            elif col == 'MeanBP':
                features.append(patient_dict.get('mean_bp', 90))
            elif col == 'RespRate':
                features.append(patient_dict.get('resp_rate', 16))
            elif col == 'SpO2':
                features.append(patient_dict.get('spo2', 98))
            elif col == 'SysBP':
                features.append(patient_dict.get('sys_bp', 120))
            elif col == 'Temperature':
                features.append(patient_dict.get('temperature', 98.6))
            elif col == 'age':
                features.append(patient_dict.get('age', 50))
        
        # Encode gender and admission type
        gender = patient_dict.get('gender', 'M')
        admission = patient_dict.get('admission_type', 'EMERGENCY')
        
        try:
            gender_encoded = self.gender_encoder.transform([gender])[0]
        except ValueError:
            gender_encoded = 0  # Default for unknown gender
            
        try:
            admission_encoded = self.admission_encoder.transform([admission])[0]
        except ValueError:
            admission_encoded = 0  # Default for unknown admission type
        
        features.extend([gender_encoded, admission_encoded])
        
        # Scale features
        features_array = np.array(features).reshape(1, -1)
        scaled_features = self.scaler.transform(features_array)
        
        return scaled_features[0]
    
    def calculate_risk_score(self, patient_dict):
        """Calculate a simple risk score (0-10)"""
        score = 0
        
        # Age factor (0-3 points)
        age = patient_dict.get('age', 50)
        if age > 80:
            score += 3
        elif age > 65:
            score += 2
        elif age > 50:
            score += 1
            
        # Vital signs (0-4 points)
        hr = patient_dict.get('heart_rate', 80)
        if hr > 120 or hr < 50:
            score += 2
        elif hr > 100 or hr < 60:
            score += 1
            
        bp_sys = patient_dict.get('sys_bp', 120)
        if bp_sys > 180 or bp_sys < 90:
            score += 2
        elif bp_sys > 140 or bp_sys < 100:
            score += 1
            
        # Oxygen saturation (0-3 points)
        spo2 = patient_dict.get('spo2', 98)
        if spo2 < 90:
            score += 3
        elif spo2 < 95:
            score += 2
        elif spo2 < 98:
            score += 1
            
        return min(score, 10)  # Cap at 10
</lov-write>

