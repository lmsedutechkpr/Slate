import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  BookOpen,
  Users,
  FileText,
  Video,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Home,
  Menu,
  X,
  MessageSquare,
  Folder,
  Award,
  Target,
  Activity,
  Calendar,
  Bot,
  Shield
} from 'lucide-react';

const InstructorLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigationItems = [
    { title: 'Dashboard', href: '/instructor', icon: Home, description: 'Teaching overview' },
    { title: 'Course Content', href: '/instructor/courses', icon: BookOpen, description: 'Manage course materials' },
    { title: 'Content Management', href: '/instructor/content', icon: Folder, description: 'Upload & organize files' },
    { title: 'Grade Assignments', href: '/instructor/assignments', icon: FileText, description: 'Grade & evaluate' },
    { title: 'Gradebook', href: '/instructor/gradebook', icon: Award, description: 'Student grades & progress' },
    { title: 'Attendance', href: '/instructor/attendance', icon: Users, description: 'Track student attendance' },
    { title: 'Live Sessions', href: '/instructor/live-sessions', icon: Video, description: 'Conduct live classes' },
    { title: 'Quiz Builder', href: '/instructor/quizzes', icon: Target, description: 'Create interactive quizzes' },
    { title: 'Calendar', href: '/instructor/calendar', icon: Calendar, description: 'Schedule & manage events' },
    { title: 'AI Assistant', href: '/instructor/ai-assistant', icon: Bot, description: 'AI-powered teaching help' },
    { title: 'Plagiarism Check', href: '/instructor/plagiarism', icon: Shield, description: 'Detect academic dishonesty' },
    { title: 'Track Students', href: '/instructor/students', icon: Users, description: 'Monitor progress' },
    { title: 'Communication', href: '/instructor/communication', icon: MessageSquare, description: 'Messages & announcements' },
    { title: 'Notifications', href: '/instructor/notifications', icon: Bell, description: 'Manage alerts & notifications' },
    { title: 'Reports', href: '/instructor/reports', icon: BarChart3, description: 'Generate reports & analytics' },
    { title: 'Analytics', href: '/instructor/analytics', icon: Activity, description: 'Teaching insights' },
    { title: 'Settings', href: '/instructor/settings', icon: Settings, description: 'Account settings' }
  ];

  const currentPath = location;

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const handleNavigation = (href) => {
    setLocation(href);
    closeMobileSidebar();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Instructor Portal</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeMobileSidebar}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User Profile Section */}
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center space-x-3 w-full text-left">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{(user?.profile?.firstName || user?.username || 'I').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.profile?.firstName || user?.username || 'Instructor'}</p>
                  <Badge variant="secondary" className="text-xs">Instructor</Badge>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="text-sm">
                <div className="font-medium">{user?.profile?.firstName || user?.username || 'Instructor'}</div>
                <div className="text-gray-500 mb-3">{user?.email || ''}</div>
                <Button variant="outline" size="sm" className="w-full rounded-md text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = currentPath === item.href;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={`
                  w-full justify-start h-auto py-3 px-3 text-left
                  ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}
                `}
                onClick={() => handleNavigation(item.href)}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.title}</div>
                  <div className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 lg:px-4 py-4 border-t border-gray-200 text-xs text-gray-500">© EduTech</div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200 px-3 py-3 lg:px-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 lg:space-x-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileSidebar}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="font-medium text-gray-900">Instructor Portal</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="hidden md:flex items-center space-x-2 text-xs lg:text-sm text-gray-600">
                <span>Last login:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-3 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default InstructorLayout;
