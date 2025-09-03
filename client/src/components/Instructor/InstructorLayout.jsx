import { useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
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
    { 
      name: 'Dashboard', 
      href: '/instructor', 
      icon: Home,
      description: 'Dashboard overview'
    },
    { 
      name: 'Courses', 
      href: '/instructor/courses', 
      icon: BookOpen,
      description: 'Manage courses'
    },
    { 
      name: 'Assignments', 
      href: '/instructor/assignments', 
      icon: FileText,
      description: 'Manage assignments'
    },
    { 
      name: 'Live Sessions', 
      href: '/instructor/live', 
      icon: Video,
      description: 'Live streaming'
    },
    { 
      name: 'Students', 
      href: '/instructor/students', 
      icon: Users,
      description: 'Student management'
    },
    { 
      name: 'Analytics', 
      href: '/instructor/analytics', 
      icon: BarChart3,
      description: 'Reports & insights'
    },
    { 
      name: 'Settings', 
      href: '/instructor/settings', 
      icon: Settings,
      description: 'Account settings'
    },
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
        fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center h-16 px-6 border-b border-blue-800">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-900 font-bold text-lg">I</span>
          </div>
          <h1 className="text-xl font-bold text-white">Instructor Portal</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-white hover:bg-blue-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Profile */}
        <div className="px-6 py-6 border-b border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-sm">
                {user?.profile?.firstName?.[0] || user?.username?.[0] || 'I'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {user?.profile?.firstName} {user?.profile?.lastName}
              </p>
              <p className="text-xs text-blue-200">Instructor</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant={isActive(item.href) ? "default" : "ghost"}
                className={`w-full justify-start h-12 px-4 ${
                  isActive(item.href) 
                    ? 'bg-blue-700 text-white shadow-sm' 
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
                onClick={() => {
                  setLocation(item.href);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-blue-800">
          <p className="text-xs text-blue-300 text-center">© EduTech</p>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
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
            <div className="w-10" />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default InstructorLayout;
