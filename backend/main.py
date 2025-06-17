
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import uvicorn
import numpy as np
import logging
import os
from pathlib import Path

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

# Pydantic models
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

# Global variables - will be initialized on startup
ppo_agent = None
icu_environment = None
data_processor = None

@app.on_event("startup")
async def startup_event():
    global ppo_agent, icu_environment, data_processor
    
    logger.info("Initializing ICU PPO Decision API...")
    
    # Create necessary directories
    os.makedirs("models/saved", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Initialize placeholder components (will be replaced when other files are created)
    logger.info("API initialized successfully - components will be loaded when available")

@app.get("/")
async def root():
    return {"message": "ICU PPO Decision API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ICU PPO Decision API",
        "version": "1.0.0",
        "components": {
            "ppo_agent": ppo_agent is not None,
            "environment": icu_environment is not None,
            "data_processor": data_processor is not None
        }
    }

@app.post("/predict", response_model=DecisionResponse)
async def predict_admission(patient_data: PatientData):
    """
    Make ICU admission decision using trained PPO agent
    """
    try:
        # Temporary mock response until PPO agent is implemented
        logger.info(f"Received prediction request for patient: age={patient_data.age}")
        
        # Simple rule-based mock logic
        risk_score = calculate_mock_risk_score(patient_data)
        
        # Mock decision logic
        if risk_score > 7:
            recommendation = "ICU Admission"
            action = 2
        elif risk_score > 4:
            recommendation = "Ward Admission"
            action = 1
        elif risk_score > 2:
            recommendation = "Specialist Referral"
            action = 3
        else:
            recommendation = "Discharge"
            action = 0
        
        # Mock action probabilities
        action_probs = [0.25, 0.25, 0.25, 0.25]
        action_probs[action] = 0.7
        
        confidence = action_probs[action]
        
        return DecisionResponse(
            recommendation=recommendation,
            confidence=confidence,
            action_probabilities={
                "Discharge": action_probs[0],
                "Ward Admission": action_probs[1],
                "ICU Admission": action_probs[2],
                "Specialist Referral": action_probs[3]
            },
            reasoning=generate_mock_reasoning(patient_data, recommendation, risk_score),
            risk_score=risk_score,
            expected_outcome=predict_mock_outcome(recommendation, risk_score)
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
        logger.info("Training request received")
        
        # Mock training response until PPO agent is implemented
        return {
            "status": "Training completed (mock)",
            "metrics": {
                "epochs": 100,
                "accuracy": 85.5,
                "loss": 0.15,
                "reward": 250.0
            }
        }
        
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/metrics", response_model=TrainingMetrics)
async def get_training_metrics():
    """
    Get current training metrics
    """
    try:
        # Mock metrics until PPO agent is implemented
        return TrainingMetrics(
            current_epoch=100,
            total_epochs=1000,
            accuracy=85.5,
            loss=0.15,
            reward_score=250.0,
            patients_processed=500,
            correct_decisions=427,
            is_training=False,
            training_progress=10.0
        )
        
    except Exception as e:
        logger.error(f"Metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

def calculate_mock_risk_score(patient_data: PatientData) -> float:
    """Calculate a simple mock risk score"""
    risk = 0
    
    # Age factor
    if patient_data.age > 80:
        risk += 3
    elif patient_data.age > 65:
        risk += 2
    elif patient_data.age > 50:
        risk += 1
    
    # Vital signs
    if patient_data.heart_rate > 120 or patient_data.heart_rate < 50:
        risk += 2
    if patient_data.sys_bp > 180 or patient_data.sys_bp < 90:
        risk += 2
    if patient_data.spo2 < 90:
        risk += 3
    elif patient_data.spo2 < 95:
        risk += 1
    if patient_data.resp_rate > 25:
        risk += 2
    if patient_data.temperature > 102 or patient_data.temperature < 96:
        risk += 1
    
    # Emergency admission
    if patient_data.admission_type == "EMERGENCY":
        risk += 1
    
    return min(risk, 10)

def generate_mock_reasoning(patient_data: PatientData, recommendation: str, risk_score: float) -> str:
    """Generate mock reasoning for the decision"""
    reasoning = f"Recommendation: {recommendation}\n"
    reasoning += f"Risk Score: {risk_score}/10\n\n"
    
    if patient_data.age > 70:
        reasoning += f"Elderly patient ({patient_data.age} years) requires careful monitoring.\n"
    
    if patient_data.heart_rate > 100:
        reasoning += f"Elevated heart rate ({patient_data.heart_rate}) indicates potential distress.\n"
    
    if patient_data.spo2 < 95:
        reasoning += f"Low oxygen saturation ({patient_data.spo2}%) requires attention.\n"
    
    if patient_data.admission_type == "EMERGENCY":
        reasoning += "Emergency admission increases risk level.\n"
    
    return reasoning

def predict_mock_outcome(recommendation: str, risk_score: float) -> str:
    """Predict mock outcome based on recommendation"""
    if recommendation == "ICU Admission":
        return "Intensive monitoring and care expected to stabilize patient"
    elif recommendation == "Ward Admission":
        return "Regular monitoring with good prognosis expected"
    elif recommendation == "Specialist Referral":
        return "Specialist consultation needed for optimal care"
    else:
        return "Stable for discharge with follow-up care"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
