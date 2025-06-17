
#!/usr/bin/env python3
"""
Training script for PPO ICU Decision Agent
Run this to train the model on patient data
"""

import argparse
import logging
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from models.ppo_agent import PPOAgent
from models.environment import ICUEnvironment
from data.patient_data import PatientDataProcessor
import torch
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def train_ppo_agent(epochs: int = 1000, save_interval: int = 100):
    """Train PPO agent for ICU decision making"""
    
    logger.info("Initializing training environment...")
    
    # Initialize components
    data_processor = PatientDataProcessor()
    environment = ICUEnvironment()
    
    # Initialize PPO agent
    agent = PPOAgent(
        state_dim=environment.observation_space.shape[0],
        action_dim=environment.action_space.n,
        lr=3e-4,
        gamma=0.99,
        epsilon=0.2,
        k_epochs=4
    )
    
    # Load training data
    training_data = data_processor.load_training_data()
    logger.info(f"Loaded {len(training_data)} training samples")
    
    # Create models directory
    os.makedirs("models/saved", exist_ok=True)
    
    # Training loop
    best_reward = float('-inf')
    
    for epoch in range(epochs):
        logger.info(f"Starting epoch {epoch + 1}/{epochs}")
        
        # Train one epoch
        metrics = agent.train_epoch(environment, training_data)
        
        # Log progress
        if (epoch + 1) % 10 == 0:
            logger.info(f"Epoch {epoch + 1}: "
                       f"Reward={metrics['total_reward']:.2f}, "
                       f"Accuracy={metrics['accuracy']:.1f}%, "
                       f"Loss={metrics['loss']:.4f}")
        
        # Save best model
        if metrics['total_reward'] > best_reward:
            best_reward = metrics['total_reward']
            agent.save_model("models/saved/ppo_icu_best.pkl")
            logger.info(f"New best model saved! Reward: {best_reward:.2f}")
        
        # Save checkpoint
        if (epoch + 1) % save_interval == 0:
            checkpoint_path = f"models/saved/ppo_icu_epoch_{epoch + 1}.pkl"
            agent.save_model(checkpoint_path)
            logger.info(f"Checkpoint saved: {checkpoint_path}")
    
    # Save final model
    agent.save_model("models/saved/ppo_icu_final.pkl")
    logger.info("Training completed!")
    
    # Print final metrics
    final_metrics = agent.get_metrics()
    logger.info("Final Training Metrics:")
    logger.info(f"  Total Epochs: {final_metrics['current_epoch']}")
    logger.info(f"  Accuracy: {final_metrics['accuracy']:.2f}%")
    logger.info(f"  Patients Processed: {final_metrics['patients_processed']}")
    logger.info(f"  Correct Decisions: {final_metrics['correct_decisions']}")
    logger.info(f"  Final Reward Score: {final_metrics['reward_score']:.2f}")

def evaluate_agent(model_path: str = "models/saved/ppo_icu_best.pkl"):
    """Evaluate trained agent performance"""
    
    logger.info(f"Evaluating model: {model_path}")
    
    # Initialize components
    data_processor = PatientDataProcessor()
    environment = ICUEnvironment()
    
    # Load trained agent
    agent = PPOAgent(
        state_dim=environment.observation_space.shape[0],
        action_dim=environment.action_space.n
    )
    
    try:
        agent.load_model(model_path)
    except FileNotFoundError:
        logger.error(f"Model not found: {model_path}")
        return
    
    # Generate test data
    test_data = data_processor.load_training_data()[:50]  # Use subset for evaluation
    
    correct_decisions = 0
    total_decisions = len(test_data)
    
    action_map = {0: "Discharge", 1: "Ward Admission", 2: "ICU Admission", 3: "Specialist Referral"}
    
    for patient in test_data:
        # Get agent prediction
        state = environment.reset(patient)
        action, action_probs, value = agent.predict(state)
        predicted_decision = action_map[action]
        
        # Compare with expected outcome (simplified)
        expected_outcome = patient['actual_outcome']
        outcome_action_map = {
            'discharge': 0,
            'ward': 1,
            'icu': 2,
            'specialist': 3
        }
        
        expected_action = outcome_action_map.get(expected_outcome, 1)
        
        if action == expected_action:
            correct_decisions += 1
        
        logger.debug(f"Patient {patient['patient_id']}: "
                    f"Predicted={predicted_decision}, "
                    f"Expected={expected_outcome}, "
                    f"Confidence={np.max(action_probs):.2f}")
    
    accuracy = (correct_decisions / total_decisions) * 100
    logger.info(f"Evaluation Results:")
    logger.info(f"  Total Patients: {total_decisions}")
    logger.info(f"  Correct Decisions: {correct_decisions}")
    logger.info(f"  Accuracy: {accuracy:.2f}%")

def main():
    """Main training script"""
    parser = argparse.ArgumentParser(description='Train PPO agent for ICU decisions')
    parser.add_argument('--epochs', type=int, default=1000, help='Number of training epochs')
    parser.add_argument('--save-interval', type=int, default=100, help='Model save interval')
    parser.add_argument('--evaluate', action='store_true', help='Evaluate trained model')
    parser.add_argument('--model-path', type=str, default='models/saved/ppo_icu_best.pkl', 
                       help='Path to model for evaluation')
    
    args = parser.parse_args()
    
    if args.evaluate:
        evaluate_agent(args.model_path)
    else:
        train_ppo_agent(args.epochs, args.save_interval)

if __name__ == "__main__":
    main()
