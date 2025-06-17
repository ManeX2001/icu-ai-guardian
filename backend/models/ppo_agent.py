
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import Tuple, Dict, List
import pickle
from .network import PolicyNetwork, ValueNetwork
import logging

logger = logging.getLogger(__name__)

class PPOAgent:
    def __init__(self, state_dim: int, action_dim: int, lr: float = 3e-4, gamma: float = 0.99, 
                 epsilon: float = 0.2, k_epochs: int = 4):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.lr = lr
        self.gamma = gamma
        self.epsilon = epsilon
        self.k_epochs = k_epochs
        
        # Networks
        self.policy_network = PolicyNetwork(state_dim, action_dim)
        self.value_network = ValueNetwork(state_dim)
        self.policy_optimizer = optim.Adam(self.policy_network.parameters(), lr=lr)
        self.value_optimizer = optim.Adam(self.value_network.parameters(), lr=lr)
        
        # Training metrics
        self.metrics = {
            'current_epoch': 0,
            'total_epochs': 1000,
            'accuracy': 0.85,
            'loss': 0.15,
            'reward_score': 0.0,
            'patients_processed': 0,
            'correct_decisions': 0,
            'is_training': False,
            'training_progress': 0.0
        }
        
        # Memory for experiences
        self.memory = {
            'states': [],
            'actions': [],
            'rewards': [],
            'log_probs': [],
            'values': [],
            'dones': []
        }
        
    def predict(self, state: np.ndarray) -> Tuple[int, np.ndarray, float]:
        """
        Make prediction for given state
        Returns: (action, action_probabilities, state_value)
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        
        with torch.no_grad():
            # Get action probabilities
            action_probs = self.policy_network(state_tensor)
            action_dist = torch.distributions.Categorical(action_probs)
            action = action_dist.sample()
            
            # Get state value
            state_value = self.value_network(state_tensor)
            
        return action.item(), action_probs.squeeze().numpy(), state_value.item()
    
    def store_experience(self, state: np.ndarray, action: int, reward: float, 
                        log_prob: float, value: float, done: bool):
        """Store experience in memory"""
        self.memory['states'].append(state)
        self.memory['actions'].append(action)
        self.memory['rewards'].append(reward)
        self.memory['log_probs'].append(log_prob)
        self.memory['values'].append(value)
        self.memory['dones'].append(done)
    
    def train_epoch(self, environment, training_data: List[Dict]) -> Dict:
        """Train the agent for one epoch"""
        self.metrics['is_training'] = True
        
        # Collect experiences
        total_reward = 0
        correct_decisions = 0
        
        for patient_data in training_data:
            # Process patient through environment
            state = environment.reset(patient_data)
            action, action_probs, value = self.predict(state)
            
            # Get actual outcome (ground truth)
            actual_outcome = patient_data.get('actual_outcome', 'unknown')
            reward = self.calculate_reward(action, actual_outcome, patient_data)
            
            # Store experience
            log_prob = torch.log(torch.FloatTensor(action_probs)[action])
            self.store_experience(state, action, reward, log_prob.item(), value, True)
            
            total_reward += reward
            if reward > 0:
                correct_decisions += 1
        
        # Update networks
        policy_loss, value_loss = self.update_networks()
        
        # Update metrics
        self.metrics['current_epoch'] += 1
        self.metrics['patients_processed'] += len(training_data)
        self.metrics['correct_decisions'] += correct_decisions
        self.metrics['accuracy'] = (self.metrics['correct_decisions'] / 
                                  max(self.metrics['patients_processed'], 1)) * 100
        self.metrics['reward_score'] += total_reward
        self.metrics['loss'] = (policy_loss + value_loss) / 2
        self.metrics['training_progress'] = (self.metrics['current_epoch'] / 
                                           self.metrics['total_epochs']) * 100
        self.metrics['is_training'] = False
        
        # Clear memory
        self.clear_memory()
        
        logger.info(f"Epoch {self.metrics['current_epoch']} completed. "
                   f"Reward: {total_reward:.2f}, Accuracy: {self.metrics['accuracy']:.1f}%")
        
        return {
            'epoch': self.metrics['current_epoch'],
            'total_reward': total_reward,
            'accuracy': self.metrics['accuracy'],
            'loss': self.metrics['loss']
        }
    
    def update_networks(self) -> Tuple[float, float]:
        """Update policy and value networks using PPO"""
        if not self.memory['states']:
            return 0.0, 0.0
        
        # Convert to tensors
        states = torch.FloatTensor(np.array(self.memory['states']))
        actions = torch.LongTensor(self.memory['actions'])
        old_log_probs = torch.FloatTensor(self.memory['log_probs'])
        rewards = torch.FloatTensor(self.memory['rewards'])
        old_values = torch.FloatTensor(self.memory['values'])
        
        # Calculate advantages and returns
        advantages = rewards - old_values
        returns = rewards  # Simplified for episodic tasks
        
        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        total_policy_loss = 0
        total_value_loss = 0
        
        # PPO update
        for _ in range(self.k_epochs):
            # Get current policy predictions
            action_probs = self.policy_network(states)
            dist = torch.distributions.Categorical(action_probs)
            new_log_probs = dist.log_prob(actions)
            
            # Calculate ratio
            ratio = torch.exp(new_log_probs - old_log_probs)
            
            # Calculate surrogate loss
            surr1 = ratio * advantages
            surr2 = torch.clamp(ratio, 1 - self.epsilon, 1 + self.epsilon) * advantages
            policy_loss = -torch.min(surr1, surr2).mean()
            
            # Update policy network
            self.policy_optimizer.zero_grad()
            policy_loss.backward()
            self.policy_optimizer.step()
            
            # Update value network
            current_values = self.value_network(states).squeeze()
            value_loss = nn.MSELoss()(current_values, returns)
            
            self.value_optimizer.zero_grad()
            value_loss.backward()
            self.value_optimizer.step()
            
            total_policy_loss += policy_loss.item()
            total_value_loss += value_loss.item()
        
        return total_policy_loss / self.k_epochs, total_value_loss / self.k_epochs
    
    def calculate_reward(self, action: int, actual_outcome: str, patient_data: Dict) -> float:
        """Calculate reward based on action and actual outcome"""
        base_reward = 0
        
        # Map outcomes to expected actions
        outcome_action_map = {
            'discharge': 0,
            'ward': 1,
            'icu': 2,
            'specialist': 3,
            'died': 2,  # Should have been ICU
            'recovered': 1  # Ward was appropriate
        }
        
        expected_action = outcome_action_map.get(actual_outcome.lower(), -1)
        
        if expected_action == action:
            base_reward = 10  # Correct decision
        elif abs(expected_action - action) == 1:
            base_reward = 5   # Close decision
        else:
            base_reward = -5  # Wrong decision
        
        # Bonus for high-risk patients correctly sent to ICU
        if action == 2 and patient_data.get('high_risk', False):
            base_reward += 5
        
        # Penalty for unnecessary ICU admission
        if action == 2 and actual_outcome.lower() in ['discharge', 'recovered']:
            base_reward -= 3
        
        return base_reward
    
    def update_with_feedback(self, patient_id: str, decision: str, 
                           actual_outcome: str, reward: float):
        """Update model with feedback from real outcomes"""
        # Store feedback for future training
        feedback = {
            'patient_id': patient_id,
            'decision': decision,
            'actual_outcome': actual_outcome,
            'reward': reward,
            'timestamp': np.datetime64('now')
        }
        
        # Update reward score
        self.metrics['reward_score'] += reward
        
        logger.info(f"Feedback recorded: {decision} -> {actual_outcome} (reward: {reward})")
    
    def get_metrics(self) -> Dict:
        """Get current training metrics"""
        return self.metrics.copy()
    
    def clear_memory(self):
        """Clear experience memory"""
        for key in self.memory:
            self.memory[key] = []
    
    def save_model(self, filepath: str):
        """Save the trained model"""
        model_data = {
            'policy_state_dict': self.policy_network.state_dict(),
            'value_state_dict': self.value_network.state_dict(),
            'metrics': self.metrics
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load a trained model"""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.policy_network.load_state_dict(model_data['policy_state_dict'])
        self.value_network.load_state_dict(model_data['value_state_dict'])
        self.metrics = model_data['metrics']
        
        logger.info(f"Model loaded from {filepath}")
