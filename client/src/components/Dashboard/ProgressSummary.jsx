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

  return (
    <div className="space-y-6">
      {/* Weekly Progress */}
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
          
          <Separator />
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Assignments</span>
              <span 
                className="text-sm font-medium"
                data-testid="assignment-completion"
              >
                {completedAssignments}/{totalAssignments} Complete
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Quiz Score</span>
              <span 
                className="text-sm font-medium text-green-600"
                data-testid="quiz-score"
              >
                {averageQuizScore}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-lg">🏆</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Week Warrior</div>
              <div className="text-xs text-gray-500">7 days streak</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">⭐</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Quiz Master</div>
              <div className="text-xs text-gray-500">Perfect score achieved</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressSummary;
