import { useState, useEffect } from 'react';
import { subscribe } from '../../lib/realtime.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  BookOpen, 
  Video, 
  Calendar, 
  Award,
  ShoppingBag,
  CheckCircle
} from 'lucide-react';

const LiveNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    let unsubs = [];
    
    (async () => {
      // Listen for various real-time events
      const events = [
        'assignment:graded',
        'assignment:created',
        'live-session:scheduled',
        'live-session:started',
        'course:completed',
        'xp:earned',
        'product:recommended'
      ];

      for (const event of events) {
        const unsub = await subscribe(event, (data) => {
          const notification = createNotification(event, data);
          setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
          setHasNewNotifications(true);
        });
        unsubs.push(unsub);
      }
    })();

    return () => {
      unsubs.forEach(unsub => {
        try { unsub(); } catch {}
      });
    };
  }, []);

  const createNotification = (event, data) => {
    const now = new Date();
    const id = `${event}-${now.getTime()}`;
    
    const notificationMap = {
      'assignment:graded': {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'Assignment Graded',
        message: `Your assignment "${data?.assignmentTitle || 'Assignment'}" has been graded`,
        type: 'success'
      },
      'assignment:created': {
        icon: Calendar,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        title: 'New Assignment',
        message: `New assignment added to "${data?.courseTitle || 'your course'}"`,
        type: 'info'
      },
      'live-session:scheduled': {
        icon: Video,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        title: 'Live Session Scheduled',
        message: `"${data?.sessionTitle || 'Live Session'}" starts at ${formatTime(data?.startTime)}`,
        type: 'info'
      },
      'live-session:started': {
        icon: Video,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        title: 'Live Now!',
        message: `"${data?.sessionTitle || 'Live Session'}" is happening now`,
        type: 'urgent'
      },
      'course:completed': {
        icon: Award,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        title: 'Course Completed!',
        message: `Congratulations! You've completed "${data?.courseTitle || 'the course'}"`,
        type: 'success'
      },
      'xp:earned': {
        icon: Award,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        title: 'XP Earned',
        message: `+${data?.xp || 0} XP points earned!`,
        type: 'success'
      },
      'product:recommended': {
        icon: ShoppingBag,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'New Recommendation',
        message: `Check out this recommended product for your courses`,
        type: 'info'
      }
    };

    const config = notificationMap[event] || {
      icon: Bell,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      title: 'Notification',
      message: 'You have a new notification',
      type: 'info'
    };

    return {
      id,
      ...config,
      timestamp: now,
      read: false
    };
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'soon';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasNewNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen);
          if (hasNewNotifications) {
            setHasNewNotifications(false);
          }
        }}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notification.bgColor}`}>
                        <Icon className={`w-4 h-4 ${notification.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LiveNotifications;
