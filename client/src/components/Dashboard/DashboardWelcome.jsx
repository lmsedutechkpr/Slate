import { useAuth } from '../../hooks/useAuth.js';
import { GraduationCap } from 'lucide-react';

const DashboardWelcome = ({ stats = {} }) => {
  const { user } = useAuth();
  
  const {
    currentStreak = 0,
    totalXP = 0,
    completedCourses = 0
  } = stats;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.profile?.firstName || user?.username || 'Student';

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2" data-testid="welcome-title">
            {getGreeting()}, {userName}! 👋
          </h2>
          <p className="text-primary-100 mb-4">
            You're making great progress. Keep up the momentum!
          </p>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold" data-testid="streak-count">
                {currentStreak}
              </div>
              <div className="text-sm text-primary-200">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" data-testid="xp-count">
                {totalXP.toLocaleString()}
              </div>
              <div className="text-sm text-primary-200">XP Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" data-testid="completed-count">
                {completedCourses}
              </div>
              <div className="text-sm text-primary-200">Completed</div>
            </div>
          </div>
        </div>
        {/* Decorative background pattern */}
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10">
          <GraduationCap className="w-32 h-32" />
        </div>
      </div>
    </div>
  );
};

export default DashboardWelcome;
