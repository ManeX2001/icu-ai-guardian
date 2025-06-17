
# ICU PPO Backend

Complete end-to-end Python backend for ICU decision making using Proximal Policy Optimization (PPO).

## Features

1. **Data Ingestion**: Loads ICU patient data with preprocessing and normalization
2. **Gym Environment**: ICU decision environment with 4 discrete actions
3. **PPO Agent**: PyTorch-based PPO implementation with policy and value networks
4. **Model Persistence**: Automatic checkpoint saving and loading
5. **FastAPI Service**: REST API for predictions and training
6. **Docker Support**: Containerized deployment

## Quick Start

### Local Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Setup directories and train initial model
python setup_and_train.py --train

# Start the API server
python main.py
```

### Docker Deployment

```bash
# Build the image
docker build -t icu-ppo-backend .

# Run the container
docker run -p 8000:8000 -v $(pwd)/models:/app/models icu-ppo-backend
```

## API Endpoints

### Health Check
```
GET /health
```

### Make Prediction
```
POST /predict
Content-Type: application/json

{
  "DiastolicBP": 70.0,
  "HeartRate": 80.0,
  "MeanBP": 85.0,
  "RespRate": 16.0,
  "SpO2": 98.0,
  "SysBP": 120.0,
  "Temperature": 98.6,
  "age": 65.0,
  "gender": "M",
  "admission_type": "EMERGENCY"
}
```

### Train Model
```
POST /train
Content-Type: application/json

{
  "epochs": 10
}
```

## Actions

- **0**: Discharge
- **1**: Ward Admission
- **2**: ICU Admission  
- **3**: Specialist Referral

## Training

```bash
# Train with custom parameters
python train_ppo_icu.py --epochs 500 --save-interval 50
```

## Architecture

- **PolicyNetwork**: Neural network for action selection
- **ValueNetwork**: Neural network for state value estimation
- **ICUEnv**: Gym-compatible environment for training
- **PPOAgent**: Complete PPO implementation with GAE
- **ICUDataLoader**: Data preprocessing and normalization

## Model Files

- `models/best_ppo_icu.pt`: Best performing model
- `models/final_ppo_icu.pt`: Final trained model
- `models/ppo_icu_epoch_*.pt`: Periodic checkpoints
