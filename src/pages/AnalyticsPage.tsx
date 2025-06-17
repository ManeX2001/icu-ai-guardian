
import React, { useState } from 'react';
import AnalyticsChart from '../components/AnalyticsChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const AnalyticsPage = () => {
  const [isTraining, setIsTraining] = useState(false);
  const { toast } = useToast();

  const handleTrainAgent = () => {
    setIsTraining(true);
    toast({
      title: "Training Started",
      description: "AI agent training has begun. This may take several minutes.",
    });

    // Simulate training completion
    setTimeout(() => {
      setIsTraining(false);
      toast({
        title: "Training Complete",
        description: "AI agent training completed successfully. Model updated.",
      });
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">📈 ICU Analytics Dashboard</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🧠 Model Training Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Monitor training progress and view results for the ICU admission AI model.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={handleTrainAgent} 
              disabled={isTraining}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTraining ? "🔄 Training..." : "🚀 Train Agent"}
            </Button>
            {isTraining && (
              <div className="flex items-center text-green-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                Training in progress...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AnalyticsChart />
    </div>
  );
};

export default AnalyticsPage;
