import { Link, useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Home, BookOpen, FileText, TrendingUp, ShoppingCart, Settings, Users } from 'lucide-react';

const MobileBottomNav = () => {
  const { user } = useAuth();
  const [location] = useLocation();

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = {
      student: [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: BookOpen, label: 'Courses', path: '/courses' },
        { icon: FileText, label: 'Assignments', path: '/assignments' },
        { icon: TrendingUp, label: 'Progress', path: '/progress' },
        { icon: ShoppingCart, label: 'Store', path: '/store' }
      ],
      instructor: [
        { icon: Home, label: 'Dashboard', path: '/instructor' },
        { icon: BookOpen, label: 'My Courses', path: '/instructor/courses' },
        { icon: FileText, label: 'Assignments', path: '/instructor/assignments' },
        { icon: Users, label: 'Students', path: '/instructor/students' },
        { icon: Settings, label: 'Settings', path: '/instructor/settings' }
      ],
      admin: [
        { icon: Home, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
        { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' }
      ]
    };

    return baseItems[user.role] || baseItems.student;
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => {
    if (path === '/dashboard' && (location === '/' || location === '/dashboard')) {
      return true;
    }
    return location === path || location.startsWith(path + '/');
  };

  if (navigationItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link key={item.path} href={item.path}>
              <div 
                className={`flex flex-col items-center p-2 transition-colors ${
                  active ? 'text-primary-600' : 'text-gray-400'
                }`}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
