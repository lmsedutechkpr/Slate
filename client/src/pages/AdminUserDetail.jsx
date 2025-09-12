import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { useRealtimeInvalidate } from '../lib/useRealtimeInvalidate.js';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { 
  ArrowLeft,
  Edit,
  Save,
  X,
  GraduationCap,
  Shield,
  Users,
  Calendar,
  Mail,
  User,
  Award,
  ShoppingCart,
  FileText
} from 'lucide-react';

const AdminUserDetail = () => {
  const { accessToken } = useAuth();
  const [, setLocation] = useLocation();
  const { userId } = useParams();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch user data from API
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/admin/users', userId, accessToken],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/admin/users/${userId}`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      return response.json();
    },
    enabled: !!accessToken && !!userId,
  });

  // Real-time updates
  useRealtimeInvalidate(['/api/admin/users'], ['users:update', 'users:create', 'users:delete']);

  // Update admin notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (notes) => {
      const response = await fetch(buildApiUrl(`/api/admin/users/${userId}/notes`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes: notes })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update admin notes');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', userId] });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating notes:', error);
    }
  });

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(adminNotes);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student': return <GraduationCap className="h-5 w-5" />;
      case 'instructor': return <Users className="h-5 w-5" />;
      case 'admin': return <Shield className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/admin/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/admin/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/admin/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {user.profile?.firstName && user.profile?.lastName
                ? `${user.profile.firstName} ${user.profile.lastName}`
                : user.username
              }
            </h1>
            <p className="text-gray-600">@{user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2"
          >
            {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          {isEditing && (
            <Button 
              onClick={handleSaveNotes}
              disabled={updateNotesMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateNotesMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* User Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                {getRoleIcon(user.role)}
              </div>
              <div>
                <div className="font-medium text-lg">
                  {user.profile?.firstName && user.profile?.lastName
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.username
                  }
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleIcon(user.role)}
                  <span className="text-sm capitalize">{user.role}</span>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Join Date</Label>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Calendar className="h-4 w-4" />
                  {formatDate(user.createdAt)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Last Login</Label>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Calendar className="h-4 w-4" />
                  {formatDate(user.lastLogin)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{user.enrollments?.length || 0}</div>
                  <div className="text-sm text-gray-600">Courses Enrolled</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {user.enrollments?.reduce((sum, e) => sum + (e.progressPct || 0), 0) / (user.enrollments?.length || 1) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Average Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{user.purchases?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Purchases</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(user.purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="enrollments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notes">Admin Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollments</CardTitle>
              <CardDescription>
                Track user's learning progress across all enrolled courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.enrollments && user.enrollments.length > 0 ? (
                <div className="space-y-4">
                  {user.enrollments.map((enrollment, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-lg">{enrollment.courseId?.title}</h4>
                        <Badge variant="outline">{enrollment.progressPct}% Complete</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Enrolled: {formatDate(enrollment.enrolledAt)}</span>
                          <span>{enrollment.progressPct}% Complete</span>
                        </div>
                        <Progress value={enrollment.progressPct} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No course enrollments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                All purchases made by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.purchases && user.purchases.length > 0 ? (
                <div className="space-y-4">
                  {user.purchases.map((purchase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-lg">{purchase.productName}</h4>
                          <p className="text-sm text-gray-600">Order ID: {purchase.orderId}</p>
                          <p className="text-sm text-gray-500">{formatDate(purchase.purchaseDate)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(purchase.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No purchases found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Recent activity and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Activity tracking coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>
                Private notes about this user (only visible to administrators)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-notes">Notes</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add notes about this user..."
                    value={isEditing ? adminNotes : (user.adminNotes || '')}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-[120px]"
                    disabled={!isEditing}
                  />
                </div>
                {isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button>
                      Save Notes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserDetail;
