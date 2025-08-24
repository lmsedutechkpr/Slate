import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  ShoppingCart, 
  User, 
  Settings, 
  Users,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = {
    student: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Courses', href: '/courses', icon: BookOpen },
      { name: 'Assignments', href: '/assignments', icon: FileText },
      { name: 'Progress', href: '/progress', icon: TrendingUp },
      { name: 'Store', href: '/store', icon: ShoppingCart },
    ],
    instructor: [
      { name: 'Dashboard', href: '/instructor', icon: Home },
      { name: 'My Courses', href: '/instructor/courses', icon: BookOpen },
      { name: 'Live Sessions', href: '/instructor/live', icon: Calendar },
      { name: 'Assignments', href: '/instructor/assignments', icon: FileText },
      { name: 'Students', href: '/instructor/students', icon: Users },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin', icon: Home },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Courses', href: '/admin/courses', icon: BookOpen },
      { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  };

  const getVisibleNavigation = () => {
    if (!user) return [];
    return navigation[user.role] || navigation.student;
  };

  const isActiveLink = (href) => {
    return location === href || location.startsWith(href + '/');
  };

  const visibleNavigation = getVisibleNavigation();

  return (
    <div className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Collapse Button */}
      <div className="flex justify-end p-2 border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
          data-testid="sidebar-collapse-button"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveLink(item.href);
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary-100 text-primary-700 border-r-2 border-primary-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                      isCollapsed && "justify-center px-2"
                    )}
                    data-testid={`sidebar-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile Section */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.profile?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.profile?.firstName || user?.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          
          <div className="mt-3 flex space-x-2">
            <Link href="/profile" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <User className="h-3 w-3 mr-1" />
                Profile
              </Button>
            </Link>
            <Link href="/settings" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
