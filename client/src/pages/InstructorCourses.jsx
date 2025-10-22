import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, Calendar, TrendingUp, Video, FileText, BookMarked, Upload, Edit3, Eye, Plus } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';

const InstructorCourses = () => {
  const { accessToken, user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    language: 'English',
    price: 0,
    tags: []
  });
  
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['instructor-courses', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/courses'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { courses: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
  });

  useRealtimeInvalidate([
    ['instructor-courses', user?._id]
  ], ['courses']);

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      const res = await fetch(buildApiUrl('/api/courses'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });
      if (!res.ok) throw new Error('Failed to create course');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructor-courses', user?._id]);
      setIsCreateDialogOpen(false);
      setNewCourse({
        title: '',
        description: '',
        category: '',
        level: 'beginner',
        language: 'English',
        price: 0,
        tags: []
      });
      toast({ title: 'Course created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create course', description: error.message, variant: 'destructive' });
    }
  });

  const handleCreateCourse = () => {
    if (!newCourse.title || !newCourse.description) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    createCourseMutation.mutate(newCourse);
  };

  if (isLoading) return <LoadingSpinner />;

  const courses = coursesData?.courses || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Content Management</h1>
          <p className="text-gray-600">Create and manage your courses, materials, lectures, and content</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Create a new course to start teaching and managing content.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter course title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what students will learn"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Web Development"
                    />
                  </div>
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Select value={newCourse.level} onValueChange={(value) => setNewCourse(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      value={newCourse.language}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, language: e.target.value }))}
                      placeholder="English"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCourse}
                  disabled={createCourseMutation.isPending}
                >
                  {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload Materials
          </Button>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Assigned Courses</p>
                <p className="text-2xl font-bold">{courses?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">
                  {courses?.reduce((total, course) => total + (course.enrolledStudents || 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Materials Uploaded</p>
                <p className="text-2xl font-bold">
                  {courses?.reduce((total, course) => total + (course.materials?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Live Sessions</p>
                <p className="text-2xl font-bold">
                  {courses?.reduce((total, course) => total + (course.liveSessions?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Courses */}
      {courses?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first course to start teaching and managing content.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course) => (
            <Card key={course._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>{course.enrolledStudents || 0} students</span>
                  <span>{course.lessons?.length || 0} lessons</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLocation(`/instructor/courses/${course._id}`)}
                  >
                    <BookMarked className="w-4 h-4 mr-1" />
                    Manage Content
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLocation(`/instructor/courses/${course._id}/materials`)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload Materials
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorCourses;
