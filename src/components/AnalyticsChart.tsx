
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const trainingData = [
  { epoch: 1, reward: 45, accuracy: 72, loss: 0.8 },
  { epoch: 2, reward: 52, accuracy: 76, loss: 0.7 },
  { epoch: 3, reward: 58, accuracy: 81, loss: 0.6 },
  { epoch: 4, reward: 65, accuracy: 85, loss: 0.5 },
  { epoch: 5, reward: 71, accuracy: 88, loss: 0.4 },
  { epoch: 6, reward: 78, accuracy: 91, loss: 0.3 },
  { epoch: 7, reward: 82, accuracy: 93, loss: 0.25 },
  { epoch: 8, reward: 86, accuracy: 94, loss: 0.2 },
];

const admissionData = [
  { day: 'Mon', icu: 18, ward: 42, ed: 15 },
  { day: 'Tue', icu: 16, ward: 38, ed: 22 },
  { day: 'Wed', icu: 20, ward: 45, ed: 18 },
  { day: 'Thu', icu: 19, ward: 41, ed: 25 },
  { day: 'Fri', icu: 17, ward: 39, ed: 20 },
  { day: 'Sat', icu: 15, ward: 35, ed: 12 },
  { day: 'Sun', icu: 14, ward: 33, ed: 16 },
];

const AnalyticsChart = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>🧠 AI Model Training Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={2} name="Accuracy %" />
              <Line type="monotone" dataKey="reward" stroke="#dc2626" strokeWidth={2} name="Reward Score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Weekly Admission Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={admissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="icu" fill="#dc2626" name="ICU" />
              <Bar dataKey="ward" fill="#2563eb" name="Ward" />
              <Bar dataKey="ed" fill="#eab308" name="Emergency" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>📈 Model Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">94%</div>
              <div className="text-sm text-blue-800">Current Accuracy</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">86</div>
              <div className="text-sm text-green-800">Avg Reward Score</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">0.2</div>
              <div className="text-sm text-purple-800">Training Loss</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">1,247</div>
              <div className="text-sm text-orange-800">Patients Processed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsChart;
