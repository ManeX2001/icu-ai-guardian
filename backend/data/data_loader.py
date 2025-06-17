
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from typing import Tuple, Dict, Any
import io

class ICUDataLoader:
    """Loads and preprocesses ICU patient data"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.gender_encoder = LabelEncoder()
        self.admission_encoder = LabelEncoder()
        self.feature_columns = [
            'DiastolicBP', 'HeartRate', 'MeanBP', 'RespRate', 'SpO2', 
            'SysBP', 'Temperature', 'age'
        ]
        
        # Sample data embedded for testing
        self.sample_data = """icustay_id,DiastolicBP,HeartRate,MeanBP,RespRate,SpO2,SysBP,Temperature,age,gender,admission_type,in_hospital_death,in_icu_death
201204,54.259,72.944,73.370,18.556,98.093,136.296,96.509,80.561,F,EMERGENCY,FALSE,FALSE
204132,90.094,111.934,101.278,20.434,96.567,139.415,98.474,41.056,M,EMERGENCY,TRUE,TRUE
205170,64.654,76.960,74.154,14.527,98.521,105.885,97.633,62.463,M,EMERGENCY,FALSE,FALSE
209797,62.157,71.200,72.681,12.803,98.704,106.857,97.394,65.303,M,EMERGENCY,FALSE,FALSE
210164,69.852,91.667,80.630,15.767,99.900,116.889,98.057,43.853,M,EMERGENCY,FALSE,FALSE
210474,72.804,80.703,95.280,26.932,93.730,159.863,98.536,80.961,M,EMERGENCY,TRUE,FALSE
210989,55.500,109.449,72.618,21.804,96.657,130.706,99.750,40.606,M,EMERGENCY,FALSE,FALSE
213315,70.539,68.244,82.408,12.538,98.909,120.421,97.626,65.168,M,EMERGENCY,FALSE,FALSE
214180,63.302,105.091,73.047,18.889,95.000,105.773,99.062,53.505,M,EMERGENCY,FALSE,FALSE
216185,61.284,79.607,75.976,20.761,95.997,124.679,98.330,48.947,M,EMERGENCY,FALSE,FALSE
217992,58.359,95.797,70.421,24.632,96.776,111.346,99.463,58.147,F,EMERGENCY,FALSE,FALSE
219013,68.517,77.207,80.862,21.828,93.643,121.034,97.371,80.836,F,EMERGENCY,FALSE,FALSE
220671,57.000,67.846,72.588,23.921,94.553,125.471,98.422,88.736,F,EMERGENCY,TRUE,TRUE
221684,56.398,92.193,68.137,20.990,96.718,103.375,97.634,68.604,F,EMERGENCY,TRUE,TRUE
223285,66.571,105.545,78.476,33.727,97.571,119.667,97.275,88.034,F,EMERGENCY,FALSE,FALSE
224458,44.838,92.460,57.083,13.320,95.465,97.108,97.633,81.097,F,EMERGENCY,TRUE,TRUE
229194,66.111,82.444,77.125,19.611,95.333,116.889,98.925,76.887,M,EMERGENCY,FALSE,FALSE
231005,75.224,102.418,93.463,25.791,96.156,144.030,99.473,86.259,F,EMERGENCY,FALSE,FALSE
234424,53.545,79.000,69.409,23.000,96.522,118.136,96.900,76.938,M,EMERGENCY,FALSE,FALSE
234541,56.600,66.518,66.164,14.109,99.745,96.636,96.492,63.865,M,EMERGENCY,FALSE,FALSE"""
    
    def load_data_from_string(self, data_string: str = None) -> pd.DataFrame:
        """Load data from string or use sample data"""
        if data_string is None:
            data_string = self.sample_data
        return pd.read_csv(io.StringIO(data_string))
    
    def preprocess_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, Dict]:
        """
        Preprocess the dataframe and return features, targets, and metadata
        
        Returns:
            X: Feature matrix (normalized)
            y: Target vector (death indicator)
            metadata: Dictionary with scalers and other info
        """
        # Create target: combine in_hospital_death and in_icu_death
        df['death_outcome'] = (
            (df['in_hospital_death'] == 'TRUE') | 
            (df['in_icu_death'] == 'TRUE')
        ).astype(int)
        
        # Encode categorical variables
        df['gender_encoded'] = self.gender_encoder.fit_transform(df['gender'])
        df['admission_encoded'] = self.admission_encoder.fit_transform(df['admission_type'])
        
        # Prepare features
        feature_cols = self.feature_columns + ['gender_encoded', 'admission_encoded']
        X = df[feature_cols].values.astype(np.float32)
        
        # Normalize features
        X = self.scaler.fit_transform(X)
        
        # Target
        y = df['death_outcome'].values
        
        metadata = {
            'scaler': self.scaler,
            'gender_encoder': self.gender_encoder,
            'admission_encoder': self.admission_encoder,
            'feature_columns': feature_cols,
            'n_features': X.shape[1],
            'n_samples': X.shape[0]
        }
        
        return X, y, metadata
    
    def split_data(self, X: np.ndarray, y: np.ndarray, test_size: float = 0.2, random_state: int = 42):
        """Split data into train and test sets"""
        return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)
    
    def transform_patient(self, patient_dict: Dict[str, Any]) -> np.ndarray:
        """Transform a single patient record to model input format"""
        # Convert patient dict to the right format
        features = []
        
        # Add numerical features
        for col in self.feature_columns:
            features.append(float(patient_dict.get(col, 0)))
        
        # Add encoded categorical features
        gender_val = patient_dict.get('gender', 'M')
        admission_val = patient_dict.get('admission_type', 'EMERGENCY')
        
        # Transform using fitted encoders
        try:
            gender_encoded = self.gender_encoder.transform([gender_val])[0]
        except ValueError:
            gender_encoded = 0  # Default for unknown gender
        
        try:
            admission_encoded = self.admission_encoder.transform([admission_val])[0]
        except ValueError:
            admission_encoded = 0  # Default for unknown admission type
        
        features.extend([gender_encoded, admission_encoded])
        
        # Normalize using fitted scaler
        X = np.array(features).reshape(1, -1).astype(np.float32)
        X_scaled = self.scaler.transform(X)
        
        return X_scaled[0]
