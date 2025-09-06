import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Search, 
  Filter, 
  CheckCircle2, 
  Trash2, 
  Archive, 
  Star, 
  StarOff,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Calendar,
  User,
  Mail,
  MessageSquare,
  FileText,
  Video,
  Award,
  Target,
  BarChart3,
  Activity,
  Download,
  Upload,
  Plus,
  Edit,
  Save,
  X
} from 'lucide-react';

const NotificationCenter = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    assignments: true,
    messages: true,
    announcements: true,
    attendance: true,
    grades: true,
    system: false
  });

  // Fetch notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['instructor-notifications', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/notifications'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 10000
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds) => {
      const response = await fetch(buildApiUrl('/api/instructor/notifications/mark-read'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ notificationIds })
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notifications Marked as Read",
        description: "Selected notifications have been marked as read.",
      });
      queryClient.invalidateQueries(['instructor-notifications']);
      setSelectedNotifications([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete notifications mutation
  const deleteNotificationsMutation = useMutation({
    mutationFn: async (notificationIds) => {
      const response = await fetch(buildApiUrl('/api/instructor/notifications/delete'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ notificationIds })
      });

      if (!response.ok) {
        throw new Error('Failed to delete notifications');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notifications Deleted",
        description: "Selected notifications have been deleted.",
      });
      queryClient.invalidateQueries(['instructor-notifications']);
      setSelectedNotifications([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => {
      const response = await fetch(buildApiUrl('/api/instructor/notification-settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Notification settings have been updated successfully.",
      });
      setIsSettingsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleMarkAsRead = (notificationIds) => {
    markAsReadMutation.mutate(notificationIds);
  };

  const handleDeleteNotifications = (notificationIds) => {
    deleteNotificationsMutation.mutate(notificationIds);
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredNotifications().map(n => n._id);
    setSelectedNotifications(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedNotifications([]);
  };

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate(notificationSettings);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'announcement': return <Bell className="w-5 h-5 text-orange-500" />;
      case 'attendance': return <User className="w-5 h-5 text-purple-500" />;
      case 'grade': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'system': return <Settings className="w-5 h-5 text-gray-500" />;
      case 'live-session': return <Video className="w-5 h-5 text-red-500" />;
      case 'quiz': return <Target className="w-5 h-5 text-indigo-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'assignment': return 'bg-blue-100 text-blue-800';
      case 'message': return 'bg-green-100 text-green-800';
      case 'announcement': return 'bg-orange-100 text-orange-800';
      case 'attendance': return 'bg-purple-100 text-purple-800';
      case 'grade': return 'bg-yellow-100 text-yellow-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'live-session': return 'bg-red-100 text-red-800';
      case 'quiz': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredNotifications = () => {
    let notifications = notificationsData?.notifications || [];
    
    if (searchQuery) {
      notifications = notifications.filter(notification => 
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      notifications = notifications.filter(notification => notification.type === filterType);
    }
    
    if (filterStatus !== 'all') {
      notifications = notifications.filter(notification => 
        filterStatus === 'read' ? notification.read : !notification.read
      );
    }
    
    return notifications;
  };

  const notifications = filteredNotifications();
  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600">Manage your notifications and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <BellOff className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => 
                    new Date(n.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="assignment">Assignments</SelectItem>
            <SelectItem value="message">Messages</SelectItem>
            <SelectItem value="announcement">Announcements</SelectItem>
            <SelectItem value="attendance">Attendance</SelectItem>
            <SelectItem value="grade">Grades</SelectItem>
            <SelectItem value="live-session">Live Sessions</SelectItem>
            <SelectItem value="quiz">Quizzes</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">
                  {selectedNotifications.length} notifications selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsRead(selectedNotifications)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Mark as Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteNotifications(selectedNotifications)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeselectAll}
                >
                  <X className="w-4 h-4 mr-1" />
                  Deselect All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications ({notifications.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkAsRead(notifications.map(n => n._id))}
              >
                Mark All as Read
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.read ? 'bg-gray-50' : 'bg-white border-blue-200'
                  } ${selectedNotifications.includes(notification._id) ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedNotifications.includes(notification._id)}
                      onCheckedChange={() => handleSelectNotification(notification._id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              <Badge className={getNotificationColor(notification.type)}>
                                {notification.type}
                              </Badge>
                              {notification.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">
                                  High Priority
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {notification.courseTitle && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {notification.courseTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead([notification._id])}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteNotifications([notification._id])}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Configure how you receive notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Delivery Methods</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Checkbox
                    id="email"
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push">Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                  </div>
                  <Checkbox
                    id="push"
                    checked={notificationSettings.push}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, push: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms">SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                  </div>
                  <Checkbox
                    id="sms"
                    checked={notificationSettings.sms}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, sms: checked }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-4">Notification Types</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="assignments">Assignment Notifications</Label>
                    <p className="text-sm text-gray-500">New assignments, submissions, and grading</p>
                  </div>
                  <Checkbox
                    id="assignments"
                    checked={notificationSettings.assignments}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, assignments: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="messages">Message Notifications</Label>
                    <p className="text-sm text-gray-500">Student messages and communications</p>
                  </div>
                  <Checkbox
                    id="messages"
                    checked={notificationSettings.messages}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, messages: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="announcements">Announcement Notifications</Label>
                    <p className="text-sm text-gray-500">Course announcements and updates</p>
                  </div>
                  <Checkbox
                    id="announcements"
                    checked={notificationSettings.announcements}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, announcements: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="attendance">Attendance Notifications</Label>
                    <p className="text-sm text-gray-500">Attendance updates and alerts</p>
                  </div>
                  <Checkbox
                    id="attendance"
                    checked={notificationSettings.attendance}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, attendance: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="grades">Grade Notifications</Label>
                    <p className="text-sm text-gray-500">Grade updates and feedback</p>
                  </div>
                  <Checkbox
                    id="grades"
                    checked={notificationSettings.grades}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, grades: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system">System Notifications</Label>
                    <p className="text-sm text-gray-500">System updates and maintenance</p>
                  </div>
                  <Checkbox
                    id="system"
                    checked={notificationSettings.system}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, system: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;
