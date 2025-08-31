import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Bell, ChevronDown, User, LogOut, Settings, Menu, X, BookOpen, Home, FileText, TrendingUp, ShoppingBag, BarChart3, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationCenter from '../Notifications/NotificationCenter.jsx';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', role: 'student', icon: Home },
    { name: 'Courses', href: '/courses', role: 'student', icon: BookOpen },
    { name: 'Assignments', href: '/assignments', role: 'student', icon: FileText },
    { name: 'Progress', href: '/progress', role: 'student', icon: TrendingUp },
    { name: 'Store', href: '/store', role: 'student', icon: ShoppingBag },
    { name: 'Admin Dashboard', href: '/admin', role: 'admin', icon: Shield },
    { name: 'Instructor Dashboard', href: '/instructor', role: 'instructor', icon: Users }
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

  const handleNotificationClick = () => {
    setNotificationCenterOpen(true);
  };

  const handleNotificationCenterClose = () => {
    setNotificationCenterOpen(false);
  };

  const handleNotificationUpdate = (count) => {
    setNotificationCount(count);
    setShowNotificationBadge(count > 0);
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/dashboard">
                  <div className="flex items-center space-x-2 cursor-pointer group">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent" data-testid="logo">
                      EduTech
                    </h1>
                  </div>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:block ml-10">
                <div className="flex items-center space-x-1">
                  {getVisibleNavigation().map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-xl ${
                          isActiveTab(item.href)
                            ? 'bg-primary-50 text-primary-700 shadow-sm'
                            : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                        }`}
                        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
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
                  onClick={handleNotificationClick}
                  className="relative p-2 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                  data-testid="notifications-button"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && showNotificationBadge && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full p-0 flex items-center justify-center animate-pulse"
                      data-testid="notification-count"
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Badge>
                  )}
                </Button>
              </div>
              
              {/* User Menu - Hidden on small screens */}
              <div className="hidden sm:flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-primary-50 transition-all duration-200"
                      data-testid="user-menu-trigger"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-medium">
                          {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {user?.profile?.firstName || user?.username || 'User'}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {user?.role || 'User'}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2">
                    <div className="px-2 py-1.5">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.profile?.firstName && user?.profile?.lastName
                          ? `${user?.profile?.firstName} ${user?.profile?.lastName}`
                          : user?.username || 'User'
                        }
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {user?.role || 'User'}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link 
                        href="/profile" 
                        className="flex items-center"
                        data-testid="link-profile"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg">
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
                      className="flex items-center text-red-600 rounded-lg"
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
                  className="p-2 rounded-xl hover:bg-primary-50 transition-all duration-200"
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
            <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Navigation Links */}
                {getVisibleNavigation().map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                        isActiveTab(item.href)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-primary-50/50 hover:text-primary-600'
                      }`}
                      data-testid={`mobile-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Mobile User Info and Actions */}
                <div className="pt-4 pb-3 border-t border-gray-100">
                  <div className="flex items-center px-3 py-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-medium">
                        {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-900">
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
                      className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-gray-600 hover:bg-primary-50/50 hover:text-primary-600 rounded-xl transition-all duration-200"
                    >
                      <User className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-gray-600 hover:bg-primary-50/50 hover:text-primary-600 rounded-xl transition-all duration-200"
                    >
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full text-left px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notificationCenterOpen}
        onClose={handleNotificationCenterClose}
        onNotificationClick={handleNotificationUpdate}
      />
    </>
  );
};

export default Navbar;
