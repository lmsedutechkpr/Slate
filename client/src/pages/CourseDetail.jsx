import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl, getImageUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { 
  Play, 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  CheckCircle, 
  Lock, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Download,
  Share2,
  Bookmark,
  Calendar,
  Award,
  ArrowRight,
  TrendingUp,
  Globe,
  Zap,
  Shield,
  Heart,
  Eye,
  ChevronRight,
  PlayCircle,
  Pause,
  Volume2,
  Maximize,
  Settings
} from 'lucide-react';

const CourseDetail = () => {
  const { user, accessToken, authenticatedFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentLecture, setCurrentLecture] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(false);
  
  // Get course ID from URL
  const courseId = window.location.pathname.split('/').pop();
  
  const queryClient = useQueryClient();

  // Fetch course details
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['/api/courses', courseId, accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId}`));
      if (!response.ok) throw new Error('Failed to fetch course');
      return response.json();
    },
    enabled: !!accessToken && !!courseId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch enrollment status
  const { data: enrollmentData } = useQuery({
    queryKey: ['/api/enrollments', courseId, accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/enrollments/${courseId}`));
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!accessToken && !!courseId,
    refetchInterval: 30000, // Real-time enrollment status updates
  });

  // Fetch course reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/courses', courseId, 'reviews', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId}/reviews`));
      if (!response.ok) return { reviews: [] };
      return response.json();
    },
    enabled: !!accessToken && !!courseId,
    refetchInterval: 30000, // Real-time reviews updates
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId}/enroll`), {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to enroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/enrollments', courseId]);
      queryClient.invalidateQueries(['/api/courses', courseId]);
    },
  });

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review }),
      });
      if (!response.ok) throw new Error('Failed to submit review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/courses', courseId, 'reviews']);
      queryClient.invalidateQueries(['/api/courses', courseId]); // Update course rating
      setShowReviewForm(false);
      setRating(0);
      setReview('');
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId}/bookmark`), {
        method: isBookmarked ? 'DELETE' : 'POST',
      });
      if (!response.ok) throw new Error('Failed to update bookmark');
      return response.json();
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
    },
  });

  // Share course functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: course.title,
          text: course.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const course = courseData?.course;
  const enrollment = enrollmentData?.enrollment;
  const reviews = reviewsData?.reviews || [];
  const isEnrolled = !!enrollment;

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>Course not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDuration = (hours) => {
    if (!hours) return 'Duration varies';
    return `${hours}h`;
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalLectures = course.sections?.reduce((total, section) => 
    total + (section.lectures?.length || 0), 0) || 0;

  const completedLectures = enrollment?.completedLectures?.length || 0;
  const progressPercentage = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Course Header */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <span>Courses</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{course.category || 'General'}</span>
              </div>

              {/* Course Title and Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Badge className={`${getLevelColor(course.level)} px-3 py-1`}>
                      {course.level || 'Beginner'}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {course.category || 'General'}
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{course.title}</h1>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">{course.description}</p>
                </div>
              </div>

              {/* Course Stats Row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium">{course.enrollmentCount || 0} students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">{totalLectures} lessons</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium">{formatDuration(course.estimatedHours)}</span>
                </div>
                {course.rating?.average > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-600 fill-current" />
                    </div>
                    <span className="font-medium">{course.rating.average.toFixed(1)} ({course.rating.count} reviews)</span>
                  </div>
                )}
              </div>

              {/* Progress Cards */}
              {isEnrolled && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-3xl font-bold text-primary-600 mb-1">{totalLectures}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Lessons</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-3xl font-bold text-green-600 mb-1">{completedLectures}</div>
                    <div className="text-sm text-gray-600 font-medium">Completed</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{Math.round(progressPercentage)}%</div>
                    <div className="text-sm text-gray-600 font-medium">Progress</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{course.sections?.length || 0}</div>
                    <div className="text-sm text-gray-600 font-medium">Sections</div>
                  </div>
                </div>
              )}
            </div>

            {/* Modern Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">₹{course.price || 0}</div>
                    <CardDescription className="text-base">
                      {course.price > 0 ? 'One-time payment' : 'Free course'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEnrolled ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Your Progress</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                      </div>
                      <Button 
                        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800" 
                        onClick={() => setActiveTab('content')}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Continue Learning
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800" 
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isLoading}
                    >
                      {enrollMutation.isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Enrolling...
                        </div>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Enroll Now
                        </>
                      )}
                    </Button>
                  )}
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 border-gray-200 hover:bg-gray-50"
                      onClick={() => bookmarkMutation.mutate()}
                      disabled={bookmarkMutation.isLoading}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
                      {isBookmarked ? 'Saved' : 'Save'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 border-gray-200 hover:bg-gray-50"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Full lifetime access</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Download className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Downloadable resources</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Certificate of completion</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modern Course Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 w-fit bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200 rounded-2xl p-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="content" 
                className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-200"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-200"
              >
                <Star className="w-4 h-4 mr-2" />
                Reviews
              </TabsTrigger>
              <TabsTrigger 
                value="instructor" 
                className="data-[state=active]:bg-primary-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium transition-all duration-200"
              >
                <Users className="w-4 h-4 mr-2" />
                Instructor
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* What You'll Learn */}
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold flex items-center">
                      <TrendingUp className="w-6 h-6 mr-3 text-primary-600" />
                      What you'll learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.learningObjectives?.map((objective, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border border-green-100">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700">{objective}</span>
                        </div>
                      )) || (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No learning objectives specified</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Course Description */}
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold flex items-center">
                      <BookOpen className="w-6 h-6 mr-3 text-primary-600" />
                      Course description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Course Features */}
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-primary-600" />
                      Course features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">Level</span>
                      <Badge className={`${getLevelColor(course.level)} px-3 py-1`}>
                        {course.level || 'Beginner'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">Category</span>
                      <Badge variant="outline" className="px-3 py-1">{course.category || 'General'}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">Language</span>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">English</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">Last updated</span>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {new Date(course.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Stats */}
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                      Course statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Students enrolled</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{course.enrollmentCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Total lessons</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{totalLectures}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Duration</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">{formatDuration(course.estimatedHours)}</span>
                    </div>
                    {course.rating?.average > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                        <div className="flex items-center space-x-3">
                          <Star className="w-5 h-5 text-yellow-600 fill-current" />
                          <span className="text-sm font-medium text-gray-700">Average rating</span>
                        </div>
                        <span className="text-lg font-bold text-yellow-600">{course.rating.average.toFixed(1)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-8">
            {isEnrolled ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Video Player */}
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                      {currentLecture ? (
                        <div className="relative group">
                          <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                            <video 
                              className="w-full h-full"
                              controls
                              src={currentLecture.videoUrl}
                              onPlay={() => setIsVideoPlaying(true)}
                              onPause={() => setIsVideoPlaying(false)}
                              onTimeUpdate={(e) => {
                                const progress = (e.target.currentTime / e.target.duration) * 100;
                                setVideoProgress(progress);
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          {/* Video Overlay Info */}
                          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {currentLecture.title}
                          </div>
                          {/* Video Controls Overlay */}
                          <div className="absolute bottom-4 right-4 flex space-x-2">
                            <Button size="sm" variant="secondary" className="bg-black/70 text-white hover:bg-black/80">
                              <Volume2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="secondary" className="bg-black/70 text-white hover:bg-black/80">
                              <Maximize className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Play className="w-10 h-10 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to start learning?</h3>
                            <p className="text-gray-600">Select a lecture from the course content to begin</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    {currentLecture && (
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl">{currentLecture.title}</CardTitle>
                        <CardDescription className="text-base">
                          {currentLecture.description || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                    )}
                  </Card>
                </div>

                {/* Enhanced Course Content */}
                <div>
                  <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
                        Course content
                      </CardTitle>
                      <CardDescription className="text-base">
                        {totalLectures} lessons • {formatDuration(course.estimatedHours)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {course.sections?.map((section, sectionIndex) => (
                          <div key={section._id} className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
                              <h4 className="font-semibold text-primary-900">{section.title}</h4>
                              <p className="text-sm text-primary-700 mt-1">
                                {section.lectures?.length || 0} lectures • {section.estimatedDuration || 'Duration varies'}
                              </p>
                            </div>
                            <div className="p-2">
                              {section.lectures?.map((lecture, lectureIndex) => {
                                const isCompleted = enrollment?.completedLectures?.includes(lecture._id);
                                const isCurrent = currentLecture?._id === lecture._id;
                                
                                return (
                                  <div
                                    key={lecture._id}
                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 ${
                                      isCurrent
                                        ? 'bg-primary-100 border-2 border-primary-300 shadow-sm'
                                        : isCompleted
                                        ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                                        : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                    }`}
                                    onClick={() => setCurrentLecture(lecture)}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isCompleted 
                                          ? 'bg-green-500 text-white' 
                                          : isCurrent 
                                          ? 'bg-primary-500 text-white' 
                                          : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {isCompleted ? (
                                          <CheckCircle className="w-4 h-4" />
                                        ) : (
                                          <Play className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${
                                          isCurrent ? 'text-primary-900' : 'text-gray-900'
                                        }`}>
                                          {lecture.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {lecture.duration || '5:00'}
                                        </p>
                                      </div>
                                      {isCompleted && (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-12 h-12 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Enroll to access course content
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Get access to all lectures, assignments, and course materials. Start your learning journey today!
                  </p>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isLoading}
                  >
                    {enrollMutation.isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Enrolling...
                      </div>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Enroll Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Student reviews</h3>
                <p className="text-gray-600 mt-1">
                  {reviews.length} reviews • {course.rating?.average?.toFixed(1) || 0} average rating
                </p>
              </div>
              {isEnrolled && (
                <Button 
                  onClick={() => setShowReviewForm(true)}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write a review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold flex items-center">
                    <Star className="w-5 h-5 mr-2 text-primary-600" />
                    Write a review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Rating</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`w-8 h-8 ${
                              star <= rating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Review</label>
                    <Textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your experience with this course..."
                      className="min-h-[120px] border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                      rows={4}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => reviewMutation.mutate()}
                      disabled={reviewMutation.isLoading || rating === 0}
                      className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                    >
                      {reviewMutation.isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </div>
                      ) : (
                        'Submit Review'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowReviewForm(false)}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review._id} className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-lg">
                            {review.user?.profile?.firstName?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="font-semibold text-gray-900">
                              {review.user?.profile?.firstName} {review.user?.profile?.lastName}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{review.review}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600">Be the first to share your experience with this course!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Instructor Tab */}
          <TabsContent value="instructor" className="space-y-8">
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl font-bold">
                      {course.assignedInstructor?.profile?.firstName?.[0] || 'I'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {course.assignedInstructor?.profile?.firstName} {course.assignedInstructor?.profile?.lastName}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {course.assignedInstructor?.profile?.bio || 'Experienced instructor with expertise in this field.'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {course.assignedInstructor?.stats?.totalStudents || 0}
                          </div>
                          <div className="text-sm text-gray-600">Students taught</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50 border border-green-100">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {course.assignedInstructor?.stats?.totalCourses || 0}
                          </div>
                          <div className="text-sm text-gray-600">Courses created</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-yellow-600 fill-current" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-600">
                            {course.assignedInstructor?.stats?.averageRating?.toFixed(1) || 0}
                          </div>
                          <div className="text-sm text-gray-600">Average rating</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CourseDetail;

