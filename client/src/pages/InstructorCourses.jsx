import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, TrendingUp, Video, FileText, BookMarked, Upload, Edit3, Eye } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';

const InstructorCourses = () => {
  const { accessToken, user } = useAuth();
  const [location, setLocation] = useLocation();
  
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

  if (isLoading) return <LoadingSpinner />;

  const courses = coursesData?.courses || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Content Management</h1>
          <p className="text-gray-600">Manage course materials, lectures, and content for your assigned courses</p>
        </div>
        <div className="flex gap-2">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses assigned</h3>
            <p className="text-gray-600 mb-6">
              Contact admin to get assigned to courses for content management
            </p>
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
