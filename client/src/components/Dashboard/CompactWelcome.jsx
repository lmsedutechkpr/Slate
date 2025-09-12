import { useAuth } from '../../hooks/useAuth.js';
import { Badge } from '@/components/ui/badge';
import AnimatedCounter from './AnimatedCounter.jsx';
import { TrendingUp, Zap, Award } from 'lucide-react';

const CompactWelcome = ({ stats = {} }) => {
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

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to learn something amazing today?",
      "Your learning journey continues!",
      "Every step forward is progress.",
      "Keep up the great work!",
      "Learning never stops!",
      "You're doing fantastic!"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-xl p-4 text-white mb-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        {/* Greeting and message */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold">
              {getGreeting()}, {userName}! 👋
            </h2>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Zap className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <p className="text-primary-100 text-sm">
            {getMotivationalMessage()}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-primary-200" />
              <AnimatedCounter 
                value={currentStreak} 
                className="text-lg font-bold text-white"
                duration={1500}
              />
            </div>
            <div className="text-xs text-primary-200">Day Streak</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center gap-1 mb-1">
              <Award className="w-4 h-4 text-primary-200" />
              <AnimatedCounter 
                value={totalXP} 
                className="text-lg font-bold text-white"
                duration={2000}
              />
            </div>
            <div className="text-xs text-primary-200">XP Points</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-4 h-4 rounded-full bg-primary-200 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-800">✓</span>
              </div>
              <AnimatedCounter 
                value={completedCourses} 
                className="text-lg font-bold text-white"
                duration={1000}
              />
            </div>
            <div className="text-xs text-primary-200">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactWelcome;
