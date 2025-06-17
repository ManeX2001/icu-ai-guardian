
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Brain, Stethoscope, TrendingUp } from 'lucide-react';

const InstructionsCard = () => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Info className="h-5 w-5" />
          Patient Assessment Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <Stethoscope className="h-4 w-4" />
              Real Patient Data
            </div>
            <p className="text-sm text-gray-700">
              Select from real ICU patient records with actual vitals and outcomes. 
              The system will automatically calculate severity scores based on medical parameters.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <Brain className="h-4 w-4" />
              AI Assessment
            </div>
            <p className="text-sm text-gray-700">
              Our AI analyzes patient data, hospital capacity, and historical outcomes 
              to provide evidence-based admission recommendations with confidence scores.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-700 font-medium">
              <TrendingUp className="h-4 w-4" />
              Continuous Learning
            </div>
            <p className="text-sm text-gray-700">
              Each decision feeds back into the AI training system, improving 
              accuracy and helping the model learn from real medical outcomes.
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">How to Use:</h4>
          <ol className="text-sm text-gray-700 space-y-1">
            <li><strong>1.</strong> Select a real patient from the database or enter manual data</li>
            <li><strong>2.</strong> Adjust decision priorities based on current hospital conditions</li>
            <li><strong>3.</strong> Click "Get AI Recommendation" to receive analysis</li>
            <li><strong>4.</strong> Review the recommendation and confidence level</li>
            <li><strong>5.</strong> Accept or modify based on clinical judgment</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstructionsCard;
