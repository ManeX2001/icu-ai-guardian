
#!/usr/bin/env python3
"""
Setup script for ICU PPO Backend
Run this to initialize the backend with sample data
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path

def create_sample_data():
    """Create sample patient data for testing"""
    
    # Create sample CSV data based on the provided format
    sample_data = [
        ['201204', 54.25, 72.94, 73.37, 18.56, 98.09, 136.30, 96.51, 80.56, 'F', 'EMERGENCY', 'FALSE', 'FALSE'],
        ['204132', 90.09, 111.93, 101.28, 20.43, 96.57, 139.42, 98.47, 41.06, 'M', 'EMERGENCY', 'TRUE', 'TRUE'],
        ['205170', 64.65, 76.96, 74.15, 14.53, 98.52, 105.88, 97.63, 62.46, 'M', 'EMERGENCY', 'FALSE', 'FALSE'],
        ['209797', 62.16, 71.20, 72.68, 12.80, 98.70, 106.86, 97.39, 65.30, 'M', 'EMERGENCY', 'FALSE', 'FALSE'],
        ['210164', 69.85, 91.67, 80.63, 15.77, 99.90, 116.89, 98.06, 43.85, 'M', 'EMERGENCY', 'FALSE', 'FALSE'],
    ]
    
    # Add more realistic sample data
    np.random.seed(42)
    for i in range(95):  # Total 100 patients
        patient_id = f"30{i:04d}"
        
        # Generate realistic vital signs
        age = np.random.normal(65, 15)
        age = max(18, min(95, age))
        
        # Correlate vitals with age and severity
        severity = np.random.random()
        
        heart_rate = np.random.normal(80, 15) + severity * 20
        sys_bp = np.random.normal(120, 20) + (age - 50) * 0.5
        dias_bp = np.random.normal(70, 10) + (age - 50) * 0.3
        mean_bp = (sys_bp + 2 * dias_bp) / 3
        
        resp_rate = np.random.normal(16, 4) + severity * 8
        spo2 = np.random.normal(98, 2) - severity * 5
        temp = np.random.normal(98.6, 1.5)
        
        gender = np.random.choice(['M', 'F'])
        admission = np.random.choice(['EMERGENCY', 'ELECTIVE'], p=[0.8, 0.2])
        
        # Determine outcomes based on risk factors
        risk_score = (severity + (age - 50) / 50 + max(0, heart_rate - 100) / 50) / 3
        
        hospital_death = 'TRUE' if risk_score > 0.7 and np.random.random() < 0.3 else 'FALSE'
        icu_death = 'TRUE' if hospital_death == 'TRUE' and np.random.random() < 0.6 else 'FALSE'
        
        sample_data.append([
            patient_id, dias_bp, heart_rate, mean_bp, resp_rate, spo2, 
            sys_bp, temp, age, gender, admission, hospital_death, icu_death
        ])
    
    # Create DataFrame
    columns = [
        'icustay_id', 'DiastolicBP', 'HeartRate', 'MeanBP', 'RespRate', 
        'SpO2', 'SysBP', 'Temperature', 'age', 'gender', 'admission_type', 
        'in_hospital_death', 'in_icu_death'
    ]
    
    df = pd.DataFrame(sample_data, columns=columns)
    
    # Create data directory and save
    data_dir = Path('backend/data')
    data_dir.mkdir(exist_ok=True)
    
    csv_path = data_dir / 'patient_data.csv'
    df.to_csv(csv_path, index=False)
    
    print(f"Created sample data: {csv_path}")
    print(f"Total patients: {len(df)}")
    print(f"Deaths in hospital: {len(df[df['in_hospital_death'] == 'TRUE'])}")
    print(f"Deaths in ICU: {len(df[df['in_icu_death'] == 'TRUE'])}")
    
    return csv_path

def create_directories():
    """Create necessary directories"""
    dirs = [
        'backend/models/saved',
        'backend/logs',
        'backend/data'
    ]
    
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {dir_path}")

def main():
    print("Setting up ICU PPO Backend...")
    
    # Create directories
    create_directories()
    
    # Create sample data
    csv_path = create_sample_data()
    
    print("\nSetup complete!")
    print(f"Sample data available at: {csv_path}")
    print("\nNext steps:")
    print("1. Install dependencies: pip install -r backend/requirements.txt")
    print("2. Train the model: python backend/train_ppo.py")
    print("3. Start the API: python backend/main.py")

if __name__ == "__main__":
    main()
</lov-write>
