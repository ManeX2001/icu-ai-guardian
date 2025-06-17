
import gymnasium as gym
import numpy as np
from typing import Dict, Tuple, Any
from gymnasium import spaces

class ICUEnvironment(gym.Env):
    """
    ICU Decision Making Environment for PPO Training
    
    State Space: Patient vitals + hospital status
    Action Space: 4 discrete actions (Discharge, Ward, ICU, Specialist)
    Reward: Based on patient outcomes and resource efficiency
    """
    
    def __init__(self):
        super(ICUEnvironment, self).__init__()
        
        # Define action space (4 possible actions)
        # 0: Discharge, 1: Ward Admission, 2: ICU Admission, 3: Specialist Referral
        self.action_space = spaces.Discrete(4)
        
        # Define observation space (normalized patient features + hospital state)
        # Features: age, vitals (7), gender, admission_type, icu_capacity, icu_occupied
        self.observation_space = spaces.Box(
            low=0.0, 
            high=1.0, 
            shape=(12,), 
            dtype=np.float32
        )
        
        # Hospital state
        self.hospital_state = {
            'icu_capacity': 20,
            'icu_occupied': 15,
            'ward_capacity': 50,
            'ward_occupied': 38,
            'ed_capacity': 25,
            'ed_occupied': 12
        }
        
        # Current patient data
        self.current_patient = None
        
        # Episode tracking
        self.episode_step = 0
        self.max_episode_steps = 1
        
    def reset(self, patient_data: Dict = None) -> np.ndarray:
        """Reset environment with new patient data"""
        if patient_data is not None:
            self.current_patient = patient_data
        else:
            # Generate random patient for testing
            self.current_patient = self.generate_random_patient()
        
        self.episode_step = 0
        
        # Update hospital state (simulate dynamic occupancy)
        self.update_hospital_state()
        
        # Return normalized state
        return self.get_state()
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        """Execute action and return results"""
        if self.current_patient is None:
            raise ValueError("Environment not reset with patient data")
        
        # Calculate reward
        reward = self.calculate_reward(action)
        
        # Update hospital state based on action
        self.update_hospital_after_action(action)
        
        # Episode is done after one decision
        done = True
        terminated = True
        truncated = False
        
        self.episode_step += 1
        
        # Return step results
        next_state = self.get_state()
        info = {
            'patient_id': self.current_patient.get('patient_id', 'unknown'),
            'action_taken': action,
            'reward': reward,
            'hospital_state': self.hospital_state.copy()
        }
        
        return next_state, reward, terminated, truncated, info
    
    def get_state(self) -> np.ndarray:
        """Convert patient data and hospital state to normalized state vector"""
        if self.current_patient is None:
            return np.zeros(self.observation_space.shape[0], dtype=np.float32)
        
        # Normalize patient features
        state = []
        
        # Age (normalize to 0-1, assuming max age 100)
        state.append(min(self.current_patient.get('age', 50) / 100.0, 1.0))
        
        # Vital signs (normalize based on typical ranges)
        state.append(self.normalize_vital('diastolic_bp', self.current_patient.get('diastolic_bp', 80), 40, 120))
        state.append(self.normalize_vital('heart_rate', self.current_patient.get('heart_rate', 70), 40, 150))
        state.append(self.normalize_vital('mean_bp', self.current_patient.get('mean_bp', 80), 50, 120))
        state.append(self.normalize_vital('resp_rate', self.current_patient.get('resp_rate', 16), 8, 40))
        state.append(self.normalize_vital('spo2', self.current_patient.get('spo2', 98), 70, 100))
        state.append(self.normalize_vital('sys_bp', self.current_patient.get('sys_bp', 120), 70, 200))
        state.append(self.normalize_vital('temperature', self.current_patient.get('temperature', 98.6), 95, 105))
        
        # Gender (binary encoding)
        state.append(1.0 if self.current_patient.get('gender', 'M') == 'F' else 0.0)
        
        # Admission type (binary: emergency=1, elective=0)
        state.append(1.0 if self.current_patient.get('admission_type', 'EMERGENCY') == 'EMERGENCY' else 0.0)
        
        # Hospital capacity utilization
        icu_utilization = self.hospital_state['icu_occupied'] / self.hospital_state['icu_capacity']
        ward_utilization = self.hospital_state['ward_occupied'] / self.hospital_state['ward_capacity']
        
        state.append(min(icu_utilization, 1.0))
        state.append(min(ward_utilization, 1.0))
        
        return np.array(state, dtype=np.float32)
    
    def normalize_vital(self, vital_name: str, value: float, min_val: float, max_val: float) -> float:
        """Normalize vital sign to 0-1 range"""
        normalized = (value - min_val) / (max_val - min_val)
        return max(0.0, min(1.0, normalized))
    
    def calculate_reward(self, action: int) -> float:
        """Calculate reward based on action and patient characteristics"""
        base_reward = 0
        
        # Calculate patient risk score
        risk_score = self.calculate_patient_risk()
        
        # Reward logic based on action and risk
        if action == 0:  # Discharge
            if risk_score < 3:
                base_reward = 10  # Good decision for low-risk patient
            elif risk_score < 6:
                base_reward = -2  # Risky for moderate-risk patient
            else:
                base_reward = -10  # Dangerous for high-risk patient
                
        elif action == 1:  # Ward Admission
            if 2 < risk_score < 7:
                base_reward = 8   # Appropriate for moderate-risk patient
            elif risk_score <= 2:
                base_reward = -1  # Over-treatment for low-risk
            else:
                base_reward = -5  # Under-treatment for high-risk
                
        elif action == 2:  # ICU Admission
            if risk_score > 6:
                base_reward = 12  # Critical patient needs ICU
            elif risk_score > 4:
                base_reward = 5   # Reasonable for moderate-high risk
            else:
                base_reward = -3  # Resource waste for low-risk
                
        elif action == 3:  # Specialist Referral
            # Context-dependent reward
            if self.needs_specialist():
                base_reward = 8
            else:
                base_reward = -2
        
        # Hospital capacity considerations
        icu_utilization = self.hospital_state['icu_occupied'] / self.hospital_state['icu_capacity']
        
        if action == 2 and icu_utilization > 0.9:  # ICU admission when near capacity
            if risk_score > 7:
                base_reward += 2  # Justified for critical patient
            else:
                base_reward -= 5  # Penalize non-critical ICU admission when full
        
        # Emergency vs elective consideration
        if self.current_patient.get('admission_type') == 'EMERGENCY':
            if action in [1, 2]:  # Ward or ICU for emergency
                base_reward += 2
        
        return base_reward
    
    def calculate_patient_risk(self) -> float:
        """Calculate patient risk score (0-10 scale)"""
        risk = 0
        
        # Age factor
        age = self.current_patient.get('age', 50)
        if age > 80:
            risk += 3
        elif age > 65:
            risk += 2
        elif age > 50:
            risk += 1
        
        # Vital signs
        hr = self.current_patient.get('heart_rate', 70)
        if hr > 120 or hr < 50:
            risk += 2
        elif hr > 100:
            risk += 1
        
        bp_sys = self.current_patient.get('sys_bp', 120)
        if bp_sys > 180 or bp_sys < 90:
            risk += 2
        elif bp_sys > 140:
            risk += 1
        
        spo2 = self.current_patient.get('spo2', 98)
        if spo2 < 90:
            risk += 3
        elif spo2 < 95:
            risk += 2
        
        resp_rate = self.current_patient.get('resp_rate', 16)
        if resp_rate > 25 or resp_rate < 10:
            risk += 2
        elif resp_rate > 20:
            risk += 1
        
        temp = self.current_patient.get('temperature', 98.6)
        if temp > 102 or temp < 96:
            risk += 2
        elif temp > 100:
            risk += 1
        
        # Emergency admission adds risk
        if self.current_patient.get('admission_type') == 'EMERGENCY':
            risk += 1
        
        return min(risk, 10)
    
    def needs_specialist(self) -> bool:
        """Determine if patient needs specialist consultation"""
        # Simplified logic - in reality would be more complex
        age = self.current_patient.get('age', 50)
        risk = self.calculate_patient_risk()
        
        # Complex cases or specific conditions
        if age > 75 and risk > 5:
            return True
        if risk > 8:  # Very high risk cases
            return True
        
        return False
    
    def update_hospital_state(self):
        """Simulate dynamic hospital occupancy"""
        # Random fluctuations in occupancy
        self.hospital_state['icu_occupied'] += np.random.randint(-1, 2)
        self.hospital_state['ward_occupied'] += np.random.randint(-2, 3)
        self.hospital_state['ed_occupied'] += np.random.randint(-3, 4)
        
        # Ensure within bounds
        self.hospital_state['icu_occupied'] = max(0, min(
            self.hospital_state['icu_occupied'], 
            self.hospital_state['icu_capacity']
        ))
        self.hospital_state['ward_occupied'] = max(0, min(
            self.hospital_state['ward_occupied'], 
            self.hospital_state['ward_capacity']
        ))
        self.hospital_state['ed_occupied'] = max(0, min(
            self.hospital_state['ed_occupied'], 
            self.hospital_state['ed_capacity']
        ))
    
    def update_hospital_after_action(self, action: int):
        """Update hospital occupancy based on action taken"""
        if action == 1:  # Ward admission
            if self.hospital_state['ward_occupied'] < self.hospital_state['ward_capacity']:
                self.hospital_state['ward_occupied'] += 1
        elif action == 2:  # ICU admission
            if self.hospital_state['icu_occupied'] < self.hospital_state['icu_capacity']:
                self.hospital_state['icu_occupied'] += 1
    
    def generate_random_patient(self) -> Dict:
        """Generate random patient data for testing"""
        return {
            'patient_id': f'test_{np.random.randint(10000, 99999)}',
            'age': np.random.randint(18, 90),
            'gender': np.random.choice(['M', 'F']),
            'diastolic_bp': np.random.normal(80, 15),
            'heart_rate': np.random.normal(75, 20),
            'mean_bp': np.random.normal(85, 15),
            'resp_rate': np.random.normal(16, 5),
            'spo2': np.random.normal(97, 3),
            'sys_bp': np.random.normal(125, 20),
            'temperature': np.random.normal(98.6, 2),
            'admission_type': np.random.choice(['EMERGENCY', 'ELECTIVE'])
        }
    
    def render(self, mode='human'):
        """Render the environment (optional)"""
        if self.current_patient:
            print(f"Patient: Age {self.current_patient['age']}, "
                  f"Risk Score: {self.calculate_patient_risk():.1f}")
            print(f"Hospital: ICU {self.hospital_state['icu_occupied']}/{self.hospital_state['icu_capacity']}")
