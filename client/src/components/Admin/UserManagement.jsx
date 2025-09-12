import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { useAuthRefresh } from '../../hooks/useAuthRefresh.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/Common/ConfirmDialog.jsx';
import { UserPlus, Search, Filter, MoreHorizontal, Ban, CheckCircle, XCircle, BarChart2, Trash2, ThumbsUp, ThumbsDown, UserPlus2 } from 'lucide-react';
import { getSocket } from '@/lib/realtime.js';

const UserManagement = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(() => new URLSearchParams(window.location.search).get('role') || localStorage.getItem('adminUsers.role') || 'all');
  const [activeTab, setActiveTab] = useState(() => (['student','instructor','admin'].includes(new URLSearchParams(window.location.search).get('role')||'') ? new URLSearchParams(window.location.search).get('role') : 'all'));
  const [selectedStatus, setSelectedStatus] = useState(() => localStorage.getItem('adminUsers.status') || 'all');
  const [savedViews, setSavedViews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('adminUsers.savedViews') || '[]'); } catch { return []; }
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState('instructor'); // 'instructor' | 'student'
  const [newInstructor, setNewInstructor] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    googleEmail: ''
  });
  const [newStudent, setNewStudent] = useState({
    username: '', email: '', password: '', firstName: '', lastName: ''
  });
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [progressUser, setProgressUser] = useState(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin.users.columns') || 'null');
      return saved || { role: true, status: true, joined: true };
    } catch { return { role: true, status: true, joined: true }; }
  });
  useEffect(() => {
    try { localStorage.setItem('admin.users.columns', JSON.stringify(visibleCols)); } catch {}
  }, [visibleCols]);

  // Fetch users
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { role: selectedRole, status: selectedStatus, search: searchTerm, page, limit, sortBy, sortDir }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedRole && selectedRole !== 'all') params.append('role', selectedRole);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);
      
      const response = await authenticatedFetch(buildApiUrl(`/api/admin/users?${params.toString()}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return response.json();
    },
    enabled: !!accessToken && !authLoading,
  });

  // Realtime refresh on admin user updates
  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return;
    const handler = () => queryClient.invalidateQueries(['/api/admin/users']);
    socket.on('admin:users:update', handler);
    return () => { try { socket.off('admin:users:update', handler); } catch {} };
  }, [accessToken, queryClient]);

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem('adminUsers.role', selectedRole);
      localStorage.setItem('adminUsers.status', selectedStatus);
    } catch {}
  }, [selectedRole, selectedStatus]);

  const saveCurrentView = () => {
    const name = prompt('Save current filters as view name:');
    if (!name) return;
    const view = { name, role: selectedRole, status: selectedStatus, search: searchTerm };
    const next = [...savedViews.filter(v => v.name !== name), view];
    setSavedViews(next);
    try { localStorage.setItem('adminUsers.savedViews', JSON.stringify(next)); } catch {}
  };

  const loadView = (view) => {
    setSelectedRole(view.role || 'all');
    setSelectedStatus(view.status || 'all');
    setSearchTerm(view.search || '');
    setPage(1);
  };

  const deleteView = (name) => {
    const next = savedViews.filter(v => v.name !== name);
    setSavedViews(next);
    try { localStorage.setItem('adminUsers.savedViews', JSON.stringify(next)); } catch {}
  };

  // Create instructor mutation
  const createInstructorMutation = useMutation({
    mutationFn: async (instructorData) => {
      const response = await authenticatedFetch(buildApiUrl('/api/admin/instructors'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(instructorData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create instructor');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Instructor created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewInstructor({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        googleEmail: ''
      });
      queryClient.invalidateQueries(['/api/admin/users']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (studentData) => {
      const response = await authenticatedFetch(buildApiUrl('/api/admin/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Student created successfully' });
      setNewStudent({ username: '', email: '', password: '', firstName: '', lastName: '' });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries(['/api/admin/users']);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }) => {
      const response = await authenticatedFetch(buildApiUrl(`/api/admin/users/${userId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      queryClient.invalidateQueries(['/api/admin/users']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, mode }) => {
      const response = await authenticatedFetch(buildApiUrl(`/api/admin/users/${userId}?mode=${mode}`), { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'User updated successfully' });
      queryClient.invalidateQueries(['/api/admin/users']);
    },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
  });

  const approveInstructorMutation = useMutation({
    mutationFn: async ({ userId, approvalStatus }) => {
      const response = await authenticatedFetch(buildApiUrl(`/api/admin/instructors/${userId}/approval`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalStatus })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update approval');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Approval updated' });
      queryClient.invalidateQueries(['/api/admin/users']);
    },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' })
  });

  const users = usersData?.users || [];
  const pagination = usersData?.pagination || { page, limit, total: users.length };

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'instructor': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'banned': return 'bg-red-100 text-red-700';
      case 'inactive': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCreateInstructor = () => {
    createInstructorMutation.mutate(newInstructor);
  };

  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState('active');
  const requestStatusChange = (user, status) => { setStatusTarget(user); setNextStatus(status); setConfirmStatusOpen(true); };
  const handleUpdateStatus = (userId, status) => {
    updateStatusMutation.mutate({ userId, status });
  };

  const openProgress = async (user) => {
    setProgressUser(user);
    setProgressOpen(true);
    setProgressLoading(true);
    try {
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/users/${user._id}/progress`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load progress');
      setProgressData(data.progress || []);
    } catch (e) {
      setProgressData([]);
    } finally {
      setProgressLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage students, instructors, and administrators</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Choose user type and provide details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User Type</Label>
                <div className="mt-2 flex gap-2">
                  <Button variant={createMode==='student'?'default':'outline'} onClick={()=>setCreateMode('student')}><UserPlus2 className="w-4 h-4 mr-2"/>Student</Button>
                  <Button variant={createMode==='instructor'?'default':'outline'} onClick={()=>setCreateMode('instructor')}><UserPlus className="w-4 h-4 mr-2"/>Instructor</Button>
                </div>
              </div>
              {createMode === 'instructor' ? (
              <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newInstructor.firstName}
                    onChange={(e) => setNewInstructor(prev => ({ ...prev, firstName: e.target.value }))}
                    data-testid="input-instructor-firstName"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newInstructor.lastName}
                    onChange={(e) => setNewInstructor(prev => ({ ...prev, lastName: e.target.value }))}
                    data-testid="input-instructor-lastName"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newInstructor.username}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, username: e.target.value }))}
                  data-testid="input-instructor-username"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newInstructor.email}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-instructor-email"
                />
              </div>
              <div>
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newInstructor.password}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, password: e.target.value }))}
                  data-testid="input-instructor-password"
                />
              </div>
              <div>
                <Label htmlFor="googleEmail">Google Email (Optional)</Label>
                <Input
                  id="googleEmail"
                  type="email"
                  value={newInstructor.googleEmail}
                  onChange={(e) => setNewInstructor(prev => ({ ...prev, googleEmail: e.target.value }))}
                  placeholder="For Google OAuth login"
                  data-testid="input-instructor-googleEmail"
                />
              </div>
              </>
              ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input value={newStudent.firstName} onChange={(e)=> setNewStudent(s => ({...s, firstName: e.target.value}))} />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={newStudent.lastName} onChange={(e)=> setNewStudent(s => ({...s, lastName: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <Label>Username</Label>
                  <Input value={newStudent.username} onChange={(e)=> setNewStudent(s => ({...s, username: e.target.value}))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={newStudent.email} onChange={(e)=> setNewStudent(s => ({...s, email: e.target.value}))} />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={newStudent.password} onChange={(e)=> setNewStudent(s => ({...s, password: e.target.value}))} />
                </div>
              </>
              )}
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-user"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => createMode==='instructor' ? handleCreateInstructor() : createStudentMutation.mutate(newStudent)}
                  disabled={createMode==='instructor' ? createInstructorMutation.isPending : createStudentMutation.isPending}
                  data-testid="button-save-user"
                >
                  {(createInstructorMutation.isPending || createStudentMutation.isPending) ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters + Tabs */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button variant={activeTab==='all'?'default':'outline'} onClick={()=>{ setActiveTab('all'); setSelectedRole('all'); }}>All</Button>
              <Button variant={activeTab==='student'?'default':'outline'} onClick={()=>{ setActiveTab('student'); setSelectedRole('student'); }}>Students</Button>
              <Button variant={activeTab==='instructor'?'default':'outline'} onClick={()=>{ setActiveTab('instructor'); setSelectedRole('instructor'); }}>Instructors</Button>
              <Button variant={activeTab==='admin'?'default':'outline'} onClick={()=>{ setActiveTab('admin'); setSelectedRole('admin'); }}>Admins</Button>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={saveCurrentView}>
                Save View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {savedViews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Views</CardTitle>
            <CardDescription>Quickly apply commonly used filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedViews.map(v => (
                <div key={v.name} className="flex items-center gap-2 border rounded px-2 py-1 text-sm">
                  <button className="underline" onClick={() => loadView(v)}>{v.name}</button>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{v.role}, {v.status}{v.search ? `, "${v.search}"` : ''}</span>
                  <Button size="sm" variant="ghost" onClick={() => deleteView(v.name)}>✕</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Users ({users.length})</CardTitle>
              <CardDescription>
                Manage all users in the system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setColumnsOpen(true)}>Columns</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found matching your criteria</p>
            </div>
          ) : (
            <>
            <div className="flex justify-end pb-3">
              <Button variant="outline" onClick={() => {
                const rows = users.map(u => ({
                  id: u._id,
                  username: u.username,
                  email: u.email,
                  role: u.role,
                  status: u.status,
                  createdAt: u.createdAt
                }));
                const header = Object.keys(rows[0] || {}).join(',');
                const body = rows.map(r => Object.values(r).map(v => typeof v === 'string' && v.includes(',') ? `"${v.replaceAll('"','""')}"` : v).join(',')).join('\n');
                const csv = header + '\n' + body;
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click(); URL.revokeObjectURL(url);
              }}>Export CSV</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => { setSortBy('username'); setSortDir(d => (sortBy === 'username' && d === 'asc') ? 'desc' : 'asc'); }}
                  >
                    User {sortBy === 'username' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </TableHead>
                  {visibleCols.role && (<TableHead
                    className="cursor-pointer"
                    onClick={() => { setSortBy('role'); setSortDir(d => (sortBy === 'role' && d === 'asc') ? 'desc' : 'asc'); }}
                  >
                    Role {sortBy === 'role' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </TableHead>)}
                  {visibleCols.status && (<TableHead
                    className="cursor-pointer"
                    onClick={() => { setSortBy('status'); setSortDir(d => (sortBy === 'status' && d === 'asc') ? 'desc' : 'asc'); }}
                  >
                    Status {sortBy === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </TableHead>)}
                  {visibleCols.joined && (<TableHead
                    className="cursor-pointer"
                    onClick={() => { setSortBy('createdAt'); setSortDir(d => (sortBy === 'createdAt' && d === 'asc') ? 'desc' : 'asc'); }}
                  >
                    Joined {sortBy === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </TableHead>)}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} data-testid={`user-row-${user._id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.profile?.firstName && user.profile?.lastName
                            ? `${user.profile.firstName} ${user.profile.lastName}`
                            : user.username
                          }
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.googleEmail && (
                          <div className="text-xs text-blue-600">Google: {user.googleEmail}</div>
                        )}
                      </div>
                    </TableCell>
                    {visibleCols.role && (
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleCols.status && (
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleCols.joined && (
                      <TableCell>
                        {formatDate(user.createdAt)}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProgress(user)}
                          data-testid={`button-progress-${user._id}`}
                        >
                          <BarChart2 className="w-3 h-3 mr-1" />
                          Progress
                        </Button>
                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestStatusChange(user, 'banned')}
                            data-testid={`button-ban-${user._id}`}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Ban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => requestStatusChange(user, 'active')}
                            data-testid={`button-activate-${user._id}`}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => deleteUserMutation.mutate({ userId: user._id, mode: 'deactivate' })}><XCircle className="w-3 h-3 mr-1"/>Deactivate</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteUserMutation.mutate({ userId: user._id, mode: 'delete' })}><Trash2 className="w-3 h-3 mr-1"/>Delete</Button>
                        {user.role === 'instructor' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => approveInstructorMutation.mutate({ userId: user._id, approvalStatus: 'approved' })}><ThumbsUp className="w-3 h-3 mr-1"/>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => approveInstructorMutation.mutate({ userId: user._id, approvalStatus: 'rejected' })}><ThumbsDown className="w-3 h-3 mr-1"/>Reject</Button>
                            {user.approvalStatus && (<Badge>{user.approvalStatus}</Badge>)}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Columns chooser */}
      <Dialog open={columnsOpen} onOpenChange={setColumnsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose columns</DialogTitle>
            <DialogDescription>Toggle visibility for table columns.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['role','Role'],
              ['status','Status'],
              ['joined','Joined'],
            ].map(([key,label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!visibleCols[key]} onChange={(e)=> setVisibleCols(v => ({...v, [key]: e.target.checked}))} />
                {label}
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setColumnsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm user status change */}
      <ConfirmDialog
        open={confirmStatusOpen}
        onOpenChange={setConfirmStatusOpen}
        title={nextStatus === 'banned' ? 'Ban user?' : 'Activate user?'}
        description={statusTarget ? `User @${statusTarget.username} will be set to "${nextStatus}".` : ''}
        confirmLabel={nextStatus === 'banned' ? 'Ban' : 'Activate'}
        destructive={nextStatus === 'banned'}
        onConfirm={() => statusTarget && handleUpdateStatus(statusTarget._id, nextStatus)}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {pagination.page} of {Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || limit)))} • {pagination.total || 0} results</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={pagination.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
          <Button variant="outline" disabled={pagination.page >= Math.ceil((pagination.total || 0) / (pagination.limit || limit))} onClick={() => setPage(p => p + 1)}>Next</Button>
          <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    {/* Progress Drawer */}
    <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Progress - {progressUser?.username}</DialogTitle>
          <DialogDescription>Course progress details for this user</DialogDescription>
        </DialogHeader>
        {progressLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : progressData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No progress data</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Lectures</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressData.map((p) => (
                <TableRow key={p.enrollmentId}>
                  <TableCell>{p.courseTitle}</TableCell>
                  <TableCell>{Math.round(p.progressPct)}%</TableCell>
                  <TableCell>{p.completedLectures}/{p.totalLectures}</TableCell>
                  <TableCell>{p.xp}</TableCell>
                  <TableCell>{p.lastActivityAt ? new Date(p.lastActivityAt).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  </div>
  );
};

export default UserManagement;
