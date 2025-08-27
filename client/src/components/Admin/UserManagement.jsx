import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
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
import { UserPlus, Search, Filter, MoreHorizontal, Ban, CheckCircle, XCircle, BarChart2 } from 'lucide-react';

const UserManagement = () => {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    googleEmail: ''
  });
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [progressUser, setProgressUser] = useState(null);

  // Fetch users
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { role: selectedRole, status: selectedStatus, search: searchTerm, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedRole) params.append('role', selectedRole);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', String(page));
      params.append('limit', String(limit));
      
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Create instructor mutation
  const createInstructorMutation = useMutation({
    mutationFn: async (instructorData) => {
      const response = await fetch('/api/admin/instructors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  const users = usersData?.users || [];
  const pagination = usersData?.pagination || { page, limit, total: users.length };

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

  const handleUpdateStatus = (userId, status) => {
    updateStatusMutation.mutate({ userId, status });
  };

  const openProgress = async (user) => {
    setProgressUser(user);
    setProgressOpen(true);
    setProgressLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}/progress`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
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
            <Button data-testid="button-create-instructor">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Instructor</DialogTitle>
              <DialogDescription>
                Add a new instructor to the system. They will receive login credentials via email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-instructor"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateInstructor}
                  disabled={createInstructorMutation.isPending}
                  data-testid="button-save-instructor"
                >
                  {createInstructorMutation.isPending ? 'Creating...' : 'Create Instructor'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
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
                  <SelectItem value="">All Roles</SelectItem>
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
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>
            Manage all users in the system
          </CardDescription>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
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
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(user.createdAt)}
                    </TableCell>
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
                            onClick={() => handleUpdateStatus(user._id, 'banned')}
                            data-testid={`button-ban-${user._id}`}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Ban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(user._id, 'active')}
                            data-testid={`button-activate-${user._id}`}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
