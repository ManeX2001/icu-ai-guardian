
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import numpy as np
from typing import List, Tuple, Dict
import os

class PolicyNetwork(nn.Module):
    """Policy network for action selection"""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super(PolicyNetwork, self).__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, action_dim)
        self.dropout = nn.Dropout(0.1)
        
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        action_logits = self.fc3(x)
        return F.softmax(action_logits, dim=-1)

class ValueNetwork(nn.Module):
    """Value network for state value estimation"""
    
    def __init__(self, state_dim: int, hidden_dim: int = 128):
        super(ValueNetwork, self).__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, 1)
        self.dropout = nn.Dropout(0.1)
        
    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        return self.fc3(x)

class PPOAgent:
    """PPO Agent for ICU decision making"""
    
    def __init__(self, state_dim: int, action_dim: int, lr: float = 3e-4, 
                 gamma: float = 0.99, eps_clip: float = 0.2, k_epochs: int = 4):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.lr = lr
        self.gamma = gamma
        self.eps_clip = eps_clip
        self.k_epochs = k_epochs
        
        # Networks
        self.policy = PolicyNetwork(state_dim, action_dim)
        self.value = ValueNetwork(state_dim)
        
        # Optimizers
        self.policy_optimizer = optim.Adam(self.policy.parameters(), lr=lr)
        self.value_optimizer = optim.Adam(self.value.parameters(), lr=lr)
        
        # Memory
        self.memory = {
            'states': [],
            'actions': [],
            'rewards': [],
            'log_probs': [],
            'values': [],
            'dones': []
        }
        
        # Metrics
        self.training_metrics = {
            'episode_rewards': [],
            'policy_losses': [],
            'value_losses': [],
            'total_episodes': 0
        }
    
    def select_action(self, state: np.ndarray) -> Tuple[int, float, float]:
        """
        Select action using current policy
        
        Returns:
            action: Selected action
            log_prob: Log probability of action
            value: State value estimate
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        
        with torch.no_grad():
            action_probs = self.policy(state_tensor)
            state_value = self.value(state_tensor)
        
        # Sample action from probability distribution
        dist = torch.distributions.Categorical(action_probs)
        action = dist.sample()
        log_prob = dist.log_prob(action)
        
        return action.item(), log_prob.item(), state_value.item()
    
    def predict(self, state: np.ndarray) -> Tuple[int, np.ndarray, float]:
        """
        Make prediction (for inference)
        
        Returns:
            action: Best action
            action_probs: All action probabilities
            value: State value
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        
        with torch.no_grad():
            action_probs = self.policy(state_tensor)
            state_value = self.value(state_tensor)
        
        action = torch.argmax(action_probs, dim=1).item()
        
        return action, action_probs.squeeze().numpy(), state_value.item()
    
    def store_transition(self, state, action, reward, log_prob, value, done):
        """Store transition in memory"""
        self.memory['states'].append(state)
        self.memory['actions'].append(action)
        self.memory['rewards'].append(reward)
        self.memory['log_probs'].append(log_prob)
        self.memory['values'].append(value)
        self.memory['dones'].append(done)
    
    def compute_gae(self, rewards: List[float], values: List[float], 
                    dones: List[bool], next_value: float = 0.0, 
                    gae_lambda: float = 0.95) -> Tuple[List[float], List[float]]:
        """Compute Generalized Advantage Estimation"""
        advantages = []
        returns = []
        gae = 0
        
        values = values + [next_value]
        
        for i in reversed(range(len(rewards))):
            delta = rewards[i] + self.gamma * values[i + 1] * (1 - dones[i]) - values[i]
            gae = delta + self.gamma * gae_lambda * (1 - dones[i]) * gae
            advantages.insert(0, gae)
            returns.insert(0, gae + values[i])
        
        return advantages, returns
    
    def update(self):
        """Update policy and value networks using PPO"""
        if len(self.memory['states']) == 0:
            return
        
        # Convert to tensors
        states = torch.FloatTensor(np.array(self.memory['states']))
        actions = torch.LongTensor(self.memory['actions'])
        old_log_probs = torch.FloatTensor(self.memory['log_probs'])
        rewards = self.memory['rewards']
        values = self.memory['values']
        dones = self.memory['dones']
        
        # Compute advantages and returns
        advantages, returns = self.compute_gae(rewards, values, dones)
        advantages = torch.FloatTensor(advantages)
        returns = torch.FloatTensor(returns)
        
        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        # PPO updates
        total_policy_loss = 0
        total_value_loss = 0
        
        for _ in range(self.k_epochs):
            # Get current policy predictions
            action_probs = self.policy(states)
            dist = torch.distributions.Categorical(action_probs)
            new_log_probs = dist.log_prob(actions)
            entropy = dist.entropy().mean()
            
            # Compute ratio
            ratio = torch.exp(new_log_probs - old_log_probs)
            
            # Compute surrogate loss
            surr1 = ratio * advantages
            surr2 = torch.clamp(ratio, 1 - self.eps_clip, 1 + self.eps_clip) * advantages
            policy_loss = -torch.min(surr1, surr2).mean() - 0.01 * entropy
            
            # Update policy
            self.policy_optimizer.zero_grad()
            policy_loss.backward()
            torch.nn.utils.clip_grad_norm_(self.policy.parameters(), 0.5)
            self.policy_optimizer.step()
            
            # Update value function
            current_values = self.value(states).squeeze()
            value_loss = F.mse_loss(current_values, returns)
            
            self.value_optimizer.zero_grad()
            value_loss.backward()
            torch.nn.utils.clip_grad_norm_(self.value.parameters(), 0.5)
            self.value_optimizer.step()
            
            total_policy_loss += policy_loss.item()
            total_value_loss += value_loss.item()
        
        # Store metrics
        avg_policy_loss = total_policy_loss / self.k_epochs
        avg_value_loss = total_value_loss / self.k_epochs
        
        self.training_metrics['policy_losses'].append(avg_policy_loss)
        self.training_metrics['value_losses'].append(avg_value_loss)
        
        # Clear memory
        self.clear_memory()
        
        return avg_policy_loss, avg_value_loss
    
    def clear_memory(self):
        """Clear memory buffers"""
        for key in self.memory:
            self.memory[key] = []
    
    def save_checkpoint(self, filepath: str, episode: int, avg_reward: float):
        """Save model checkpoint"""
        checkpoint = {
            'episode': episode,
            'policy_state_dict': self.policy.state_dict(),
            'value_state_dict': self.value.state_dict(),
            'policy_optimizer_state_dict': self.policy_optimizer.state_dict(),
            'value_optimizer_state_dict': self.value_optimizer.state_dict(),
            'avg_reward': avg_reward,
            'training_metrics': self.training_metrics
        }
        torch.save(checkpoint, filepath)
        print(f"Checkpoint saved: {filepath}")
    
    def load_checkpoint(self, filepath: str):
        """Load model checkpoint"""
        if os.path.exists(filepath):
            checkpoint = torch.load(filepath, map_location='cpu')
            self.policy.load_state_dict(checkpoint['policy_state_dict'])
            self.value.load_state_dict(checkpoint['value_state_dict'])
            self.policy_optimizer.load_state_dict(checkpoint['policy_optimizer_state_dict'])
            self.value_optimizer.load_state_dict(checkpoint['value_optimizer_state_dict'])
            self.training_metrics = checkpoint.get('training_metrics', self.training_metrics)
            print(f"Checkpoint loaded: {filepath}")
            return checkpoint['episode'], checkpoint['avg_reward']
        return 0, 0.0
