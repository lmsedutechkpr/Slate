import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const ProgressSummary = ({ stats = {} }) => {
  const {
    weeklyHours = 0,
    weeklyGoal = 15,
    completedAssignments = 0,
    totalAssignments = 0,
    averageQuizScore = 0
  } = stats;

  const weeklyProgress = Math.min((weeklyHours / weeklyGoal) * 100, 100);

  if (!weeklyHours && !completedAssignments && !averageQuizScore) return null;
  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Study Hours</span>
          <span className="font-semibold text-gray-900" data-testid="weekly-hours">
            {weeklyHours}h
          </span>
        </div>
        <Progress 
          value={weeklyProgress} 
          className="progress-animate"
          data-testid="weekly-progress"
        />
        <div className="text-xs text-gray-500">
          Goal: {weeklyGoal}h per week
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressSummary;
