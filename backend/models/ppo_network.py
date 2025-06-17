
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class PolicyNetwork(nn.Module):
    """Policy network for PPO agent"""
    
    def __init__(self, input_dim, hidden_dim=64, output_dim=4):
        super(PolicyNetwork, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )
        
    def forward(self, x):
        return F.softmax(self.network(x), dim=-1)

class ValueNetwork(nn.Module):
    """Value network for PPO agent"""
    
    def __init__(self, input_dim, hidden_dim=64):
        super(ValueNetwork, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
        
    def forward(self, x):
        return self.network(x)

class ActorCritic(nn.Module):
    """Combined Actor-Critic network for PPO"""
    
    def __init__(self, state_dim, action_dim, hidden_dim=64):
        super(ActorCritic, self).__init__()
        
        self.shared_layers = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )
        
        self.policy_head = nn.Linear(hidden_dim, action_dim)
        self.value_head = nn.Linear(hidden_dim, 1)
        
    def forward(self, x):
        shared = self.shared_layers(x)
        policy = F.softmax(self.policy_head(shared), dim=-1)
        value = self.value_head(shared)
        return policy, value
    
    def get_action(self, state):
        """Get action and log probability"""
        policy, value = self.forward(state)
        dist = torch.distributions.Categorical(policy)
        action = dist.sample()
        log_prob = dist.log_prob(action)
        return action.item(), log_prob, value.item()
    
    def evaluate(self, states, actions):
        """Evaluate actions for PPO update"""
        policy, values = self.forward(states)
        dist = torch.distributions.Categorical(policy)
        
        log_probs = dist.log_prob(actions)
        entropy = dist.entropy()
        
        return log_probs, values.squeeze(), entropy
