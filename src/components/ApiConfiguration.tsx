
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiConfigurationProps {
  apiEndpoint: string;
  onEndpointChange: (endpoint: string) => void;
}

const ApiConfiguration = ({ apiEndpoint, onEndpointChange }: ApiConfigurationProps) => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🐍 Python PPO API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="apiEndpoint">Python API Endpoint</Label>
          <Input
            id="apiEndpoint"
            value={apiEndpoint}
            onChange={(e) => onEndpointChange(e.target.value)}
            placeholder="http://localhost:8000/api/admission-decision"
          />
          <div className="text-sm text-blue-600">
            Make sure your Python FastAPI server with trained PPO model is running on this endpoint.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiConfiguration;
