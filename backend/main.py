
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn
import numpy as np
import torch
import os
import logging

from data.data_loader import ICUDataLoader
from environment.icu_env import ICUEnv
from agents.ppo_agent import PPOAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ICU PPO Decision API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
ppo_agent = None
data_loader = None
env = None
X_train = None
y_train = None

class PatientData(BaseModel):
    DiastolicBP: float
    HeartRate: float
    MeanBP: float
    RespRate: float
    SpO2: float
    SysBP: float
    Temperature: float
    age: float
    gender: str
    admission_type: str

class PredictionResponse(BaseModel):
    action: int
    action_name: str
    action_probabilities: Dict[str, float]
    confidence: float
    state_value: float
    reasoning: str

class TrainingRequest(BaseModel):
    epochs: int = 10

class TrainingResponse(BaseModel):
    status: str
    epochs_completed: int
    final_reward: float
    message: str

@app.on_event("startup")
async def startup_event():
    global ppo_agent, data_loader, env, X_train, y_train
    
    logger.info("Initializing ICU PPO service...")
    
    # Initialize data loader
    data_loader = ICUDataLoader()
    df = data_loader.load_data_from_string()
    X, y, metadata = data_loader.preprocess_data(df)
    X_train, X_test, y_train, y_test = data_loader.split_data(X, y)
    
    # Initialize environment
    env = ICUEnv(data_loader, X_train, y_train)
    
    # Initialize PPO agent
    ppo_agent = PPOAgent(
        state_dim=X_train.shape[1],
        action_dim=4,
        lr=3e-4
    )
    
    # Try to load existing model
    model_path = "models/best_ppo_icu.pt"
    if os.path.exists(model_path):
        try:
            ppo_agent.load_checkpoint(model_path)
            logger.info(f"Loaded pre-trained model from {model_path}")
        except Exception as e:
            logger.warning(f"Could not load model: {e}")
    else:
        logger.info("No pre-trained model found, using fresh model")
    
    logger.info("ICU PPO service initialized successfully")

@app.get("/")
async def root():
    return {"message": "ICU PPO Decision API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": ppo_agent is not None,
        "data_loaded": data_loader is not None
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_decision(patient_data: PatientData):
    """Make ICU decision prediction for a patient"""
    try:
        if ppo_agent is None or data_loader is None:
            raise HTTPException(status_code=500, detail="Models not initialized")
        
        # Transform patient data to model input
        patient_dict = patient_data.dict()
        state = data_loader.transform_patient(patient_dict)
        
        # Get prediction
        action, action_probs, value = ppo_agent.predict(state)
        
        # Map actions to names
        action_names = {
            0: "Discharge",
            1: "Ward Admission",
            2: "ICU Admission", 
            3: "Specialist Referral"
        }
        
        action_name = action_names[action]
        confidence = float(np.max(action_probs))
        
        # Generate reasoning
        reasoning = generate_reasoning(patient_data, action, action_probs, value)
        
        return PredictionResponse(
            action=action,
            action_name=action_name,
            action_probabilities={
                "Discharge": float(action_probs[0]),
                "Ward Admission": float(action_probs[1]),
                "ICU Admission": float(action_probs[2]),
                "Specialist Referral": float(action_probs[3])
            },
            confidence=confidence,
            state_value=float(value),
            reasoning=reasoning
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    """Train the PPO model for additional epochs"""
    try:
        if ppo_agent is None or env is None:
            raise HTTPException(status_code=500, detail="Models not initialized")
        
        logger.info(f"Starting training for {request.epochs} epochs")
        
        episode_rewards = []
        
        # Training loop
        for epoch in range(request.epochs):
            # Collect episodes
            epoch_rewards = []
            
            for episode in range(16):  # 16 episodes per epoch for API training
                state, _ = env.reset()
                
                # Single step episode
                action, log_prob, value = ppo_agent.select_action(state)
                next_state, reward, terminated, truncated, info = env.step(action)
                
                # Store transition
                ppo_agent.store_transition(state, action, reward, log_prob, value, terminated)
                epoch_rewards.append(reward)
            
            # Update agent
            ppo_agent.update()
            
            # Track rewards
            avg_reward = np.mean(epoch_rewards)
            episode_rewards.append(avg_reward)
        
        final_reward = np.mean(episode_rewards)
        
        # Save updated model
        os.makedirs("models", exist_ok=True)
        model_path = "models/best_ppo_icu.pt"
        ppo_agent.save_checkpoint(model_path, request.epochs, final_reward)
        
        logger.info(f"Training completed. Final reward: {final_reward:.2f}")
        
        return TrainingResponse(
            status="completed",
            epochs_completed=request.epochs,
            final_reward=float(final_reward),
            message=f"Training completed successfully for {request.epochs} epochs"
        )
        
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

def generate_reasoning(patient_data: PatientData, action: int, action_probs: np.ndarray, value: float) -> str:
    """Generate human-readable reasoning for the decision"""
    
    action_names = {
        0: "Discharge",
        1: "Ward Admission", 
        2: "ICU Admission",
        3: "Specialist Referral"
    }
    
    decision = action_names[action]
    confidence = np.max(action_probs)
    
    reasoning = f"Recommendation: {decision} (confidence: {confidence:.1%})\n\n"
    reasoning += f"State value estimate: {value:.2f}\n\n"
    
    # Analyze key vital signs
    concerns = []
    if patient_data.SpO2 < 95:
        concerns.append("low oxygen saturation")
    if patient_data.HeartRate > 100:
        concerns.append("elevated heart rate") 
    if patient_data.SysBP > 140 or patient_data.SysBP < 90:
        concerns.append("abnormal blood pressure")
    if patient_data.RespRate > 20:
        concerns.append("elevated respiratory rate")
    
    if concerns:
        reasoning += f"Clinical concerns: {', '.join(concerns)}\n\n"
    
    # Age and admission type context
    reasoning += f"Patient factors: {patient_data.age:.0f} years old, {patient_data.gender}, "
    reasoning += f"{patient_data.admission_type.lower()} admission\n\n"
    
    # Decision rationale
    if action == 2:  # ICU
        reasoning += "ICU admission recommended due to high-risk clinical profile"
    elif action == 1:  # Ward
        reasoning += "Ward-level monitoring recommended for moderate-risk patient"
    elif action == 0:  # Discharge
        reasoning += "Patient stable for discharge with appropriate follow-up"
    else:  # Specialist
        reasoning += "Specialist consultation recommended for complex case management"
    
    return reasoning

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
