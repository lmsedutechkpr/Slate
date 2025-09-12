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

// Import new components
import EnhancedCourseCard from '../components/Courses/EnhancedCourseCard.jsx';
import SortDropdown from '../components/Courses/SortDropdown.jsx';
import PersonalizedRecommendations from '../components/Courses/PersonalizedRecommendations.jsx';
import { WishlistProvider, useWishlist } from '../contexts/WishlistContext.jsx';
import CourseCardSkeleton from '../components/Common/CourseCardSkeleton.jsx';
import LiveUpdateToast from '../components/Common/LiveUpdateToast.jsx';
import { useRealtimeCourseUpdates } from '../hooks/useRealtimeCourseUpdates.js';

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
  Zap,
  Heart
} from 'lucide-react';

const CoursesContent = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { liveUpdates } = useRealtimeCourseUpdates();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [activeTab, setActiveTab] = useState('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);

  // Debounce search term to avoid refetch on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 700);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Handle live updates and show toasts
  useEffect(() => {
    Object.entries(liveUpdates).forEach(([courseId, update]) => {
      if (update.timestamp > Date.now() - 1000) { // Only show recent updates
        setToasts(prev => [...prev, { id: `${courseId}-${update.timestamp}`, courseId, ...update }]);
      }
    });
  }, [liveUpdates]);

  // Remove toasts after they expire
  useEffect(() => {
    const timer = setInterval(() => {
      setToasts(prev => prev.filter(toast => Date.now() - toast.timestamp < 3000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch all courses with real-time updates
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses', { search: debouncedSearchTerm, category: selectedCategory, level: selectedLevel, sort: sortBy }, accessToken],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel && selectedLevel !== 'all') params.append('level', selectedLevel);
      if (sortBy && sortBy !== 'popular') params.append('sort', sortBy);
      
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

  // Fetch dynamic categories and levels
  const { data: filtersData } = useQuery({
    queryKey: ['/api/courses/filters', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/courses/filters'));
      if (!response.ok) return { categories: [], levels: [] };
      return response.json();
    },
    enabled: !!accessToken,
    refetchInterval: 60000, // Refetch every minute
  });

  useRealtimeInvalidate([
    ['/api/courses'],
    ['/api/enrollments'],
    ['/api/recommendations']
  ], ['courses', 'enrollments', 'recommendations']);

  const courses = coursesData?.courses || [];
  const enrollments = enrollmentsData?.enrollments || [];
  const recommendations = recommendationsData?.courses || [];
  const categories = filtersData?.categories || [];
  const levels = filtersData?.levels || [];

  // Sort courses based on selected sort option
  const getSortedCourses = (coursesList) => {
    if (!coursesList || coursesList.length === 0) return coursesList;

    const sorted = [...coursesList].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating?.average || 0) - (a.rating?.average || 0);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'students':
          return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'popular':
        default:
          return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
      }
    });

    return sorted;
  };

  const sortedCourses = getSortedCourses(courses);
  const sortedRecommendations = getSortedCourses(recommendations);

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-50 text-green-600 border-green-200';
      case 'intermediate': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'advanced': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const res = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId}/enroll`), {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Enroll failed');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
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
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SortDropdown 
              value={sortBy} 
              onValueChange={setSortBy}
            />
          </div>
        </div>
          </CardContent>
        </Card>

      {/* Course Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-fit bg-white shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
            All Courses
          </TabsTrigger>
            <TabsTrigger value="enrolled" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
            My Courses ({enrollments.length})
          </TabsTrigger>
            <TabsTrigger value="wishlist" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
            <Heart className="w-4 h-4 mr-1" />
            Wishlist
          </TabsTrigger>
            <TabsTrigger value="recommended" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
            Recommended
          </TabsTrigger>
        </TabsList>

        {/* All Courses */}
        <TabsContent value="all" className="space-y-6">
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedCourses.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                  <Button onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                    setSortBy('popular');
                  }}>
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCourses.map((course) => {
                const enrollment = enrollments.find(e => e && e.courseId && e.courseId._id === course._id);
                const liveUpdate = liveUpdates[course._id];
                return (
                  <EnhancedCourseCard
                    key={course._id}
                    course={course}
                    isEnrolled={!!enrollment}
                    enrollment={enrollment}
                    isWishlisted={isWishlisted(course._id)}
                    onWishlistToggle={toggleWishlist}
                    onEnroll={handleEnroll}
                    liveUpdate={liveUpdate}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Enrolled Courses */}
        <TabsContent value="enrolled" className="space-y-6">
          {enrollmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
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
              {enrollments.map((enrollment) => {
                const liveUpdate = liveUpdates[enrollment.courseId?._id];
                return (
                  <EnhancedCourseCard
                    key={enrollment._id}
                    course={enrollment.courseId}
                    isEnrolled={true}
                    enrollment={enrollment}
                    isWishlisted={isWishlisted(enrollment.courseId?._id)}
                    onWishlistToggle={toggleWishlist}
                    onEnroll={handleEnroll}
                    liveUpdate={liveUpdate}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist" className="space-y-6">
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : (() => {
            const wishlistedCourses = courses.filter(course => isWishlisted(course._id));
            return wishlistedCourses.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-12 text-center">
                  <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
                  <p className="text-gray-600 mb-4">Save courses you're interested in for later</p>
                  <Button onClick={() => setActiveTab('all')}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistedCourses.map((course) => {
                  const enrollment = enrollments.find(e => e && e.courseId && e.courseId._id === course._id);
                  const liveUpdate = liveUpdates[course._id];
                  return (
                    <EnhancedCourseCard
                      key={course._id}
                      course={course}
                      isEnrolled={!!enrollment}
                      enrollment={enrollment}
                      isWishlisted={true}
                      onWishlistToggle={toggleWishlist}
                      onEnroll={handleEnroll}
                      liveUpdate={liveUpdate}
                    />
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {/* Recommended Courses */}
        <TabsContent value="recommended" className="space-y-6">
          {/* Personalized Recommendations Header */}
          <PersonalizedRecommendations enrollments={enrollments} />
          
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedRecommendations.length === 0 ? (
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
              {sortedRecommendations.map((course) => {
                const enrollment = enrollments.find(e => e && e.courseId && e.courseId._id === course._id);
                const liveUpdate = liveUpdates[course._id];
                return (
                  <EnhancedCourseCard
                    key={course._id}
                    course={course}
                    isEnrolled={!!enrollment}
                    enrollment={enrollment}
                    isWishlisted={isWishlisted(course._id)}
                    onWishlistToggle={toggleWishlist}
                    onEnroll={handleEnroll}
                    liveUpdate={liveUpdate}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Live Update Toasts */}
      {toasts.map((toast) => (
        <LiveUpdateToast
          key={toast.id}
          update={toast}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
      </div>
    </div>
  );
};

const Courses = () => {
  return (
    <WishlistProvider>
      <CoursesContent />
    </WishlistProvider>
  );
};

export default Courses;
