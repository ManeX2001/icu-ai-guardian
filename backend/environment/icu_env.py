
import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Dict, Tuple, Any, Optional
import random

class ICUEnv(gym.Env):
    """
    ICU Decision Making Environment
    
    State: 10-dimensional patient features (normalized)
    Actions: 4 discrete actions
        0: Discharge
        1: Ward Admission  
        2: ICU Admission
        3: Specialist Referral
    """
    
    def __init__(self, data_loader, X_train: np.ndarray, y_train: np.ndarray):
        super(ICUEnv, self).__init__()
        
        self.data_loader = data_loader
        self.X_train = X_train
        self.y_train = y_train
        
        # Action space: 4 discrete actions
        self.action_space = spaces.Discrete(4)
        
        # Observation space: 10-dimensional continuous features
        self.observation_space = spaces.Box(
            low=-3.0, high=3.0, shape=(X_train.shape[1],), dtype=np.float32
        )
        
        # Current state
        self.current_state = None
        self.current_target = None
        self.episode_step = 0
        self.max_episode_steps = 1  # Single-step episodes
        
    def reset(self, seed: Optional[int] = None, options: Optional[Dict] = None) -> Tuple[np.ndarray, Dict]:
        """Reset environment and return initial state"""
        super().reset(seed=seed)
        
        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)
        
        # Sample random patient from training data
        idx = np.random.randint(0, len(self.X_train))
        self.current_state = self.X_train[idx].copy()
        self.current_target = self.y_train[idx]
        self.episode_step = 0
        
        return self.current_state, {}
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        """
        Execute action and return next state, reward, done, truncated, info
        """
        if self.current_state is None:
            raise ValueError("Environment not reset")
        
        # Calculate reward based on action and patient outcome
        reward = self._calculate_reward(action, self.current_target)
        
        # Episode ends after one step
        terminated = True
        truncated = False
        
        # Next state (sample new patient for next episode)
        next_idx = np.random.randint(0, len(self.X_train))
        next_state = self.X_train[next_idx].copy()
        
        info = {
            'patient_outcome': self.current_target,
            'action_taken': action,
            'reward': reward,
            'episode_step': self.episode_step
        }
        
        self.episode_step += 1
        
        return next_state, reward, terminated, truncated, info
    
    def _calculate_reward(self, action: int, patient_outcome: int) -> float:
        """
        Calculate reward based on action and patient outcome
        
        Args:
            action: 0=Discharge, 1=Ward, 2=ICU, 3=Specialist
            patient_outcome: 0=Survived, 1=Died
        
        Returns:
            reward: Float reward value
        """
        # Base reward structure
        if patient_outcome == 1:  # Patient died - high risk
            if action == 2:  # ICU admission for high-risk patient
                return 10.0  # Correct intensive care
            elif action == 1:  # Ward admission for high-risk patient  
                return 2.0   # Suboptimal but some care
            elif action == 3:  # Specialist referral
                return 5.0   # Good decision for complex case
            else:  # Discharge high-risk patient
                return -10.0 # Very bad decision
        
        else:  # Patient survived - lower risk
            if action == 0:  # Discharge low-risk patient
                return 8.0   # Efficient resource use
            elif action == 1:  # Ward admission for low-risk patient
                return 3.0   # Reasonable caution
            elif action == 2:  # ICU admission for low-risk patient
                return -3.0  # Resource waste
            else:  # Specialist referral for low-risk
                return 1.0   # Overcautious but not harmful
    
    def render(self, mode='human'):
        """Render the environment state"""
        if self.current_state is not None:
            print(f"Current patient state: {self.current_state}")
            print(f"Patient outcome: {self.current_target}")
            print(f"Episode step: {self.episode_step}")
    
    def close(self):
        """Clean up environment"""
        pass
