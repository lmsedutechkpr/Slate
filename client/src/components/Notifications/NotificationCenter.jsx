import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Check, 
  X, 
  MessageSquare, 
  Calendar, 
  BookOpen, 
  Award,
  AlertCircle,
  Info,
  Star,
  Zap,
  Clock
} from 'lucide-react';

const NotificationCenter = ({ isOpen, onClose, onNotificationClick }) => {
  const { user, accessToken, authenticatedFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const wsRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, refetch, isFetching } = useQuery({
    queryKey: ['/api/notifications', accessToken, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const response = await authenticatedFetch(buildApiUrl(`/api/notifications?${params.toString()}`));
      if (!response.ok) return { notifications: [], pagination: { page: 1, pages: 1, total: 0 } };
      return response.json();
    },
    enabled: !!accessToken && isOpen,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    keepPreviousData: true,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await authenticatedFetch(buildApiUrl(`/api/notifications/${notificationId}/read`), {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      if (onNotificationClick) onNotificationClick();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/notifications/read-all'), {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      if (onNotificationClick) onNotificationClick();
    },
  });

  // Initialize WebSocket connection for real-time notifications
  useEffect(() => {
    if (!accessToken || !isOpen) return;

    const wsUrl = buildApiUrl('/ws/notifications').replace('http', 'ws');
    wsRef.current = new WebSocket(`${wsUrl}?token=${accessToken}`);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected for notifications');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          // Add new notification to the list
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(data.notification.title, {
              body: data.notification.message,
              icon: '/favicon.ico',
              tag: 'slate-notification',
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [accessToken, isOpen]);

  // Update notifications when data changes
  useEffect(() => {
    if (notificationsData?.notifications) {
      if (page === 1) setNotifications(notificationsData.notifications);
      else setNotifications(prev => [...prev, ...notificationsData.notifications]);
      setUnreadCount((notificationsData.unreadCount != null) ? notificationsData.unreadCount : (notificationsData.notifications.filter(n => !n.read).length));
      const pages = notificationsData?.pagination?.pages || 1;
      setHasMore(page < pages);
    }
  }, [notificationsData]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <BookOpen className="w-4 h-4" />;
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'achievement':
        return <Award className="w-4 h-4" />;
      case 'reminder':
        return <Clock className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4" />;
      case 'live':
        return <Zap className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'course':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'achievement':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'reminder':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'message':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'alert':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'live':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  const loadMore = () => {
    if (!isFetching && hasMore) setPage(p => p + 1);
  };

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationAction = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      <Card className="w-96 max-h-[80vh] shadow-xl border-0">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-primary-600" />
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isLoading}
                  className="h-8 w-8 p-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-1">We'll notify you when something important happens</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      notification.read ? 'bg-white' : 'bg-blue-50/50'
                    }`}
                    onClick={() => handleNotificationAction(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2 ml-2">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.actionUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 p-0 h-auto text-primary-600 hover:text-primary-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = notification.actionUrl;
                            }}
                          >
                            View Details →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;

