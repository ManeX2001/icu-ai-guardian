
#!/usr/bin/env python3
"""
Training script for PPO ICU Decision Agent
"""

import argparse
import os
import numpy as np
import torch
from datetime import datetime

from data.data_loader import ICUDataLoader
from environment.icu_env import ICUEnv
from agents.ppo_agent import PPOAgent

def train_ppo(epochs: int = 500, save_interval: int = 50, model_dir: str = "models"):
    """Train PPO agent for ICU decision making"""
    
    print("=== ICU PPO Training ===")
    print(f"Epochs: {epochs}")
    print(f"Save interval: {save_interval}")
    
    # Create directories
    os.makedirs(model_dir, exist_ok=True)
    
    # Load and preprocess data
    print("Loading and preprocessing data...")
    data_loader = ICUDataLoader()
    df = data_loader.load_data_from_string()
    X, y, metadata = data_loader.preprocess_data(df)
    X_train, X_test, y_train, y_test = data_loader.split_data(X, y)
    
    print(f"Training data: {X_train.shape[0]} samples")
    print(f"Test data: {X_test.shape[0]} samples")
    print(f"Feature dimension: {X_train.shape[1]}")
    print(f"Positive outcomes: {y_train.sum()}/{len(y_train)} ({y_train.mean():.2%})")
    
    # Create environment and agent
    env = ICUEnv(data_loader, X_train, y_train)
    agent = PPOAgent(
        state_dim=X_train.shape[1],
        action_dim=4,
        lr=3e-4,
        gamma=0.99,
        eps_clip=0.2,
        k_epochs=4
    )
    
    # Training variables
    best_avg_reward = float('-inf')
    episode_rewards = []
    
    print("\nStarting training...")
    
    for epoch in range(epochs):
        # Collect episodes
        epoch_rewards = []
        
        # Collect multiple episodes per epoch
        for episode in range(32):  # 32 episodes per epoch
            state, _ = env.reset()
            episode_reward = 0
            
            # Single step episode
            action, log_prob, value = agent.select_action(state)
            next_state, reward, terminated, truncated, info = env.step(action)
            
            # Store transition
            agent.store_transition(state, action, reward, log_prob, value, terminated)
            episode_reward += reward
            
            epoch_rewards.append(episode_reward)
            agent.training_metrics['total_episodes'] += 1
        
        # Update agent
        policy_loss, value_loss = agent.update()
        
        # Calculate metrics
        avg_reward = np.mean(epoch_rewards)
        episode_rewards.extend(epoch_rewards)
        agent.training_metrics['episode_rewards'].extend(epoch_rewards)
        
        # Print progress
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch + 1}/{epochs} | "
                  f"Avg Reward: {avg_reward:.2f} | "
                  f"Policy Loss: {policy_loss:.4f} | "
                  f"Value Loss: {value_loss:.4f}")
        
        # Save best model
        if avg_reward > best_avg_reward:
            best_avg_reward = avg_reward
            best_model_path = os.path.join(model_dir, "best_ppo_icu.pt")
            agent.save_checkpoint(best_model_path, epoch, avg_reward)
        
        # Save checkpoint
        if (epoch + 1) % save_interval == 0:
            checkpoint_path = os.path.join(model_dir, f"ppo_icu_epoch_{epoch + 1}.pt")
            agent.save_checkpoint(checkpoint_path, epoch, avg_reward)
    
    # Save final model
    final_model_path = os.path.join(model_dir, "final_ppo_icu.pt")
    agent.save_checkpoint(final_model_path, epochs, avg_reward)
    
    print(f"\nTraining completed!")
    print(f"Best average reward: {best_avg_reward:.2f}")
    print(f"Final average reward: {avg_reward:.2f}")
    print(f"Total episodes: {agent.training_metrics['total_episodes']}")
    
    # Evaluate on test set
    print("\nEvaluating on test data...")
    correct_predictions = 0
    total_predictions = 0
    
    for i in range(min(100, len(X_test))):  # Test on 100 samples
        state = X_test[i]
        true_outcome = y_test[i]
        
        action, action_probs, value = agent.predict(state)
        
        # Simple evaluation: ICU admission for high-risk patients
        predicted_high_risk = action == 2  # ICU admission
        actual_high_risk = true_outcome == 1
        
        if predicted_high_risk == actual_high_risk:
            correct_predictions += 1
        total_predictions += 1
    
    accuracy = correct_predictions / total_predictions
    print(f"Test accuracy: {accuracy:.2%} ({correct_predictions}/{total_predictions})")

def main():
    parser = argparse.ArgumentParser(description='Train PPO agent for ICU decisions')
    parser.add_argument('--epochs', type=int, default=500, help='Number of training epochs')
    parser.add_argument('--save-interval', type=int, default=50, help='Save checkpoint every N epochs')
    parser.add_argument('--model-dir', type=str, default='models', help='Directory to save models')
    
    args = parser.parse_args()
    
    train_ppo(args.epochs, args.save_interval, args.model_dir)

if __name__ == "__main__":
    main()
