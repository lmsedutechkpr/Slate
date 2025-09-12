import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLocation } from 'wouter';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Ban,
  Unlock,
  Trash2,
  Download,
  MoreHorizontal,
  UserPlus,
  GraduationCap,
  Shield,
  Users,
  ChevronDown,
  X
} from 'lucide-react';

const AdminUsers = () => {
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Mock data for demonstration
  const users = [
    { _id: '1', username: 'john_doe', email: 'john@example.com', role: 'student', status: 'active', createdAt: new Date(), lastLogin: new Date() },
    { _id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'instructor', status: 'active', createdAt: new Date(), lastLogin: new Date() },
    { _id: '3', username: 'admin_user', email: 'admin@example.com', role: 'admin', status: 'active', createdAt: new Date(), lastLogin: new Date() }
  ];

  const roleCounts = {
    all: users.length,
    student: users.filter(u => u.role === 'student').length,
    instructor: users.filter(u => u.role === 'instructor').length,
    admin: users.filter(u => u.role === 'admin').length
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student': return <GraduationCap className="h-4 w-4" />;
      case 'instructor': return <Users className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-yellow-100 text-yellow-700';
      case 'banned': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredUsers = selectedRole === 'all' ? users : users.filter(user => user.role === selectedRole);

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} on users:`, selectedUsers);
    // Here you would implement the actual bulk action logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage students, instructors, and administrators</p>
        </div>
        <Button className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Role Tabs */}
      <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users ({roleCounts.all})
          </TabsTrigger>
          <TabsTrigger value="student" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Students ({roleCounts.student})
          </TabsTrigger>
          <TabsTrigger value="instructor" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Instructors ({roleCounts.instructor})
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admins ({roleCounts.admin})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedRole} className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users by name, email, or username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    More Filters
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Join Date</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by join date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="7days">Last 7 days</SelectItem>
                          <SelectItem value="30days">Last 30 days</SelectItem>
                          <SelectItem value="90days">Last 90 days</SelectItem>
                          <SelectItem value="1year">Last year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Enrollment Status</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by enrollment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="enrolled">With Enrollments</SelectItem>
                          <SelectItem value="no-enrollments">No Enrollments</SelectItem>
                          <SelectItem value="active-courses">Active Courses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions for selected users
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('ban')}>
                        <Ban className="h-4 w-4 mr-2" />
                        Ban Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                        <Unlock className="h-4 w-4 mr-2" />
                        Activate Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected (CSV)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found matching your criteria</p>
                </div>
              ) : (
                <>
                  {/* Mobile List (sm:hidden) */}
                  <div className="sm:hidden space-y-3 p-4">
                    {filteredUsers.map((user) => (
                      <div key={user._id} className="border rounded-lg p-3 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <Checkbox
                              checked={selectedUsers.includes(user._id)}
                              onCheckedChange={(checked) => handleSelectUser(user._id, checked)}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {user.username}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{user.email}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {getRoleIcon(user.role)}
                                <span className="text-xs text-gray-400 capitalize">{user.role}</span>
                                <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setLocation(`/admin/users/${user._id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <GraduationCap className="h-4 w-4 mr-2" />
                                View Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Unlock className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Joined: {formatDate(user.createdAt)} • Last Login: {formatDate(user.lastLogin)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table (hidden on xs) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.includes(user._id)}
                                onCheckedChange={(checked) => handleSelectUser(user._id, checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  {getRoleIcon(user.role)}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {user.username}
                                  </div>
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getRoleIcon(user.role)}
                                <span className="text-sm capitalize">{user.role}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(user.status)}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">
                                {formatDate(user.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-900">
                                {formatDate(user.lastLogin)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setLocation(`/admin/users/${user._id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    View Progress
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Ban className="h-4 w-4 mr-2" />
                                    Ban User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsers;
