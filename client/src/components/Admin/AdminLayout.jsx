import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setupAdminRealtimeInvalidations } from '@/lib/realtime.js';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  BookOpen,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Home,
  Menu,
  X,
  Package,
  ShoppingCart,
  Tags,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('admin.sidebar') === 'collapsed'; } catch { return false; }
  });

  const navigationGroups = [
    { label: 'Overview', items: [
      { title: 'Dashboard', href: '/admin', icon: Home, description: 'Dashboard overview', roles: ['admin','super-admin'] }
    ]},
    { label: 'Learning Management', items: [
      { title: 'Courses', href: '/admin/courses', icon: BookOpen, description: 'Manage courses', roles: ['admin','course-admin','super-admin'] },
      { title: 'Instructors', href: '/admin/instructors', icon: UserCheck, description: 'Manage instructors', roles: ['admin','instructor-admin','super-admin'] },
      { title: 'Students', href: '/admin/students', icon: Users, description: 'Student management', roles: ['admin','student-admin','super-admin'] },
    ]},
    { label: 'Reports', items: [
      { title: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Reports & insights', roles: ['admin','analytics-admin','super-admin'] },
    ]},
    { label: 'System', items: [
      { title: 'Users', href: '/admin/users', icon: Users, description: 'User management', roles: ['admin','user-admin','super-admin'] },
      { title: 'Audit Logs', href: '/admin/audit-logs', icon: BarChart3, description: 'System audit trail', roles: ['admin','super-admin'] },
      { title: 'Settings', href: '/admin/settings', icon: Settings, description: 'System configuration', roles: ['super-admin'] }
    ]}
  ];

  const currentPath = location;
  const flatItems = navigationGroups.flatMap(g => g.items);
  const currentItem = flatItems.find(item => item.href === currentPath);

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

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Global realtime invalidations for admin area
  useEffect(() => {
    const teardown = setupAdminRealtimeInvalidations(queryClient, accessToken);
    return () => { if (teardown) teardown(); };
  }, [queryClient, accessToken]);

  const handleNavigation = (href) => {
    setLocation(href);
    closeMobileSidebar();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-20' : 'w-64'} bg-white dark:bg-sidebar border-r border-gray-200 dark:border-sidebar-border transform transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-gray-200 dark:border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!collapsed && <span className="text-lg font-semibold text-gray-900 dark:text-sidebar-foreground">Admin Panel</span>}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileSidebar}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:inline-flex"
              onClick={() => {
                setCollapsed(v => {
                  const next = !v; try { localStorage.setItem('admin.sidebar', next ? 'collapsed' : 'expanded'); } catch {}
                  return next;
                });
              }}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-sidebar-border">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center space-x-3 w-full text-left">
                <div className="w-10 h-10 bg-blue-100 dark:bg-sidebar-accent rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-sidebar-accent-foreground font-semibold text-sm">{(user?.profile?.nickname || user?.username || 'A').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-sidebar-foreground truncate">{user?.profile?.nickname || user?.username || 'Admin'}</p>
                  <Badge variant="secondary" className="text-xs">{user?.role || 'admin'}</Badge>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 dark:bg-popover dark:text-foreground">
              <div className="text-sm">
                <div className="font-medium">{user?.profile?.nickname || user?.username || 'Admin'}</div>
                <div className="text-gray-500 dark:text-muted-foreground mb-3">{user?.email || ''}</div>
                <div className="flex gap-2 mb-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation('/admin/profile')}>Edit Profile</Button>
                </div>
                <Button variant="outline" size="sm" className="w-full rounded-md text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-3 overflow-y-auto">
          {navigationGroups.map(group => (
            <div key={group.label}>
              {!collapsed && <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-gray-400 dark:text-muted-foreground">{group.label}</div>}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = currentPath === item.href;
                  const Icon = item.icon;
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={`w-full justify-center ${collapsed ? 'px-2' : 'px-3'} h-10 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent'}`}
                          onClick={() => handleNavigation(item.href)}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="text-sm font-medium">{item.title}</div>
                        {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 lg:px-4 py-4 border-t border-gray-200 dark:border-sidebar-border text-xs text-gray-500 dark:text-muted-foreground">© EduTech</div>
      </div>

      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>
        {/* Top Bar with Integrated Navigation */}
        <div className="sticky top-0 z-40 bg-white/90 dark:bg-background/90 backdrop-blur border-b border-gray-200 dark:border-sidebar-border px-3 py-3 lg:px-6 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left side - Toggle button and current page */}
            <div className="flex items-center space-x-3 lg:space-x-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileSidebar}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700 dark:text-muted-foreground">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                {(() => {
                  const segments = (currentPath || '/admin').split('/').filter(Boolean);
                  const crumbs = [];
                  let href = '';
                  for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i];
                    href += `/${segment}`;
                    const matchedNav = flatItems.find(n => n.href === href);
                    const looksLikeId = /^[a-f\d]{24}$/i.test(segment);
                    const baseLabel = matchedNav?.title || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                    const label = looksLikeId ? 'Detail' : (baseLabel || 'Admin');
                    const isLast = i === segments.length - 1;
                    crumbs.push(
                      <span key={href} className="flex items-center">
                        {i > 0 && <span className="mx-2 text-gray-400">/</span>}
                        {isLast ? (
                          <span className="font-medium text-gray-900 dark:text-foreground">{label}</span>
                        ) : (
                          <Link href={href} onClick={() => closeMobileSidebar()} className="hover:underline">
                            {label}
                          </Link>
                        )}
                      </span>
                    );
                  }
                  if (crumbs.length === 0) {
                    return <span className="font-medium text-gray-900 dark:text-foreground">Admin</span>;
                  }
                  return crumbs;
                })()}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
              <Button variant="ghost" size="sm" aria-label="Toggle theme" onClick={() => {
                const root = document.documentElement;
                const next = root.classList.contains('dark') ? 'light' : 'dark';
                if (next === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
                try { localStorage.setItem('theme', next); } catch {}
              }}>
                {typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              <NotificationsBell />
              <div className="hidden md:flex items-center space-x-2 text-xs lg:text-sm text-gray-600 dark:text-muted-foreground">
                <span>Last login:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              {/* removed topbar profile/logout per request */}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-3 lg:p-6 max-w-7xl mx-auto text-foreground dark:text-foreground">
          {children}
        </main>
      </div>
      {/* Command Palette */}
      {cmdOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30" onClick={() => setCmdOpen(false)}>
          <div className="w-[90%] max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-md border bg-white shadow-xl">
              <Command>
                <CommandInput placeholder="Search actions, pages..." autoFocus />
                <CommandList>
                  <CommandGroup heading="Navigation">
                    {flatItems.map((item) => (
                      <CommandItem key={item.href} onSelect={() => { handleNavigation(item.href); setCmdOpen(false); }}>
                        {item.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Quick Actions">
                    <CommandItem onSelect={() => { setLocation('/admin/courses'); setCmdOpen(false); }}>Create Course</CommandItem>
                    <CommandItem onSelect={() => { setLocation('/admin/users'); setCmdOpen(false); }}>Invite Instructor</CommandItem>
                    <CommandItem onSelect={() => { setLocation('/admin/analytics'); setCmdOpen(false); }}>View Analytics</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;

// Notifications component with polling
function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  useEffect(() => {
    let socket;
    (async () => {
      const { getSocket } = await import('@/lib/realtime.js');
      socket = getSocket();
      socket.emit('notifications:subscribe');
      socket.on('notification', (n) => {
        setItems(prev => [{ id: Date.now().toString(), title: n.title, message: n.message }, ...prev].slice(0, 10));
        setCount(c => c + 1);
      });
    })();
    return () => { if (socket) socket.disconnect(); };
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          {count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] leading-none rounded-full flex items-center justify-center">{Math.min(count,9)}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="p-2 border-b font-medium">Notifications</div>
        {items.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No notifications</div>
        ) : (
          <ul className="max-h-64 overflow-auto divide-y">
            {items.map(n => (
              <li key={n.id} className="p-3 text-sm">
                <div className="font-medium">{n.title}</div>
                <div className="text-gray-600">{n.message}</div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
