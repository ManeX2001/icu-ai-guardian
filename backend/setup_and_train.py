
#!/usr/bin/env python3
"""
Setup script to prepare the ICU PPO system
"""

import os
import sys

def setup_directories():
    """Create necessary directories"""
    directories = ['models', 'data', 'logs']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")

def train_initial_model():
    """Train initial model"""
    print("Training initial PPO model...")
    os.system("python train_ppo_icu.py --epochs 100 --save-interval 25")

def main():
    print("=== ICU PPO Setup ===")
    
    # Setup directories
    setup_directories()
    
    # Train initial model
    if len(sys.argv) > 1 and sys.argv[1] == '--train':
        train_initial_model()
    else:
        print("Run with --train flag to train initial model")
        print("Usage: python setup_and_train.py --train")
    
    print("Setup completed!")

if __name__ == "__main__":
    main()
