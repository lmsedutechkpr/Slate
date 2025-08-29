import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Bell, ChevronDown, User, LogOut, Settings, Menu, X, BarChart3, Users, BookOpen, Shield } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', role: 'student' },
    { name: 'Courses', href: '/courses', role: 'student' },
    { name: 'Assignments', href: '/assignments', role: 'student' },
    { name: 'Progress', href: '/progress', role: 'student' },
    { name: 'Store', href: '/store', role: 'student' },
    { name: 'Admin Dashboard', href: '/admin', role: 'admin' },
    { name: 'Instructor Dashboard', href: '/instructor', role: 'instructor' }
  ];

  const isActiveTab = (href) => {
    return location === href || location.startsWith(href + '/');
  };

  const getVisibleNavigation = () => {
    if (!user) return [];
    
    return navigation.filter(item => item.role === user.role);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/dashboard">
                <h1 className="text-xl sm:text-2xl font-bold text-primary-800 cursor-pointer" data-testid="logo">
                  EduTech
                </h1>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:block ml-10">
              <div className="flex items-baseline space-x-4">
                {getVisibleNavigation().map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm transition-colors rounded-md ${
                      isActiveTab(item.href)
                        ? 'bg-primary-100 text-primary-700 font-semibold'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right side - Notifications, User Menu, Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Notifications - Hidden on small screens */}
            <div className="hidden sm:block relative">
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
            
            {/* User Menu - Hidden on small screens */}
            <div className="hidden sm:flex items-center space-x-3">
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
                    <span className="text-sm font-medium text-gray-700">
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

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Navigation Links */}
              {getVisibleNavigation().map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActiveTab(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  data-testid={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile User Info and Actions */}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-3 py-2">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user?.profile?.firstName && user?.profile?.lastName
                        ? `${user?.profile?.firstName} ${user?.profile?.lastName}`
                        : user?.username || 'User'
                      }
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {user?.role || 'User'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
