
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn
import numpy as np
import pandas as pd
from models.ppo_agent import PPOAgent
from models.environment import ICUEnvironment
from data.patient_data import PatientDataProcessor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ICU PPO Decision API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
ppo_agent = None
icu_environment = None
data_processor = None

class PatientData(BaseModel):
    age: float
    gender: str
    diastolic_bp: float
    heart_rate: float
    mean_bp: float
    resp_rate: float
    spo2: float
    sys_bp: float
    temperature: float
    admission_type: str
    icu_capacity: int = 20
    icu_occupied: int = 15

class DecisionResponse(BaseModel):
    recommendation: str
    confidence: float
    action_probabilities: Dict[str, float]
    reasoning: str
    risk_score: float
    expected_outcome: str

class TrainingMetrics(BaseModel):
    current_epoch: int
    total_epochs: int
    accuracy: float
    loss: float
    reward_score: float
    patients_processed: int
    correct_decisions: int
    is_training: bool
    training_progress: float

@app.on_event("startup")
async def startup_event():
    global ppo_agent, icu_environment, data_processor
    
    logger.info("Initializing PPO Agent and ICU Environment...")
    
    # Initialize data processor
    data_processor = PatientDataProcessor()
    
    # Initialize ICU environment
    icu_environment = ICUEnvironment()
    
    # Initialize PPO agent
    ppo_agent = PPOAgent(
        state_dim=icu_environment.observation_space.shape[0],
        action_dim=icu_environment.action_space.n,
        lr=3e-4
    )
    
    # Load pre-trained model if exists
    try:
        ppo_agent.load_model("models/saved/ppo_icu_model.pkl")
        logger.info("Loaded pre-trained PPO model")
    except FileNotFoundError:
        logger.info("No pre-trained model found, starting with fresh model")
    
    logger.info("PPO Agent initialized successfully")

@app.get("/")
async def root():
    return {"message": "ICU PPO Decision API is running"}

@app.post("/predict", response_model=DecisionResponse)
async def predict_admission(patient_data: PatientData):
    """
    Make ICU admission decision using trained PPO agent
    """
    try:
        if ppo_agent is None or icu_environment is None:
            raise HTTPException(status_code=500, detail="Models not initialized")
        
        # Process patient data into state vector
        state = data_processor.process_patient_data(patient_data.dict())
        
        # Get action probabilities from PPO agent
        action, action_probs, value = ppo_agent.predict(state)
        
        # Map action to decision
        action_map = {0: "Discharge", 1: "Ward Admission", 2: "ICU Admission", 3: "Specialist Referral"}
        recommendation = action_map[action]
        
        # Calculate confidence and risk score
        confidence = float(np.max(action_probs))
        risk_score = data_processor.calculate_risk_score(patient_data.dict())
        
        # Generate reasoning
        reasoning = generate_reasoning(patient_data, action, action_probs, risk_score)
        
        # Predict expected outcome
        expected_outcome = predict_outcome(patient_data, action, risk_score)
        
        return DecisionResponse(
            recommendation=recommendation,
            confidence=confidence,
            action_probabilities={
                "Discharge": float(action_probs[0]),
                "Ward Admission": float(action_probs[1]),
                "ICU Admission": float(action_probs[2]),
                "Specialist Referral": float(action_probs[3])
            },
            reasoning=reasoning,
            risk_score=risk_score,
            expected_outcome=expected_outcome
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train")
async def train_agent():
    """
    Start training the PPO agent with recent patient data
    """
    try:
        if ppo_agent is None or icu_environment is None:
            raise HTTPException(status_code=500, detail="Models not initialized")
        
        # Load training data
        training_data = data_processor.load_training_data()
        
        # Train for one epoch
        metrics = ppo_agent.train_epoch(icu_environment, training_data)
        
        # Save model
        ppo_agent.save_model("models/saved/ppo_icu_model.pkl")
        
        return {"status": "Training completed", "metrics": metrics}
        
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/metrics", response_model=TrainingMetrics)
async def get_training_metrics():
    """
    Get current training metrics
    """
    try:
        if ppo_agent is None:
            raise HTTPException(status_code=500, detail="Agent not initialized")
        
        metrics = ppo_agent.get_metrics()
        return TrainingMetrics(**metrics)
        
    except Exception as e:
        logger.error(f"Metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

@app.post("/feedback")
async def provide_feedback(patient_id: str, decision: str, actual_outcome: str, was_correct: bool):
    """
    Provide feedback on decision accuracy for continuous learning
    """
    try:
        if ppo_agent is None:
            raise HTTPException(status_code=500, detail="Agent not initialized")
        
        # Calculate reward based on feedback
        reward = 10 if was_correct else -5
        
        # Update agent with feedback
        ppo_agent.update_with_feedback(patient_id, decision, actual_outcome, reward)
        
        return {"status": "Feedback recorded", "reward": reward}
        
    except Exception as e:
        logger.error(f"Feedback error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")

def generate_reasoning(patient_data: PatientData, action: int, action_probs: np.ndarray, risk_score: float) -> str:
    """Generate human-readable reasoning for the decision"""
    
    action_map = {0: "Discharge", 1: "Ward Admission", 2: "ICU Admission", 3: "Specialist Referral"}
    decision = action_map[action]
    
    # Analyze vital signs
    vitals_analysis = []
    if patient_data.heart_rate > 100:
        vitals_analysis.append("elevated heart rate")
    if patient_data.sys_bp > 140 or patient_data.sys_bp < 90:
        vitals_analysis.append("abnormal blood pressure")
    if patient_data.spo2 < 95:
        vitals_analysis.append("low oxygen saturation")
    if patient_data.resp_rate > 20:
        vitals_analysis.append("elevated respiratory rate")
    
    reasoning = f"Recommendation: {decision} (confidence: {np.max(action_probs):.1%})\n\n"
    reasoning += f"Risk Assessment: {risk_score:.1f}/10\n\n"
    
    if vitals_analysis:
        reasoning += f"Clinical Concerns: {', '.join(vitals_analysis)}\n\n"
    
    # ICU capacity consideration
    occupancy_rate = patient_data.icu_occupied / patient_data.icu_capacity
    if occupancy_rate > 0.9:
        reasoning += "ICU at high capacity - prioritizing critical cases\n\n"
    
    reasoning += f"Age factor: {patient_data.age} years, {patient_data.admission_type.lower()} admission"
    
    return reasoning

def predict_outcome(patient_data: PatientData, action: int, risk_score: float) -> str:
    """Predict expected patient outcome based on decision and risk factors"""
    
    if action == 2:  # ICU Admission
        if risk_score > 7:
            return "High-risk patient - ICU monitoring essential for optimal outcome"
        else:
            return "Stable condition expected with ICU care"
    elif action == 1:  # Ward Admission
        if risk_score < 5:
            return "Good prognosis with ward-level monitoring"
        else:
            return "Moderate risk - ward care with frequent monitoring"
    elif action == 0:  # Discharge
        return "Stable for discharge with outpatient follow-up"
    else:  # Specialist Referral
        return "Requires specialist evaluation for optimal care pathway"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
