
import React from 'react';

interface StatusCardProps {
  title: string;
  current: number;
  total: number;
  icon: string;
  color: 'red' | 'blue' | 'yellow';
}

const StatusCard = ({ title, current, total, icon, color }: StatusCardProps) => {
  const percentage = (current / total) * 100;
  
  const getColorClasses = () => {
    switch (color) {
      case 'red':
        return 'bg-red-500';
      case 'blue':
        return 'bg-blue-500';
      case 'yellow':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{icon} {title}</h3>
      </div>
      <div className="mb-3">
        <span className="text-2xl font-bold text-gray-900">{current}/{total}</span>
        <span className="text-gray-600 ml-2">Occupied</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-300 ${getColorClasses()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {percentage.toFixed(1)}% capacity
      </div>
    </div>
  );
};

export default StatusCard;
