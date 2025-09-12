import { useEffect, useState } from 'react';
import { CheckCircle, Star, TrendingUp, Users } from 'lucide-react';

const LiveUpdateToast = ({ update, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (update.type) {
      case 'enrollment':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'review':
        return <Star className="w-4 h-4 text-yellow-600" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getMessage = () => {
    switch (update.type) {
      case 'enrollment':
        return `${update.count} students enrolled`;
      case 'review':
        return `New review: ${update.rating.toFixed(1)}★`;
      case 'trending':
        return 'Course is trending!';
      default:
        return 'Course updated';
    }
  };

  const getBgColor = () => {
    switch (update.type) {
      case 'enrollment':
        return 'bg-green-50 border-green-200';
      case 'review':
        return 'bg-yellow-50 border-yellow-200';
      case 'trending':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg border shadow-lg transition-all duration-300 ${getBgColor()}`}>
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span className="text-sm font-medium text-gray-900">
          {getMessage()}
        </span>
      </div>
    </div>
  );
};

export default LiveUpdateToast;
