import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { useRealtimeInvalidate } from '../lib/useRealtimeInvalidate.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Star,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Edit,
  Settings,
  BarChart3,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminInstructorDetail = () => {
  const { instructorId } = useParams();
  const [, setLocation] = useLocation();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutSettings, setPayoutSettings] = useState({
    percentage: 70,
    method: 'bank_transfer',
    email: ''
  });

  // Fetch instructor details
  const { data: instructorData, isLoading, isFetching } = useQuery({
    queryKey: ['/api/admin/instructors', instructorId, accessToken],
    queryFn: async () => {
      console.log(`Fetching instructor details for: ${instructorId}`);
      const response = await fetch(buildApiUrl(`/api/admin/instructors/${instructorId}`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch instructor details');
      }
      
      const data = await response.json();
      console.log('Instructor details fetched:', data);
      return data;
    },
    enabled: !!accessToken && !!instructorId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const instructor = instructorData?.instructor;
  const assignedCourses = instructorData?.assignedCourses || [];
  const reviews = instructorData?.reviews || [];
  const monthlyAnalytics = instructorData?.monthlyAnalytics || [];
  const totalReviews = instructorData?.totalReviews || 0;

  // Real-time updates
  useRealtimeInvalidate(
    ['/api/admin/instructors', `/api/admin/instructors/${instructorId}`], 
    ['instructors:update', 'instructors:create', 'instructors:delete', 'users:update', 'courses:update', 'enrollments:update']
  );

  // Update payout settings mutation
  const updatePayoutMutation = useMutation({
    mutationFn: async (settings) => {
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/instructors', instructorId] });
      setShowPayoutDialog(false);
      toast({ title: 'Payout settings updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Initialize payout settings when instructor data loads
  useEffect(() => {
    if (instructor) {
      setPayoutSettings({
        percentage: instructor.payoutSettings?.percentage || 70,
        method: instructor.payoutSettings?.method || 'bank_transfer',
        email: instructor.payoutSettings?.email || instructor.email
      });
    }
  }, [instructor]);

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

  const handleUpdatePayoutSettings = () => {
    updatePayoutMutation.mutate(payoutSettings);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/admin/instructors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Instructors
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/admin/instructors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Instructors
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Instructor not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/admin/instructors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Instructors
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {instructor.firstName} {instructor.lastName}
            </h1>
            <p className="text-gray-600">Instructor Profile & Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/instructors', instructorId] })}
            title="Refresh data"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          {getStatusBadge(instructor.status)}
          <Button variant="outline" onClick={() => setShowPayoutDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Payout Settings
          </Button>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructor.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently teaching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instructor.averageRating || 0}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${instructor.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Generated revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="courses">Courses ({assignedCourses.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({instructor.totalStudents})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({totalReviews})</TabsTrigger>
        </TabsList>

        {/* Profile Details Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-xl">
                      {instructor.firstName?.charAt(0)}{instructor.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {instructor.firstName} {instructor.lastName}
                    </h3>
                    <p className="text-gray-600">@{instructor.username}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{instructor.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Joined {new Date(instructor.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Last active {new Date(instructor.lastLogin || instructor.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payout Percentage</span>
                  <span className="text-sm">{instructor.payoutSettings?.percentage || 70}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payout Method</span>
                  <span className="text-sm capitalize">
                    {instructor.payoutSettings?.method || 'bank_transfer'?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payout Email</span>
                  <span className="text-sm">{instructor.payoutSettings?.email || instructor.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Estimated Payout</span>
                  <span className="text-sm font-semibold">
                    ${((instructor.totalRevenue || 0) * (instructor.payoutSettings?.percentage || 70) / 100).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Courses</CardTitle>
              <CardDescription>
                Courses currently assigned to this instructor with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No courses assigned</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignedCourses.map((course) => (
                    <div key={course._id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{course.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{course.enrollments || 0}</p>
                                <p className="text-xs text-gray-500">Students</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">${course.price || 0}</p>
                                <p className="text-xs text-gray-500">Price</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <div>
                                <p className="text-sm font-medium">{course.averageRating || 0}/5</p>
                                <p className="text-xs text-gray-500">Rating</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{course.reviewCount || 0}</p>
                                <p className="text-xs text-gray-500">Reviews</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                            <span>Updated: {new Date(course.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                            {course.status}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/courses/${course._id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Course Progress Bar */}
                      {course.enrollments > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">Course Performance</span>
                            <span className="text-sm text-blue-700">{course.enrollments} enrollments</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((course.enrollments / 100) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>
                Students enrolled in this instructor's courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No courses assigned - no students to display</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignedCourses.map((course) => (
                    <div key={course._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-lg">{course.title}</h4>
                          <p className="text-sm text-gray-600">{course.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{course.enrollments} students</span>
                          </div>
                          <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                            {course.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {course.enrollments > 0 ? (
                        <div className="space-y-3">
                          <h5 className="font-medium text-sm text-gray-700">Enrolled Students:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {course.enrollments?.slice(0, 12).map((enrollment, index) => (
                              <div key={enrollment.student?._id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span className="text-primary-600 font-medium text-sm">
                                    {enrollment.student?.firstName?.charAt(0) || 'S'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {enrollment.student?.firstName} {enrollment.student?.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {enrollment.student?.email}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {course.enrollments?.length > 12 && (
                              <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg">
                                <span className="text-sm text-gray-500">
                                  +{course.enrollments.length - 12} more students
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No students enrolled in this course</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Enrollment Trends</CardTitle>
                <CardDescription>
                  Monthly student enrollment over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="enrollments" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>
                  Student enrollment by course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assignedCourses.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="enrollments" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Reviews</CardTitle>
              <CardDescription>
                Recent reviews from students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{review.student?.firstName} {review.student?.lastName}</h4>
                          <p className="text-sm text-gray-600">Course: {review.courseTitle}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Settings Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Settings</DialogTitle>
            <DialogDescription>
              Configure payout settings for {instructor.firstName} {instructor.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="percentage">Payout Percentage</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                value={payoutSettings.percentage}
                onChange={(e) => setPayoutSettings(prev => ({ ...prev, percentage: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="method">Payout Method</Label>
              <select
                id="method"
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
              <Label htmlFor="email">Payout Email</Label>
              <Input
                id="email"
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

export default AdminInstructorDetail;