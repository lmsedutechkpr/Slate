import { useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Users, 
  Settings, 
  BarChart3, 
  Home,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const InstructorLayout = ({ children }) => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/instructor', icon: Home },
    { name: 'Courses', href: '/instructor/courses', icon: BookOpen },
    { name: 'Assignments', href: '/instructor/assignments', icon: FileText },
    { name: 'Live Sessions', href: '/instructor/live', icon: Video },
    { name: 'Students', href: '/instructor/students', icon: Users },
    { name: 'Analytics', href: '/instructor/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/instructor/settings', icon: Settings },
  ];

  const isActive = (href) => {
    if (href === '/instructor') {
      return location === '/instructor';
    }
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Instructor Portal</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-4 py-6">
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-lg">
                  {user?.profile?.firstName?.[0] || user?.username?.[0] || 'I'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500">Instructor</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={`w-full justify-start h-11 ${isActive(item.href) ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                  onClick={() => {
                    setLocation(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Instructor Portal</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 px-6 lg:px-8 pb-6 lg:pb-8 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default InstructorLayout;
