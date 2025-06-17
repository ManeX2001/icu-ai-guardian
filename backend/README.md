
# ICU PPO Decision Backend

A real-time AI decision support system for ICU patient admissions using Proximal Policy Optimization (PPO) reinforcement learning.

## Overview

This backend implements a PPO-based agent that learns to make optimal ICU admission decisions based on:
- Patient vital signs and demographics
- Hospital capacity and resource availability
- Historical patient outcomes
- Real-time feedback from medical staff

## Architecture

```
backend/
├── main.py                 # FastAPI server
├── models/
│   ├── ppo_agent.py       # PPO implementation
│   ├── environment.py     # ICU environment simulation
│   └── network.py         # Neural networks (Policy & Value)
├── data/
│   └── patient_data.py    # Data processing utilities
├── train_ppo_icu.py       # Training script
└── requirements.txt       # Dependencies
```

## Features

### PPO Agent
- **Policy Network**: Neural network that outputs action probabilities
- **Value Network**: Estimates state values for advantage calculation
- **Experience Replay**: Stores and learns from patient interactions
- **Continuous Learning**: Updates model based on real outcomes

### ICU Environment
- **State Space**: Patient vitals + hospital status (12 dimensions)
- **Action Space**: 4 discrete actions (Discharge, Ward, ICU, Specialist)
- **Reward System**: Based on patient outcomes and resource efficiency
- **Dynamic Hospital State**: Realistic capacity fluctuations

### Decision Actions
1. **Discharge** (0): Send patient home with follow-up
2. **Ward Admission** (1): General hospital admission
3. **ICU Admission** (2): Intensive care unit
4. **Specialist Referral** (3): Consult with specialist

## Installation

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Create model directory:**
```bash
mkdir -p models/saved
```

## Training

### Train New Model
```bash
python train_ppo_icu.py --epochs 1000
```

### Train with Custom Parameters
```bash
python train_ppo_icu.py --epochs 2000 --save-interval 50
```

### Evaluate Trained Model
```bash
python train_ppo_icu.py --evaluate --model-path models/saved/ppo_icu_best.pkl
```

## API Server

### Start Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### API Endpoints

#### Make Decision
```bash
POST /predict
```
```json
{
  "age": 65,
  "gender": "M",
  "diastolic_bp": 80,
  "heart_rate": 95,
  "mean_bp": 85,
  "resp_rate": 18,
  "spo2": 96,
  "sys_bp": 140,
  "temperature": 99.2,
  "admission_type": "EMERGENCY",
  "icu_capacity": 20,
  "icu_occupied": 18
}
```

Response:
```json
{
  "recommendation": "ICU Admission",
  "confidence": 0.87,
  "action_probabilities": {
    "Discharge": 0.05,
    "Ward Admission": 0.25,
    "ICU Admission": 0.87,
    "Specialist Referral": 0.13
  },
  "reasoning": "High-risk patient with elevated vitals...",
  "risk_score": 7.2,
  "expected_outcome": "Stable condition expected with ICU care"
}
```

#### Train Agent
```bash
POST /train
```

#### Get Metrics
```bash
GET /metrics
```

#### Provide Feedback
```bash
POST /feedback
```
```json
{
  "patient_id": "12345",
  "decision": "ICU Admission",
  "actual_outcome": "recovered",
  "was_correct": true
}
```

## Reward System

### Positive Rewards (+)
- **Correct Decision Match** (+10): Action matches optimal outcome
- **Resource Efficiency** (+5): Appropriate use of ICU/ward beds  
- **High-Risk Detection** (+5): Critical patients correctly sent to ICU
- **Emergency Priority** (+2): Quick action for emergency cases

### Negative Penalties (-)
- **Wrong Decision** (-10): Dangerous under/over-treatment
- **Resource Waste** (-5): Unnecessary ICU admission
- **Capacity Issues** (-5): ICU admission when at capacity
- **Delayed Care** (-3): Suboptimal timing

## Model Architecture

### Policy Network
```
Input (12) → Dense(128) → BatchNorm → ReLU → Dropout(0.1) →
Dense(128) → BatchNorm → ReLU → Dropout(0.1) →
Dense(128) → ReLU → Output(4) → Softmax
```

### Value Network
```
Input (12) → Dense(128) → BatchNorm → ReLU → Dropout(0.1) →
Dense(128) → BatchNorm → ReLU → Dropout(0.1) →
Dense(128) → ReLU → Output(1)
```

## State Features (12 dimensions)

1. **Age** (normalized 0-1)
2. **Diastolic BP** (normalized)
3. **Heart Rate** (normalized)
4. **Mean BP** (normalized)
5. **Respiratory Rate** (normalized)
6. **SpO2** (normalized)
7. **Systolic BP** (normalized)
8. **Temperature** (normalized)
9. **Gender** (0=M, 1=F)
10. **Admission Type** (0=Elective, 1=Emergency)
11. **ICU Utilization** (occupied/capacity)
12. **Ward Utilization** (occupied/capacity)

## Performance Metrics

- **Accuracy**: Percentage of correct decisions
- **Reward Score**: Cumulative reward over time
- **Loss**: Training loss (policy + value)
- **Episode Length**: Average decision time
- **Resource Utilization**: ICU/Ward efficiency

## Configuration

### Hyperparameters
- **Learning Rate**: 3e-4
- **Discount Factor (γ)**: 0.99
- **PPO Clip (ε)**: 0.2
- **Training Epochs**: 4 per update
- **Batch Size**: Dynamic based on episodes

### Environment Settings
- **ICU Capacity**: 20 beds
- **Ward Capacity**: 50 beds
- **ED Capacity**: 25 beds
- **Max Episode Steps**: 1 (single decision)

## Monitoring

The system provides real-time metrics:
- Training progress and accuracy
- Decision confidence scores
- Resource utilization rates
- Patient outcome tracking

## Production Deployment

1. **Train Production Model:**
```bash
python train_ppo_icu.py --epochs 5000
```

2. **Start Production Server:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

3. **Docker Deployment:**
```dockerfile
FROM python:3.9-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Security Considerations

- Input validation for all patient data
- Rate limiting on API endpoints
- Secure model file storage
- Audit logging for all decisions
- HIPAA compliance for patient data

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

MIT License - see LICENSE file for details.
