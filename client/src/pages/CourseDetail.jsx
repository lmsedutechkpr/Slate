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
  Award
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Course Header */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2">
            <div className="flex items-start space-x-4 mb-6">
              {course.coverUrl && (
                <img 
                  src={getImageUrl(course.coverUrl, buildApiUrl(''))}
                  alt={course.title}
                  className="w-32 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Badge className={`${getLevelColor(course.level)} px-3 py-1`}>
                    {course.level || 'Beginner'}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {course.category || 'General'}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.enrollmentCount || 0} students enrolled
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
                      {course.rating.average.toFixed(1)} ({course.rating.count} reviews)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Course Stats */}
            {isEnrolled && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-primary-600">{totalLectures}</div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">{completedLectures}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">{course.sections?.length || 0}</div>
                  <div className="text-sm text-gray-600">Sections</div>
                </div>
              </div>
            )}
          </div>

          {/* Enrollment Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">₹{course.price || 0}</CardTitle>
                <CardDescription>
                  {course.price > 0 ? 'One-time payment' : 'Free course'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEnrolled ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setActiveTab('content')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isLoading}
                  >
                    {enrollMutation.isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enrolling...
                      </div>
                    ) : (
                      'Enroll Now'
                    )}
                  </Button>
                )}
                
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Full lifetime access
                  </div>
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-2 text-blue-500" />
                    Downloadable resources
                  </div>
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-2 text-purple-500" />
                    Certificate of completion
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Course Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="instructor">Instructor</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>What you'll learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.learningObjectives?.map((objective, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{objective}</span>
                      </div>
                    )) || (
                      <div className="text-gray-500">No learning objectives specified</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Course description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Level</span>
                    <Badge className={getLevelColor(course.level)}>
                      {course.level || 'Beginner'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Category</span>
                    <Badge variant="outline">{course.category || 'General'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Language</span>
                    <span className="text-sm font-medium">English</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last updated</span>
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
                          <p className="text-gray-600">Select a lecture to start learning</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
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
                    <div className="space-y-2">
                      {course.sections?.map((section, sectionIndex) => (
                        <div key={section._id} className="border rounded-lg">
                          <div className="p-3 bg-gray-50 border-b">
                            <h4 className="font-medium">{section.title}</h4>
                            <p className="text-sm text-gray-600">
                              {section.lectures?.length || 0} lectures
                            </p>
                          </div>
                          <div className="p-2">
                            {section.lectures?.map((lecture, lectureIndex) => (
                              <div
                                key={lecture._id}
                                className={`p-2 rounded cursor-pointer transition-colors ${
                                  currentLecture?._id === lecture._id
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setCurrentLecture(lecture)}
                              >
                                <div className="flex items-center space-x-2">
                                  <Play className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm flex-1">{lecture.title}</span>
                                  <span className="text-xs text-gray-500">
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
              <CardContent className="p-8 text-center">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Enroll to access course content
                </h3>
                <p className="text-gray-600 mb-4">
                  Get access to all lectures, assignments, and course materials
                </p>
                <Button onClick={() => enrollMutation.mutate()}>
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
              <h3 className="text-lg font-medium">Student reviews</h3>
              <p className="text-sm text-gray-600">
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
                  <label className="text-sm font-medium">Rating</label>
                  <div className="flex space-x-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-2xl"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Review</label>
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience with this course..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div className="flex space-x-2">
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
            {reviews.map((review) => (
              <Card key={review._id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {review.user?.profile?.firstName?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">
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
                      <p className="text-gray-700">{review.review}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Instructor Tab */}
        <TabsContent value="instructor" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-xl font-bold">
                    {course.assignedInstructor?.profile?.firstName?.[0] || 'I'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {course.assignedInstructor?.profile?.firstName} {course.assignedInstructor?.profile?.lastName}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {course.assignedInstructor?.profile?.bio || 'Experienced instructor with expertise in this field.'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.assignedInstructor?.stats?.totalStudents || 0} students
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.assignedInstructor?.stats?.totalCourses || 0} courses
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {course.assignedInstructor?.stats?.averageRating?.toFixed(1) || 0} rating
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetail;

