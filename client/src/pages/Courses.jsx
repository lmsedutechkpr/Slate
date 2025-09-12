import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useAuth } from '../hooks/useAuth.js';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { getImageUrl, buildApiUrl } from '@/lib/utils.js';
import { 
  Search, 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Filter, 
  Play,
  Eye,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';

const Courses = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to avoid refetch on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 700);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch all courses with real-time updates
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses', { search: debouncedSearchTerm, category: selectedCategory, level: selectedLevel }, accessToken],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel && selectedLevel !== 'all') params.append('level', selectedLevel);
      
      const response = await authenticatedFetch(buildApiUrl(`/api/courses?${params.toString()}`));
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    enabled: !!accessToken,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch enrolled courses with real-time updates
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/enrollments'));
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      return response.json();
    },
    enabled: !!accessToken,
    refetchInterval: 30000,
  });

  // Fetch recommendations with real-time updates
  const { data: recommendationsData } = useQuery({
    queryKey: ['/api/recommendations', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/recommendations'));
      if (!response.ok) return { courses: [] };
      return response.json();
    },
    enabled: !!accessToken,
    refetchInterval: 30000,
  });

  useRealtimeInvalidate([
    ['/api/courses'],
    ['/api/enrollments'],
    ['/api/recommendations']
  ], ['courses', 'enrollments', 'recommendations']);

  const courses = coursesData?.courses || [];
  const enrollments = enrollmentsData?.enrollments || [];
  const recommendations = recommendationsData?.courses || [];

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-50 text-green-600 border-green-200';
      case 'intermediate': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'advanced': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const formatDuration = (hours) => {
    if (!hours) return 'Duration varies';
    return `${hours}h`;
  };

  const CourseCard = ({ course, isEnrolled = false, enrollment = null }) => {
    if (!course) return null;
    const safeSections = (course && Array.isArray(course.sections)) ? course.sections : [];
    const totalLectures = safeSections.reduce((total, section) => 
      total + (section.lectures?.length || 0), 0) || 0;

    return (
      <Card 
        className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 cursor-pointer group" 
        data-testid={`course-card-${course._id}`}
        onClick={() => setLocation(`/courses/${course._id}`)}
      >
        <CardHeader className="p-6 pb-4">
          <div className="flex items-start space-x-4 mb-4">
            {course.coverUrl && (
              <img 
                src={getImageUrl(course.coverUrl, buildApiUrl(''))}
                alt={course.title}
                className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary-600 transition-colors">
                {course.title}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {course.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Badge className={`border ${getLevelColor(course.level)}`}>
              {course.level || 'Beginner'}
            </Badge>
            {course.price > 0 && (
              <Badge variant="outline" className="font-medium">₹{course.price}</Badge>
            )}
            {course.price === 0 && (
              <Badge className="bg-green-50 text-green-600 border-green-200">Free</Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-gray-400" />
              {course.enrollmentCount || 0} students
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
              {totalLectures} lessons
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              {formatDuration(course.estimatedHours)}
            </div>
            {course.rating?.average > 0 && (
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                {course.rating.average.toFixed(1)} ({course.rating.count})
              </div>
            )}
          </div>
          
          {isEnrolled && enrollment && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.round(enrollment.progressPct || 0)}%
                </span>
              </div>
              <ProgressBar 
                value={enrollment.progressPct || 0} 
                className="h-2 bg-gray-100"
              />
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              by {course.assignedInstructor?.profile?.firstName || course.assignedInstructor?.username || 'Instructor'}
            </div>
            <Button 
              size="sm"
              variant={isEnrolled ? "outline" : "default"}
              className="flex-shrink-0"
              data-testid={`button-${isEnrolled ? 'continue' : 'enroll'}-${course._id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isEnrolled) {
                  setLocation(`/courses/${course._id}`);
                  return;
                }
                // Enroll logic
                (async () => {
                  try {
                    const res = await authenticatedFetch(buildApiUrl(`/api/courses/${course._id}/enroll`), {
                    method: 'POST',
                    });
                    if (!res.ok) throw new Error('Enroll failed');
                    window.location.reload();
                } catch (e) {
                    console.error(e);
                  }
                })();
              }}
            >
              {isEnrolled ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Continue Learning
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Enroll Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (coursesLoading || enrollmentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
              <p className="text-gray-600 mt-1">Discover and continue your learning journey</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>
      </div>

      {/* Search and Filters */}
        <Card className="border-0 shadow-sm bg-white mb-8">
          <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                    placeholder="Search courses by title, instructor, or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-courses"
              />
            </div>
          </div>
          
              <div className="flex gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="programming">Programming</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="data-science">Data Science</SelectItem>
                <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
          </CardContent>
        </Card>

      {/* Course Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-fit bg-white shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
            All Courses
          </TabsTrigger>
            <TabsTrigger value="enrolled" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
            My Courses ({enrollments.length})
          </TabsTrigger>
            <TabsTrigger value="recommended" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
            Recommended
          </TabsTrigger>
        </TabsList>

        {/* All Courses */}
        <TabsContent value="all" className="space-y-6">
          {courses.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                  <Button onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                  }}>
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const enrollment = enrollments.find(e => e && e.courseId && e.courseId._id === course._id);
                return (
                  <CourseCard
                    key={course._id}
                    course={course}
                    isEnrolled={!!enrollment}
                    enrollment={enrollment}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Enrolled Courses */}
        <TabsContent value="enrolled" className="space-y-6">
          {enrollments.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No enrolled courses</h3>
              <p className="text-gray-600 mb-4">Start learning by enrolling in a course</p>
              <Button onClick={() => setActiveTab('all')}>
                    <Eye className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
                </CardContent>
              </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <CourseCard
                  key={enrollment._id}
                  course={enrollment.courseId}
                  isEnrolled={true}
                  enrollment={enrollment}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recommended Courses */}
        <TabsContent value="recommended" className="space-y-6">
          {recommendations.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations yet</h3>
              <p className="text-gray-600 mb-4">Complete your profile to get personalized recommendations</p>
              <Button onClick={() => window.location.href = '/profile'}>
                    <Award className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
                </CardContent>
              </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((course) => {
                const enrollment = enrollments.find(e => e && e.courseId && e.courseId._id === course._id);
                return (
                  <CourseCard
                    key={course._id}
                    course={course}
                    isEnrolled={!!enrollment}
                    enrollment={enrollment}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Courses;
