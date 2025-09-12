import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Bell, ChevronDown, User, LogOut, Settings, Menu, X, BookOpen, Home, FileText, TrendingUp, BarChart3, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationCenter from '../Notifications/NotificationCenter.jsx';
import { getImageUrl, buildApiUrl } from '@/lib/utils.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { user, logout, accessToken } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', role: 'student', icon: Home },
    { name: 'Courses', href: '/courses', role: 'student', icon: BookOpen },
    { name: 'Assignments', href: '/assignments', role: 'student', icon: FileText },
    { name: 'Progress', href: '/progress', role: 'student', icon: TrendingUp },
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

  const getUserDisplayName = () => {
    if (userProfile?.profile?.firstName && userProfile?.profile?.lastName) {
      return `${userProfile.profile.firstName} ${userProfile.profile.lastName}`;
    }
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user?.username || 'User';
  };

  const getUserAvatar = () => {
    return userProfile?.profile?.avatar || user?.profile?.avatar;
  };

  const getUserRole = () => {
    return userProfile?.role || user?.role || 'User';
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

  // Fetch user profile data
  useEffect(() => {
    let isMounted = true;
    
    async function fetchUserProfile() {
      if (!accessToken || !user) return;
      
      setProfileLoading(true);
      try {
        const res = await fetch(buildApiUrl('/api/users/profile'), {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUserProfile(data.user);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    }

    fetchUserProfile();
    
    // Listen for profile updates from other components
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    
    return () => {
      isMounted = false;
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [accessToken, user]);

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/dashboard">
                  <div className="flex items-center cursor-pointer">
                    <div className="h-8 w-auto bg-white rounded-md ring-1 ring-gray-200 shadow-sm px-1 py-0.5">
                      <img src="/slate-logo.png" alt="Slate" className="h-7 w-auto object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]" />
                    </div>
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
            
            {/* Right side - Search, Notifications, User Menu, Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Inline Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="h-9 w-64 pl-10 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Search"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const q = e.currentTarget.value.trim();
                        if (q) window.dispatchEvent(new CustomEvent('global-search', { detail: { q } }));
                      }
                    }}
                  />
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
              </div>

              {/* Notifications - Hidden on small screens */}
              <div className="hidden sm:block relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNotificationClick}
                  aria-label="Open notifications"
                  className="relative p-2 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                      aria-label="Open user menu"
                      className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      data-testid="user-menu-trigger"
                    >
                      <div className="w-9 h-9 bg-white ring-1 ring-gray-200 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                        {getUserAvatar() ? (
                          <img 
                            src={getImageUrl(getUserAvatar(), buildApiUrl(''))} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-700 text-sm font-semibold">
                            {getInitials(userProfile?.profile?.firstName, userProfile?.profile?.lastName)}
                          </span>
                        )}
                      </div>
                      <div className="text-left hidden lg:block">
                        <div className="text-sm font-medium text-gray-900 leading-tight">
                          {getUserDisplayName()}
                        </div>
                        <div className="text-xs text-gray-500 capitalize leading-tight">
                          {getUserRole()}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2">
                    <div className="px-2 py-1.5">
                      <div className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {getUserRole()}
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
                  aria-label="Toggle mobile menu"
                  className="p-2 rounded-xl hover:bg-primary-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                      {getUserAvatar() ? (
                        <img 
                          src={getImageUrl(getUserAvatar(), buildApiUrl(''))} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {getInitials(userProfile?.profile?.firstName, userProfile?.profile?.lastName)}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-900">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {getUserRole()}
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
