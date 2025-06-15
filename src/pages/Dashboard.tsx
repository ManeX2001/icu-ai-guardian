
import React, { useState } from 'react';
import StatusCard from '../components/StatusCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [status, setStatus] = useState({
    icu: 17,
    ward: 42,
    ed: 23
  });
  
  const { toast } = useToast();

  const handleTrainAgent = () => {
    toast({
      title: "Training Started",
      description: "AI agent training has been initiated. Check analytics for progress.",
    });
  };

  const handleRefreshData = () => {
    // Simulate data refresh
    setStatus({
      icu: Math.floor(Math.random() * 20),
      ward: Math.floor(Math.random() * 50),
      ed: Math.floor(Math.random() * 30)
    });
    
    toast({
      title: "Data Refreshed",
      description: "Hospital status has been updated with latest information.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">🏥 ICU AI Control Dashboard</h1>
        <Button onClick={handleRefreshData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard
          title="ICU Status"
          current={status.icu}
          total={20}
          icon="❤️"
          color="red"
        />
        <StatusCard
          title="Ward Status"
          current={status.ward}
          total={50}
          icon="🛏️"
          color="blue"
        />
        <StatusCard
          title="Emergency Dept"
          current={status.ed}
          total={30}
          icon="🚑"
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🚀 AI Training Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Monitor and control the AI agent training process. Current model accuracy: 94%
            </p>
            <div className="flex gap-3">
              <Button onClick={handleTrainAgent} className="bg-green-600 hover:bg-green-700">
                Train Agent
              </Button>
              <Button variant="outline">
                View Metrics
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Patient #1247 admitted to ICU (AI Score: 87)</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Patient #1246 transferred to general ward</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Training epoch completed - 94% accuracy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Alerts */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">🚨 Emergency Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
              <span className="font-medium text-red-800">ICU capacity approaching maximum</span>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
