import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [notificationCount] = useState(3);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', role: 'student' },
    { name: 'Courses', href: '/courses', role: 'student' },
    { name: 'Assignments', href: '/assignments', role: 'student' },
    { name: 'Progress', href: '/progress', role: 'student' },
    { name: 'Store', href: '/store', role: 'student' },
    { name: 'Admin', href: '/admin', role: 'admin' },
    { name: 'Instructor', href: '/instructor', role: 'instructor' }
  ];

  const isActiveTab = (href) => {
    return location === href || location.startsWith(href + '/');
  };

  const getVisibleNavigation = () => {
    if (!user) return [];
    
    return navigation.filter(item => {
      if (user.role === 'admin') return true; // Admin can see everything
      return item.role === user.role;
    });
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold text-primary-800 cursor-pointer" data-testid="logo">
                  EduTech
                </h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {getVisibleNavigation().map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm transition-colors ${
                      isActiveTab(item.href)
                        ? 'border-b-3 border-primary-600 text-primary-700 font-semibold'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 rounded-full text-gray-400 hover:text-gray-500"
                data-testid="notifications-button"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center"
                    data-testid="notification-count"
                  >
                    {notificationCount}
                  </span>
                )}
              </Button>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2"
                    data-testid="user-menu-trigger"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {user?.profile?.firstName || user?.username || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/profile" 
                      className="flex items-center"
                      data-testid="link-profile"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/settings" 
                      className="flex items-center"
                      data-testid="link-settings"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center text-red-600"
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
