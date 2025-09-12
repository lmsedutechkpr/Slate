import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  ShoppingBag,
  Package,
  Receipt,
  Boxes
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems = [
    { title: 'Dashboard', href: '/admin', icon: Home, description: 'Dashboard overview', roles: ['admin', 'super-admin'] },
    { title: 'User Management', href: '/admin/users', icon: Users, description: 'All users with role filters', roles: ['admin', 'user-admin', 'super-admin'] },
    { title: 'Instructors', href: '/admin/instructors', icon: UserCheck, description: 'Manage instructors', roles: ['admin', 'instructor-admin', 'super-admin'] },
    { title: 'Courses', href: '/admin/courses', icon: BookOpen, description: 'Manage courses', roles: ['admin', 'course-admin', 'super-admin'] },
    { title: 'Store Management', href: '/admin/store', icon: ShoppingBag, description: 'E-commerce administration', roles: ['super-admin', 'admin'] },
    { title: 'Products', href: '/admin/store/products', icon: Package, description: 'Manage products', roles: ['super-admin', 'admin'], indent: true },
    { title: 'Orders', href: '/admin/store/orders', icon: Receipt, description: 'View and process orders', roles: ['super-admin', 'admin'], indent: true },
    { title: 'Inventory', href: '/admin/store/inventory', icon: Boxes, description: 'Track stock levels', roles: ['super-admin', 'admin'], indent: true },
    { title: 'Reports & Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Sales and learning insights', roles: ['admin', 'analytics-admin', 'super-admin'] },
    { title: 'Audit Logs', href: '/admin/logs', icon: BarChart3, description: 'System audit trail', roles: ['admin', 'super-admin'] },
    { title: 'Settings', href: '/admin/settings', icon: Settings, description: 'System configuration', roles: ['super-admin'] }
  ];

  const currentPath = location;
  const currentItem = navigationItems.find(item => item.href === currentPath);

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
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/slate-logo.png" alt="Slate" className="w-8 h-8 object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} />
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Slate Admin</span>
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

        {/* Global Search */}
        <div className="px-3 lg:px-4 py-3 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); setCmdOpen(true); }}
              onFocus={() => { setSearchOpen(true); setCmdOpen(true); }}
              placeholder="Search users, courses, instructors... (Ctrl+K)"
              className="w-full h-9 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Global search"
            />
            {searchOpen && cmdOpen && (
              <div className="absolute left-0 right-0 mt-2 z-50" role="listbox">
                <div className="rounded-md border bg-white shadow-xl">
                  <Command>
                    <CommandInput value={searchQuery} onValueChange={setSearchQuery} placeholder="Type to search..." />
                    <CommandList>
                      <CommandGroup heading="Navigation">
                        {navigationItems
                          .filter(item => item.title.toLowerCase().includes((searchQuery || '').toLowerCase()))
                          .slice(0, 6)
                          .map((item) => (
                            <CommandItem key={item.href} onSelect={() => { handleNavigation(item.href); setSearchOpen(false); setCmdOpen(false); setSearchQuery(''); }}>
                              {item.title}
                            </CommandItem>
                          ))}
                        {(!searchQuery || navigationItems.filter(item => item.title.toLowerCase().includes((searchQuery || '').toLowerCase())).length === 0) && (
                          <CommandItem disabled>No results</CommandItem>
                        )}
                      </CommandGroup>
                      <CommandGroup heading="Quick Actions">
                        <CommandItem onSelect={() => { setLocation('/admin/courses'); setSearchOpen(false); setCmdOpen(false); setSearchQuery(''); }}>Create Course</CommandItem>
                        <CommandItem onSelect={() => { setLocation('/admin/users'); setSearchOpen(false); setCmdOpen(false); setSearchQuery(''); }}>Invite Instructor</CommandItem>
                        <CommandItem onSelect={() => { setLocation('/admin/analytics'); setSearchOpen(false); setCmdOpen(false); setSearchQuery(''); }}>View Analytics</CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center space-x-3 w-full text-left">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{(user?.profile?.nickname || user?.username || 'A').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.profile?.nickname || user?.username || 'Admin'}</p>
                  <Badge variant="secondary" className="text-xs">{user?.role || 'admin'}</Badge>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="text-sm">
                <div className="font-medium">{user?.profile?.nickname || user?.username || 'Admin'}</div>
                <div className="text-gray-500 mb-3">{user?.email || ''}</div>
                <div className="flex gap-2 mb-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation('/admin/profile')}>Edit Profile</Button>
                </div>
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
                  w-full justify-start h-auto py-3 px-3 text-left ${item.indent ? 'pl-8' : ''}
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
        <div className="px-3 lg:px-4 py-4 border-t border-gray-200 text-xs text-gray-500">© Slate</div>
      </div>

      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        lg:ml-64
      `}>
        {/* Top Bar with Integrated Navigation */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200 px-3 py-3 lg:px-6 shadow-sm">
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
              
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                {(() => {
                  const segments = (currentPath || '/admin').split('/').filter(Boolean);
                  const crumbs = [];
                  let href = '';
                  for (let i = 0; i < segments.length; i++) {
                    const segment = segments[i];
                    href += `/${segment}`;
                    const matchedNav = navigationItems.find(n => n.href === href);
                    const looksLikeId = /^[a-f\d]{24}$/i.test(segment);
                    const baseLabel = matchedNav?.title || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                    const label = looksLikeId ? 'Detail' : (baseLabel || 'Admin');
                    const isLast = i === segments.length - 1;
                    crumbs.push(
                      <span key={href} className="flex items-center">
                        {i > 0 && <span className="mx-2 text-gray-400">/</span>}
                        {isLast ? (
                          <span className="font-medium text-gray-900">{label}</span>
                        ) : (
                          <Link href={href} onClick={() => closeMobileSidebar()} className="hover:underline">
                            {label}
                          </Link>
                        )}
                      </span>
                    );
                  }
                  if (crumbs.length === 0) {
                    return <span className="font-medium text-gray-900">Admin</span>;
                  }
                  return crumbs;
                })()}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
              <NotificationsBell />
              <div className="hidden md:flex items-center space-x-2 text-xs lg:text-sm text-gray-600">
                <span>Last login:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              {/* removed topbar profile/logout per request */}
            </div>
          </div>
        </div>

        {/* Page Content */
        }
        <main className="p-3 lg:p-6">
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
                    {navigationItems.map((item) => (
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
  const [open, setOpen] = useState(false);

  // Load persisted notifications
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin.notifications');
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(Array.isArray(parsed) ? parsed : []);
        setCount((Array.isArray(parsed) ? parsed : []).filter(i => i.unread).length);
      }
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try { localStorage.setItem('admin.notifications', JSON.stringify(items)); } catch {}
  }, [items]);

  useEffect(() => {
    let socket;
    (async () => {
      const { io } = await import('socket.io-client');
      socket = io('/', { path: '/socket.io' });
      socket.emit('notifications:subscribe');
      socket.on('notification', (n) => {
        const next = {
          id: Date.now().toString(),
          title: n.title,
          message: n.message,
          href: n.href || '/admin/analytics',
          unread: true
        };
        setItems(prev => [next, ...prev].slice(0, 20));
        setCount(c => c + 1);
      });
    })();
    return () => { if (socket) socket.disconnect(); };
  }, []);

  const markAllRead = () => {
    setItems(prev => prev.map(i => ({ ...i, unread: false })));
    setCount(0);
  };

  const clearAll = () => {
    setItems([]);
    setCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
          <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          {count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] leading-none rounded-full flex items-center justify-center">{Math.min(count,9)}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="p-2 border-b font-medium flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex gap-1">
            <Button size="xs" variant="outline" onClick={markAllRead}>Mark all read</Button>
            <Button size="xs" variant="ghost" onClick={clearAll}>Clear</Button>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No notifications</div>
        ) : (
          <ul className="max-h-64 overflow-auto divide-y">
            {items.map(n => (
              <li key={n.id} className={`p-3 text-sm cursor-pointer hover:bg-gray-50 ${n.unread ? 'bg-blue-50/40' : ''}`}
                  onClick={() => {
                    setItems(prev => prev.map(i => i.id === n.id ? { ...i, unread: false } : i));
                    setCount(c => Math.max(0, c - (n.unread ? 1 : 0)));
                    if (n.href) window.location.href = n.href;
                    setOpen(false);
                  }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {n.title}
                      {n.unread && <span className="inline-block w-2 h-2 bg-blue-600 rounded-full" aria-hidden />}
                    </div>
                    <div className="text-gray-600">{n.message}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
