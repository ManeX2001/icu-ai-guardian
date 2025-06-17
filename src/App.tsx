import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import PPOTrainer from './components/PPOTrainer';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">ICU PPO Training System</h1>
        <PPOTrainer />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
