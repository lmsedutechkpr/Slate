import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Edit3, CheckCircle } from 'lucide-react';

const CircularProgress = ({ 
  current = 0, 
  goal = 15, 
  onGoalChange,
  unit = 'hours',
  label = 'Study Hours',
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal);

  const percentage = Math.min((current / goal) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleSaveGoal = () => {
    const newGoal = Number(editValue);
    if (!isNaN(newGoal) && newGoal > 0 && newGoal <= 100) {
      onGoalChange?.(newGoal);
      setIsEditing(false);
    }
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'text-green-500';
    if (percentage >= 75) return 'text-blue-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getProgressBgColor = () => {
    if (percentage >= 100) return 'stroke-green-200';
    if (percentage >= 75) return 'stroke-blue-200';
    if (percentage >= 50) return 'stroke-yellow-200';
    return 'stroke-gray-200';
  };

  return (
    <div className={`bg-white rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-600" />
          {label}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="h-8 w-8 p-0"
        >
          <Edit3 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className={`${getProgressBgColor()}`}
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={`${getProgressColor()} transition-all duration-500 ease-in-out`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-gray-900">
              {current.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">
              of {goal} {unit}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {Math.round(percentage)}%
            </div>
          </div>
        </div>
      </div>

      {/* Goal editing */}
      {isEditing && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Set goal"
            />
            <Button
              size="sm"
              onClick={handleSaveGoal}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Progress details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="font-semibold text-gray-900">
            {Math.max(0, goal - current).toFixed(1)}h
          </div>
          <div className="text-gray-600">Remaining</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="font-semibold text-gray-900">
            {percentage >= 100 ? '🎉' : Math.round(percentage)}%
          </div>
          <div className="text-gray-600">Complete</div>
        </div>
      </div>

      {/* Motivational message */}
      {percentage >= 100 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
          <div className="text-green-800 font-medium text-sm">
            🎉 Goal achieved! Great job!
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
