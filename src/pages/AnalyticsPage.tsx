
import React, { useState, useEffect } from 'react';
import AnalyticsChart from '../components/AnalyticsChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AITrainingService } from '../services/aiTrainingService';
import { Brain, BookOpen, Award, AlertCircle } from 'lucide-react';

const AnalyticsPage = () => {
  const [aiService] = useState(() => AITrainingService.getInstance());
  const [trainingMetrics, setTrainingMetrics] = useState(() => aiService.getMetrics());
  const [recentRewards, setRecentRewards] = useState(() => aiService.getRecentRewards());
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingMetrics(aiService.getMetrics());
      setRecentRewards(aiService.getRecentRewards());
    }, 5000);

    return () => clearInterval(interval);
  }, [aiService]);

  const handleTrainAgent = async () => {
    if (trainingMetrics.isTraining) return;

    toast({
      title: "Training Started",
      description: "AI agent training has begun. This will process recent patient cases.",
    });

    try {
      await aiService.startTraining();
      setTrainingMetrics(aiService.getMetrics());
      setRecentRewards(aiService.getRecentRewards());
      
      toast({
        title: "Training Complete",
        description: "AI agent training completed successfully. Model updated with new patterns.",
      });
    } catch (error) {
      toast({
        title: "Training Error",
        description: "Failed to complete training. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor AI performance and training progress</p>
        </div>
      </div>

      {/* Training Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Training Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {trainingMetrics.currentEpoch}
              </div>
              <div className="text-sm text-gray-600">Current Epoch</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${trainingMetrics.trainingProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {trainingMetrics.trainingProgress.toFixed(1)}% of {trainingMetrics.totalEpochs} epochs
              </div>
            </div>

            <Button 
              onClick={handleTrainAgent} 
              disabled={trainingMetrics.isTraining}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {trainingMetrics.isTraining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Training...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Start Training Epoch
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {trainingMetrics.accuracy.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {trainingMetrics.rewardScore.toFixed(0)}
                </div>
                <div className="text-xs text-gray-600">Reward Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {trainingMetrics.patientsProcessed.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Patients</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {trainingMetrics.correctDecisions.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Correct</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Recent Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {recentRewards.slice(0, 4).map((reward, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded text-xs ${
                    reward.outcome === 'positive' 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    reward.outcome === 'positive' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1 truncate">{reward.action}</div>
                  <div className="font-bold">
                    {reward.points > 0 ? '+' : ''}{reward.points}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Explanation */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How AI Training Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="mb-4">
              Our AI system uses <strong>Proximal Policy Optimization (PPO)</strong>, a state-of-the-art reinforcement learning algorithm 
              specifically designed for healthcare decision-making.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🎯 Training Process</h4>
                <ul className="text-sm space-y-1">
                  <li>• Each patient decision generates feedback based on actual outcomes</li>
                  <li>• Positive rewards for correct admissions and optimal resource use</li>
                  <li>• Penalties for incorrect predictions or resource waste</li>
                  <li>• Model learns from patterns in successful decisions</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📊 Reward System</h4>
                <ul className="text-sm space-y-1">
                  <li>• <span className="text-green-600">+5 to +20 points:</span> Correct admission decisions</li>
                  <li>• <span className="text-green-600">+10 to +15 points:</span> Optimal resource utilization</li>
                  <li>• <span className="text-red-600">-3 to -10 points:</span> Incorrect predictions</li>
                  <li>• <span className="text-red-600">-5 to -8 points:</span> Delayed or inappropriate care</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">📚 What is an Epoch?</h4>
              <p className="text-sm text-blue-700">
                An epoch represents one complete training cycle where the AI processes a batch of patient cases 
                (typically 100-200 patients) and updates its decision-making policy. During each epoch, the model:
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Analyzes patient outcomes from recent decisions</li>
                <li>• Adjusts its neural network weights based on rewards/penalties</li>
                <li>• Improves pattern recognition for similar future cases</li>
                <li>• Updates confidence levels for different types of decisions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnalyticsChart />
    </div>
  );
};

export default AnalyticsPage;
