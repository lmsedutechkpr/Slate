import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { useRealtimeInvalidate } from '../lib/useRealtimeInvalidate.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  Star,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  BarChart3,
  Settings,
  DollarSign as PayoutIcon
} from 'lucide-react';

const AdminInstructors = () => {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [showAssignCoursesDialog, setShowAssignCoursesDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutSettings, setPayoutSettings] = useState({
    percentage: 70,
    method: 'bank_transfer',
    email: ''
  });

  // Fetch instructor KPIs
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['/api/admin/instructors/kpis', accessToken],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('/api/admin/instructors/kpis'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch instructor KPIs');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Fetch instructors data
  const { data: instructorsData, isLoading } = useQuery({
    queryKey: ['/api/admin/instructors', accessToken, selectedStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(buildApiUrl(`/api/admin/instructors?${params}`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch instructors');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  const instructors = instructorsData?.instructors || [];

  // Real-time updates
  useRealtimeInvalidate(['/api/admin/instructors', '/api/admin/instructors/kpis'], ['instructors:update', 'instructors:create', 'instructors:delete', 'users:update']);

  // Update instructor status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ instructorId, status }) => {
      const response = await fetch(buildApiUrl(`/api/admin/instructors/${instructorId}/status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update instructor status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/instructors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/instructors/kpis'] });
      toast({ title: 'Instructor status updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update payout settings mutation
  const updatePayoutMutation = useMutation({
    mutationFn: async ({ instructorId, settings }) => {
      const response = await fetch(buildApiUrl(`/api/admin/instructors/${instructorId}/payout-settings`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payout settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/instructors'] });
      setShowPayoutDialog(false);
      toast({ title: 'Payout settings updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleStatusChange = (instructorId, newStatus) => {
    updateStatusMutation.mutate({ instructorId, status: newStatus });
  };

  const handlePayoutSettings = (instructor) => {
    setSelectedInstructor(instructor);
    setPayoutSettings({
      percentage: instructor.payoutSettings?.percentage || 70,
      method: instructor.payoutSettings?.method || 'bank_transfer',
      email: instructor.payoutSettings?.email || instructor.email
    });
    setShowPayoutDialog(true);
  };

  const handleUpdatePayoutSettings = () => {
    if (selectedInstructor) {
      updatePayoutMutation.mutate({
        instructorId: selectedInstructor._id,
        settings: payoutSettings
      });
    }
  };

  if (isLoading || kpiLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Instructor Management</h1>
            <p className="text-gray-600">Manage instructors, their courses, and performance</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Instructor Management</h1>
          <p className="text-gray-600">Manage instructors, their courses, and performance</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Instructor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData?.totalActiveInstructors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently teaching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData?.pendingApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Instructor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData?.topInstructor?.totalStudents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpiData?.topInstructor ? `${kpiData.topInstructor.firstName} ${kpiData.topInstructor.lastName}` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${kpiData?.totalInstructorRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated by instructors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search instructors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {/* Instructors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Instructors ({instructors.length})</CardTitle>
          <CardDescription>
            Manage instructor accounts and their course assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {instructors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No instructors found</p>
              <p className="text-sm">Click "Add Instructor" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Instructor</th>
                    <th className="text-left p-4">Courses</th>
                    <th className="text-left p-4">Students</th>
                    <th className="text-left p-4">Rating</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Revenue</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map((instructor) => (
                    <tr key={instructor._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {instructor.firstName?.charAt(0)}{instructor.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {instructor.firstName} {instructor.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{instructor.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{instructor.assignedCoursesCount}</span>
                          <span className="text-sm text-gray-500">courses</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{instructor.totalStudents}</span>
                          <span className="text-sm text-gray-500">students</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{instructor.averageRating || 0}</span>
                          <span className="text-sm text-gray-500">/5</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(instructor.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">${instructor.totalRevenue?.toLocaleString() || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInstructor(instructor)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAssignCoursesDialog(true)}
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePayoutSettings(instructor)}
                          >
                            <PayoutIcon className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Manage Instructor</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Choose an action for {instructor.firstName} {instructor.lastName}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="space-y-2">
                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => setSelectedInstructor(instructor)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => setShowAssignCoursesDialog(true)}
                                >
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Assign Courses
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => handlePayoutSettings(instructor)}
                                >
                                  <PayoutIcon className="h-4 w-4 mr-2" />
                                  Manage Payouts
                                </Button>
                                {instructor.status === 'active' ? (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-orange-600"
                                    onClick={() => handleStatusChange(instructor._id, 'inactive')}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-green-600"
                                    onClick={() => handleStatusChange(instructor._id, 'active')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activate
                                  </Button>
                                )}
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Close</AlertDialogCancel>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Settings Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Settings</DialogTitle>
            <DialogDescription>
              Configure payout settings for {selectedInstructor?.firstName} {selectedInstructor?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Payout Percentage</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={payoutSettings.percentage}
                onChange={(e) => setPayoutSettings(prev => ({ ...prev, percentage: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payout Method</label>
              <select
                className="w-full p-2 border rounded-md"
                value={payoutSettings.method}
                onChange={(e) => setPayoutSettings(prev => ({ ...prev, method: e.target.value }))}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Payout Email</label>
              <Input
                type="email"
                value={payoutSettings.email}
                onChange={(e) => setPayoutSettings(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayoutSettings} disabled={updatePayoutMutation.isPending}>
              {updatePayoutMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInstructors;