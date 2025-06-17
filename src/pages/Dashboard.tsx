
import React, { useState, useEffect } from 'react';
import StatusCard from '../components/StatusCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ICUStatusService } from '../services/icuStatusService';
import { AITrainingService } from '../services/aiTrainingService';
import { Brain, RefreshCw, AlertTriangle, Info, TrendingUp, Clock } from 'lucide-react';

const Dashboard = () => {
  const [icuService] = useState(() => ICUStatusService.getInstance());
  const [aiService] = useState(() => AITrainingService.getInstance());
  const [status, setStatus] = useState(() => icuService.getCurrentStatus());
  const [alerts, setAlerts] = useState(() => icuService.getAlerts());
  const [trainingMetrics, setTrainingMetrics] = useState(() => aiService.getMetrics());
  const [recentRewards, setRecentRewards] = useState(() => aiService.getRecentRewards());
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(icuService.getCurrentStatus());
      setAlerts(icuService.getAlerts());
      setTrainingMetrics(aiService.getMetrics());
      setRecentRewards(aiService.getRecentRewards());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [icuService, aiService]);

  const handleTrainAgent = async () => {
    if (trainingMetrics.isTraining) return;

    toast({
      title: "AI Training Started",
      description: "Beginning new training epoch with recent patient data...",
    });

    try {
      await aiService.startTraining();
      setTrainingMetrics(aiService.getMetrics());
      setRecentRewards(aiService.getRecentRewards());
      
      toast({
        title: "Training Complete",
        description: `Epoch ${trainingMetrics.currentEpoch + 1} completed successfully!`,
      });
    } catch (error) {
      toast({
        title: "Training Error",
        description: "Failed to complete training epoch",
        variant: "destructive"
      });
    }
  };

  const handleRefreshData = () => {
    setStatus(icuService.refreshData());
    setAlerts(icuService.getAlerts());
    
    toast({
      title: "Data Refreshed",
      description: "Hospital status updated with latest information",
    });
  };

  const getStatusColor = (current: number, total: number) => {
    const percentage = (current / total) * 100;
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'blue';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ICU Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time hospital status and AI-powered patient management</p>
        </div>
        <Button onClick={handleRefreshData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard
          title="ICU Status"
          current={status.icu}
          total={status.icuTotal}
          icon="🏥"
          color={getStatusColor(status.icu, status.icuTotal)}
        />
        <StatusCard
          title="General Ward"
          current={status.ward}
          total={status.wardTotal}
          icon="🛏️"
          color={getStatusColor(status.ward, status.wardTotal)}
        />
        <StatusCard
          title="Emergency Dept"
          current={status.ed}
          total={status.edTotal}
          icon="🚑"
          color={getStatusColor(status.ed, status.edTotal)}
        />
      </div>

      {/* AI Training and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Training Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Current Epoch</div>
                <div className="text-xl font-bold text-blue-600">{trainingMetrics.currentEpoch}</div>
              </div>
              <div>
                <div className="text-gray-600">Accuracy</div>
                <div className="text-xl font-bold text-green-600">{trainingMetrics.accuracy.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-600">Patients Processed</div>
                <div className="text-xl font-bold text-purple-600">{trainingMetrics.patientsProcessed.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Reward Score</div>
                <div className="text-xl font-bold text-orange-600">{trainingMetrics.rewardScore.toFixed(0)}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Training Progress</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${trainingMetrics.trainingProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">{trainingMetrics.trainingProgress.toFixed(1)}% Complete</div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleTrainAgent} 
                disabled={trainingMetrics.isTraining}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                {trainingMetrics.isTraining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Training...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Start Training
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent AI Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentRewards.slice(0, 5).map((reward, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded border ${
                    reward.outcome === 'positive' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    reward.outcome === 'positive' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{reward.action}</div>
                    <div className="text-xs text-gray-600 truncate">{reward.reason}</div>
                  </div>
                  <div className={`text-sm font-bold ${
                    reward.outcome === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {reward.points > 0 ? '+' : ''}{reward.points}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Alerts */}
      {alerts.length > 0 && (
        <Card className={`border-2 ${
          alerts.some(a => a.type === 'critical') 
            ? 'border-red-500 bg-red-50' 
            : alerts.some(a => a.type === 'warning')
            ? 'border-yellow-500 bg-yellow-50'
            : 'border-blue-500 bg-blue-50'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{alert.title}</div>
                    <div className="text-sm text-gray-600">{alert.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
