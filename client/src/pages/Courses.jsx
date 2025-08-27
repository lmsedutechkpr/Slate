import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { Search, BookOpen, Users, Clock, Star, Filter } from 'lucide-react';

const Courses = () => {
  const { accessToken } = useAuth();
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

  // Fetch all courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses', { search: debouncedSearchTerm, category: selectedCategory, level: selectedLevel }, accessToken],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel && selectedLevel !== 'all') params.append('level', selectedLevel);
      
      const response = await fetch(`/api/courses?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  // Fetch enrolled courses
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments', accessToken],
    queryFn: async () => {
      const response = await fetch('/api/enrollments', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Fetch recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['/api/recommendations', accessToken],
    queryFn: async () => {
      const response = await fetch('/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  const courses = coursesData?.courses || [];
  const enrollments = enrollmentsData?.enrollments || [];
  const recommendations = recommendationsData?.courses || [];

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
      <Card className="card-hover" data-testid={`course-card-${course._id}`}>
        <CardHeader className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {course.title}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {course.description}
              </CardDescription>
            </div>
            {course.coverUrl && (
              <img 
                src={course.coverUrl}
                alt={course.title}
                className="w-16 h-12 object-cover rounded-lg ml-4"
              />
            )}
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={getLevelColor(course.level)}>
              {course.level || 'Beginner'}
            </Badge>
            {course.price > 0 && (
              <Badge variant="outline">₹{course.price}</Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {course.enrollmentCount || 0}
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {totalLectures} lessons
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDuration(course.estimatedHours)}
            </div>
            {course.rating?.average > 0 && (
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                {course.rating.average.toFixed(1)}
              </div>
            )}
          </div>
          
          {isEnrolled && enrollment && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{Math.round(enrollment.progressPct || 0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${enrollment.progressPct || 0}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              by {course.assignedInstructor?.username || 'Instructor'}
            </div>
            <Button 
              size="sm"
              variant={isEnrolled ? "outline" : "default"}
              data-testid={`button-${isEnrolled ? 'continue' : 'enroll'}-${course._id}`}
              onClick={async () => {
                if (isEnrolled) return;
                try {
                  const res = await fetch(`/api/courses/${course._id}/enroll`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                  })
                  if (!res.ok) throw new Error('Enroll failed')
                  window.location.reload()
                } catch (e) {
                  console.error(e)
                }
              }}
            >
              {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (coursesLoading || enrollmentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
        <p className="text-gray-600">Discover and continue your learning journey</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-courses"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
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
      </div>

      {/* Course Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-fit">
          <TabsTrigger value="all" data-testid="tab-all-courses">
            All Courses
          </TabsTrigger>
          <TabsTrigger value="enrolled" data-testid="tab-enrolled-courses">
            My Courses ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="recommended" data-testid="tab-recommended-courses">
            Recommended
          </TabsTrigger>
        </TabsList>

        {/* All Courses */}
        <TabsContent value="all" className="space-y-6">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
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
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses</h3>
              <p className="text-gray-600 mb-4">Start learning by enrolling in a course</p>
              <Button onClick={() => setActiveTab('all')}>
                Browse Courses
              </Button>
            </div>
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
            <div className="text-center py-12">
              <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
              <p className="text-gray-600 mb-4">Complete your profile to get personalized recommendations</p>
              <Button onClick={() => window.location.href = '/profile'}>
                Update Profile
              </Button>
            </div>
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
  );
};

export default Courses;
