
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PythonSetupInstructions = () => {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle>🛠️ Python PPO Setup Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-2">
          <p><strong>1. Install Dependencies:</strong></p>
          <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
            pip install fastapi uvicorn stable-baselines3 gymnasium pandas numpy
          </code>
          
          <p><strong>2. Train PPO Model:</strong></p>
          <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
            python train_ppo_icu.py --data mimic_admissions.csv --epochs 1000
          </code>
          
          <p><strong>3. Start API Server:</strong></p>
          <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
            uvicorn main:app --host 0.0.0.0 --port 8000 --reload
          </code>
          
          <p className="text-blue-700">
            The API will use your trained PPO model to make real admission decisions based on patient data and hospital state.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PythonSetupInstructions;
