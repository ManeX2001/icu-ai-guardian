
import torch
import torch.nn as nn
import torch.nn.functional as F

class PolicyNetwork(nn.Module):
    """Neural network for policy (action selection)"""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super(PolicyNetwork, self).__init__()
        
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, hidden_dim)
        self.output = nn.Linear(hidden_dim, action_dim)
        
        # Batch normalization for better training stability
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.bn2 = nn.BatchNorm1d(hidden_dim)
        
        # Dropout for regularization
        self.dropout = nn.Dropout(0.1)
        
    def forward(self, x):
        """Forward pass through the network"""
        # Handle single sample (add batch dimension)
        if x.dim() == 1:
            x = x.unsqueeze(0)
            
        x = F.relu(self.bn1(self.fc1(x)))
        x = self.dropout(x)
        x = F.relu(self.bn2(self.fc2(x)))
        x = self.dropout(x)
        x = F.relu(self.fc3(x))
        
        # Output action probabilities
        action_logits = self.output(x)
        action_probs = F.softmax(action_logits, dim=-1)
        
        return action_probs

class ValueNetwork(nn.Module):
    """Neural network for value function (state value estimation)"""
    
    def __init__(self, state_dim: int, hidden_dim: int = 128):
        super(ValueNetwork, self).__init__()
        
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, hidden_dim)
        self.output = nn.Linear(hidden_dim, 1)
        
        # Batch normalization
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.bn2 = nn.BatchNorm1d(hidden_dim)
        
        # Dropout
        self.dropout = nn.Dropout(0.1)
        
    def forward(self, x):
        """Forward pass through the network"""
        # Handle single sample (add batch dimension)
        if x.dim() == 1:
            x = x.unsqueeze(0)
            
        x = F.relu(self.bn1(self.fc1(x)))
        x = self.dropout(x)
        x = F.relu(self.bn2(self.fc2(x)))
        x = self.dropout(x)
        x = F.relu(self.fc3(x))
        
        # Output state value
        value = self.output(x)
        
        return value

class CriticNetwork(nn.Module):
    """Alternative critic network for advanced PPO implementations"""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super(CriticNetwork, self).__init__()
        
        self.state_encoder = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1)
        )
        
        self.action_encoder = nn.Sequential(
            nn.Linear(action_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim), 
            nn.ReLU(),
            nn.Dropout(0.1)
        )
        
        self.critic_head = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
        
    def forward(self, state, action):
        """Forward pass for state-action value"""
        if state.dim() == 1:
            state = state.unsqueeze(0)
        if action.dim() == 1:
            action = action.unsqueeze(0)
            
        state_features = self.state_encoder(state)
        action_features = self.action_encoder(action)
        
        combined = torch.cat([state_features, action_features], dim=-1)
        q_value = self.critic_head(combined)
        
        return q_value
