
import gym
import numpy as np
from gym import spaces
import random
import logging

logger = logging.getLogger(__name__)

class ICUEnvironment(gym.Env):
    """
    ICU Environment for PPO training
    
    State: Patient features (10-dim: vitals + demographics)
    Actions: 0=Discharge, 1=Ward, 2=ICU, 3=Specialist
    Reward: Based on matching optimal decision vs actual outcome
    """
    
    def __init__(self, patient_data=None):
        super(ICUEnvironment, self).__init__()
        
        # Define action and observation space
        self.action_space = spaces.Discrete(4)  # 4 possible actions
        self.observation_space = spaces.Box(
            low=-3.0, high=3.0, shape=(10,), dtype=np.float32
        )
        
        # Store patient data for sampling
        self.patient_data = patient_data
        self.current_patient = None
        self.episode_count = 0
        self.total_reward = 0
        
        # ICU simulation parameters
        self.icu_capacity = 20
        self.current_icu_occupancy = 15
        self.episode_length = 1  # Single decision per episode
        self.step_count = 0
        
    def reset(self):
        """Reset environment and return initial observation"""
        self.step_count = 0
        self.episode_count += 1
        
        # Sample a random patient
        if self.patient_data is not None and len(self.patient_data['features']) > 0:
            idx = random.randint(0, len(self.patient_data['features']) - 1)
            self.current_patient = {
                'features': self.patient_data['features'][idx],
                'target': self.patient_data['targets'][idx],
                'index': idx
            }
            observation = self.current_patient['features'].astype(np.float32)
        else:
            # Generate synthetic patient if no data available
            observation = self._generate_synthetic_patient()
            self.current_patient = {
                'features': observation,
                'target': [0, 0],  # No death
                'index': -1
            }
            
        return observation
    
    def step(self, action):
        """Execute action and return next state, reward, done, info"""
        self.step_count += 1
        
        # Calculate reward based on action appropriateness
        reward = self._calculate_reward(action)
        self.total_reward += reward
        
        # Episode is done after one decision
        done = True
        
        # Generate next observation (could be same patient or new one)
        if done:
            next_obs = self.reset()
        else:
            next_obs = self.current_patient['features'].astype(np.float32)
        
        info = {
            'episode': self.episode_count,
            'total_reward': self.total_reward,
            'patient_index': self.current_patient['index'],
            'action_taken': action,
            'icu_occupancy': self.current_icu_occupancy / self.icu_capacity
        }
        
        return next_obs, reward, done, info
    
    def _calculate_reward(self, action):
        """Calculate reward based on action and patient outcome"""
        if self.current_patient is None:
            return 0.0
        
        # Extract patient info
        features = self.current_patient['features']
        hospital_death, icu_death = self.current_patient['target']
        
        # Base reward calculation
        reward = 0.0
        
        # Reward for appropriate ICU admission (action 2)
        if action == 2:  # ICU admission
            if icu_death == 1:  # Patient died in ICU (high risk)
                reward += 15.0  # Good decision to admit
            elif hospital_death == 1:  # Patient died in hospital
                reward += 10.0  # Reasonable decision
            else:
                reward += 5.0   # Safe decision, but maybe unnecessary
                
        # Reward for appropriate discharge (action 0)
        elif action == 0:  # Discharge
            if hospital_death == 0 and icu_death == 0:
                reward += 10.0  # Good decision - patient was stable
            else:
                reward -= 20.0  # Bad decision - patient needed care
                
        # Ward admission (action 1)
        elif action == 1:  # Ward admission
            if hospital_death == 0:
                reward += 8.0   # Good intermediate decision
            elif icu_death == 1:
                reward -= 10.0  # Should have gone to ICU
            else:
                reward += 3.0   # Reasonable decision
                
        # Specialist referral (action 3)
        elif action == 3:  # Specialist referral
            reward += 5.0  # Generally safe decision
        
        # Penalty for ICU overcrowding
        if action == 2 and self.current_icu_occupancy >= self.icu_capacity:
            reward -= 5.0
        
        # Risk-based adjustment
        risk_score = self._calculate_patient_risk(features)
        if action == 2 and risk_score > 0.7:  # High risk to ICU
            reward += 5.0
        elif action == 0 and risk_score < 0.3:  # Low risk discharge
            reward += 5.0
            
        return float(reward)
    
    def _calculate_patient_risk(self, features):
        """Calculate patient risk score from normalized features"""
        # Simple risk calculation from normalized features
        # Features: [vitals (8) + demographics (2)]
        
        # Age risk (feature index 7, normalized)
        age_risk = max(0, features[7])  # Higher age = higher risk
        
        # Vital signs risk (average of concerning vitals)
        hr_risk = abs(features[1])      # Heart rate deviation
        bp_risk = abs(features[0])      # Blood pressure deviation
        spo2_risk = -features[4]        # Lower SpO2 = higher risk
        
        vital_risk = (hr_risk + bp_risk + max(0, spo2_risk)) / 3
        
        # Combine risks
        total_risk = (age_risk * 0.3 + vital_risk * 0.7)
        return min(max(total_risk, 0), 1)  # Clamp to [0,1]
    
    def _generate_synthetic_patient(self):
        """Generate synthetic patient for testing"""
        # Generate normalized features
        features = np.random.normal(0, 1, 10).astype(np.float32)
        
        # Add some correlations to make it more realistic
        if features[1] > 1.5:  # High heart rate
            features[0] = max(features[0], 0.5)  # Likely high BP too
            features[4] = min(features[4], -0.5)  # Likely low SpO2
            
        return features
    
    def render(self, mode='human'):
        """Render environment state"""
        if mode == 'human':
            print(f"Episode: {self.episode_count}")
            print(f"ICU Occupancy: {self.current_icu_occupancy}/{self.icu_capacity}")
            if self.current_patient:
                print(f"Patient Risk: {self._calculate_patient_risk(self.current_patient['features']):.2f}")
                print(f"Target: {self.current_patient['target']}")
