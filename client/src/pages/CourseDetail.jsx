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
  Download,
  Share2,
  Bookmark,
  Award,
  ChevronRight,
  Calendar,
  Globe,
  Target,
  BarChart3
} from 'lucide-react';

const CourseDetail = () => {
  const { user, accessToken, authenticatedFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentLecture, setCurrentLecture] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  
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
    refetchInterval: 30000,
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
    refetchInterval: 30000,
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
    refetchInterval: 30000,
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
      queryClient.invalidateQueries(['/api/courses', courseId]);
      setShowReviewForm(false);
      setRating(0);
      setReview('');
    },
  });

  const course = courseData?.course;
  const enrollment = enrollmentData?.enrollment;
  const reviews = reviewsData?.reviews || [];
  const isEnrolled = !!enrollment;

  if (courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      case 'beginner': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'intermediate': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'advanced': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const totalLectures = course.sections?.reduce((total, section) => 
    total + (section.lectures?.length || 0), 0) || 0;

  const completedLectures = enrollment?.completedLectures?.length || 0;
  const progressPercentage = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                <a href="/courses" className="hover:text-gray-700 transition-colors">Courses</a>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{course.category || 'General'}</span>
              </nav>

              {/* Course Header */}
              <div className="flex items-start space-x-6 mb-6">
                {course.coverUrl && (
                  <div className="flex-shrink-0">
                    <img 
                      src={getImageUrl(course.coverUrl, buildApiUrl(''))}
                      alt={course.title}
                      className="w-40 h-28 object-cover rounded-xl shadow-sm"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <Badge className={`${getLevelColor(course.level)} px-3 py-1.5 border`}>
                      {course.level || 'Beginner'}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1.5">
                      {course.category || 'General'}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{course.title}</h1>
                  <p className="text-gray-600 leading-relaxed mb-4">{course.description}</p>
                  
                  {/* Course Stats */}
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="font-medium">{course.enrollmentCount || 0} students enrolled</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-green-500" />
                      <span className="font-medium">{totalLectures} lessons</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="font-medium">{formatDuration(course.estimatedHours)}</span>
                    </div>
                    {course.rating?.average > 0 && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-amber-500 fill-current" />
                        <span className="font-medium">{course.rating.average.toFixed(1)} ({course.rating.count} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              {isEnrolled && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{totalLectures}</div>
                      <div className="text-sm text-gray-600">Total Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">{completedLectures}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">{Math.round(progressPercentage)}%</div>
                      <div className="text-sm text-gray-600">Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">{course.sections?.length || 0}</div>
                      <div className="text-sm text-gray-600">Sections</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enrollment Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">₹{course.price || 0}</div>
                  <CardDescription className="text-base">
                    {course.price > 0 ? 'One-time payment' : 'Free course'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {isEnrolled ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Progress</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                      <Button 
                        className="w-full h-12 text-base font-semibold" 
                        onClick={() => setActiveTab('content')}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Continue Learning
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full h-12 text-base font-semibold" 
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isLoading}
                    >
                      {enrollMutation.isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Enrolling...
                        </div>
                      ) : (
                        'Enroll Now'
                      )}
                    </Button>
                  )}
                  
                  <div className="flex space-x-3">
                    <Button variant="outline" className="flex-1 h-10">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" className="flex-1 h-10">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-3 text-emerald-500" />
                      <span className="text-sm font-medium">Full lifetime access</span>
                    </div>
                    <div className="flex items-center">
                      <Download className="w-5 h-5 mr-3 text-blue-500" />
                      <span className="text-sm font-medium">Downloadable resources</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="w-5 h-5 mr-3 text-amber-500" />
                      <span className="text-sm font-medium">Certificate of completion</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-fit bg-white border border-gray-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Content
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="instructor" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Instructor
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-500" />
                      What you'll learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.learningObjectives?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.learningObjectives.map((objective, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{objective}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No learning objectives specified</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                      Course description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                      Course details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Level</span>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level || 'Beginner'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Category</span>
                      <Badge variant="outline">{course.category || 'General'}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Language</span>
                      <span className="text-sm font-medium">English</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Last updated</span>
                      <span className="text-sm font-medium">
                        {new Date(course.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {isEnrolled ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Player */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-0">
                      {currentLecture ? (
                        <div className="aspect-video bg-black rounded-t-lg">
                          <video 
                            className="w-full h-full"
                            controls
                            src={currentLecture.videoUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                          <div className="text-center">
                            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Select a lecture to start learning</p>
                            <p className="text-sm text-gray-500">Choose from the course content on the right</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    {currentLecture && (
                      <CardHeader>
                        <CardTitle className="text-lg">{currentLecture.title}</CardTitle>
                        {currentLecture.description && (
                          <CardDescription>{currentLecture.description}</CardDescription>
                        )}
                      </CardHeader>
                    )}
                  </Card>
                </div>

                {/* Course Content */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Course content</CardTitle>
                      <CardDescription>
                        {totalLectures} lessons • {formatDuration(course.estimatedHours)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {course.sections?.map((section, sectionIndex) => (
                          <div key={section._id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-3 bg-gray-50 border-b border-gray-200">
                              <h4 className="font-medium text-gray-900">{section.title}</h4>
                              <p className="text-sm text-gray-600">
                                {section.lectures?.length || 0} lectures
                              </p>
                            </div>
                            <div className="p-2">
                              {section.lectures?.map((lecture, lectureIndex) => (
                                <div
                                  key={lecture._id}
                                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                    currentLecture?._id === lecture._id
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                  }`}
                                  onClick={() => setCurrentLecture(lecture)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <Play className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm flex-1 font-medium">{lecture.title}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {lecture.duration || '5:00'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Enroll to access course content
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Get access to all lectures, assignments, and course materials to start your learning journey
                  </p>
                  <Button size="lg" onClick={() => enrollMutation.mutate()}>
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Student reviews</h3>
                <p className="text-gray-600">
                  {reviews.length} reviews • {course.rating?.average?.toFixed(1) || 0} average rating
                </p>
              </div>
              {isEnrolled && (
                <Button onClick={() => setShowReviewForm(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write a review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Write a review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex space-x-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="text-2xl transition-colors hover:scale-110"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              star <= rating 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-gray-300 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Review</label>
                    <Textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your experience with this course..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => reviewMutation.mutate()}
                      disabled={reviewMutation.isLoading || rating === 0}
                    >
                      {reviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review._id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-lg">
                            {review.user?.profile?.firstName?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              {review.user?.profile?.firstName} {review.user?.profile?.lastName}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating 
                                      ? 'fill-amber-400 text-amber-400' 
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
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600">Be the first to share your experience with this course!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Instructor Tab */}
          <TabsContent value="instructor" className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
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
                      <div className="flex items-center space-x-3 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-emerald-600">
                            {course.assignedInstructor?.stats?.totalCourses || 0}
                          </div>
                          <div className="text-sm text-gray-600">Courses created</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg bg-amber-50 border border-amber-100">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-amber-600 fill-current" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-amber-600">
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

