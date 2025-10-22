import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useAuth } from '../hooks/useAuth.js';
import { useLocation } from 'wouter';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  BookOpen,
  Star,
  Eye,
  Send,
  Award
} from 'lucide-react';

const Assignments = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');

  // Comprehensive dummy data for student assignments
  const dummyAssignmentsData = {
    assignments: [
      {
        _id: '1',
        title: 'Build a Personal Portfolio Website',
        courseId: { 
          _id: '1',
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        dueAt: '2024-02-15T23:59:59.000Z',
        submissionStatus: 'pending',
        maxPoints: 100,
        description: 'Create a responsive portfolio website showcasing your projects and skills. Include sections for About, Projects, Skills, and Contact.',
        instructions: [
          'Design a responsive layout using HTML5 and CSS3',
          'Include at least 3 project showcases with descriptions',
          'Add a contact form with validation',
          'Ensure mobile responsiveness',
          'Include a professional headshot and bio'
        ],
        createdAt: '2024-01-15T00:00:00.000Z',
        instructor: { name: 'Sarah Wilson' },
        attachments: [
          { name: 'Portfolio Guidelines.pdf', url: '#', size: '2.3 MB' },
          { name: 'Design Mockups.zip', url: '#', size: '5.1 MB' }
        ]
      },
      {
        _id: '2',
        title: 'React Todo Application',
        courseId: { 
          _id: '2',
          title: 'React.js Complete Guide',
          coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop'
        },
        dueAt: '2024-02-20T23:59:59.000Z',
        submissionStatus: 'submitted',
        maxPoints: 80,
        grade: 85,
        description: 'Build a todo application using React hooks and state management. Implement CRUD operations and local storage.',
        instructions: [
          'Create a functional todo app with React hooks',
          'Implement add, edit, delete, and toggle complete functionality',
          'Use local storage to persist data',
          'Add filtering options (All, Active, Completed)',
          'Include proper error handling and validation'
        ],
        createdAt: '2024-01-20T00:00:00.000Z',
        instructor: { name: 'John Doe' },
        submittedAt: '2024-01-25T14:30:00.000Z',
        feedback: 'Great work on the functionality! Consider adding more styling and error handling for better user experience.',
        attachments: [
          { name: 'Todo App Requirements.pdf', url: '#', size: '1.8 MB' }
        ]
      },
      {
        _id: '3',
        title: 'REST API with Express',
        courseId: { 
          _id: '3',
          title: 'Node.js Backend Development',
          coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop'
        },
        dueAt: '2024-02-25T23:59:59.000Z',
        submissionStatus: 'graded',
        maxPoints: 120,
        grade: 95,
        description: 'Create a RESTful API using Express.js with authentication and CRUD operations for a blog system.',
        instructions: [
          'Set up Express.js server with proper middleware',
          'Implement JWT authentication',
          'Create CRUD endpoints for blog posts',
          'Add input validation and error handling',
          'Include API documentation with Swagger'
        ],
        createdAt: '2024-01-25T00:00:00.000Z',
        instructor: { name: 'Mike Johnson' },
        submittedAt: '2024-01-28T16:45:00.000Z',
        gradedAt: '2024-01-30T10:15:00.000Z',
        feedback: 'Excellent implementation! Your API structure is clean and well-documented. The authentication flow is solid.',
        attachments: [
          { name: 'API Requirements.pdf', url: '#', size: '3.2 MB' },
          { name: 'Database Schema.sql', url: '#', size: '0.8 MB' }
        ]
      },
      {
        _id: '4',
        title: 'CSS Grid Layout Project',
        courseId: { 
          _id: '1',
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        dueAt: '2024-01-30T23:59:59.000Z',
        submissionStatus: 'overdue',
        maxPoints: 60,
        description: 'Create a responsive magazine-style layout using CSS Grid. Focus on modern design principles and responsive behavior.',
        instructions: [
          'Design a magazine layout using CSS Grid',
          'Implement responsive breakpoints',
          'Use modern CSS features (Grid, Flexbox)',
          'Include typography and color schemes',
          'Ensure cross-browser compatibility'
        ],
        createdAt: '2024-01-10T00:00:00.000Z',
        instructor: { name: 'Sarah Wilson' },
        attachments: [
          { name: 'Grid Layout Examples.pdf', url: '#', size: '4.1 MB' }
        ]
      },
      {
        _id: '5',
        title: 'JavaScript ES6+ Features',
        courseId: { 
          _id: '2',
          title: 'React.js Complete Guide',
          coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop'
        },
        dueAt: '2024-02-10T23:59:59.000Z',
        submissionStatus: 'pending',
        maxPoints: 70,
        description: 'Demonstrate understanding of modern JavaScript features including arrow functions, destructuring, async/await, and modules.',
        instructions: [
          'Create examples of arrow functions vs regular functions',
          'Implement destructuring in objects and arrays',
          'Use async/await for API calls',
          'Create ES6 modules with import/export',
          'Include error handling with try/catch'
        ],
        createdAt: '2024-01-22T00:00:00.000Z',
        instructor: { name: 'John Doe' },
        attachments: [
          { name: 'ES6+ Reference Guide.pdf', url: '#', size: '2.7 MB' }
        ]
      }
    ]
  };

  // Fetch assignments with real-time updates
  const { data: assignmentsData, isLoading, error } = useQuery({
    queryKey: ['/api/students/assignments', accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyAssignmentsData;
    },
    enabled: true, // Always enabled for dummy data
    refetchOnWindowFocus: true,
    refetchInterval: false,
    staleTime: 30000,
  });

  useRealtimeInvalidate([
    ['/api/students/assignments']
  ], ['assignments']);

  const assignments = Array.isArray(assignmentsData?.assignments) ? assignmentsData.assignments : [];

  const getStatusInfo = (assignment) => {
    const { submissionStatus, dueAt } = assignment;
    const now = new Date();
    const due = new Date(dueAt);
    const isOverdue = now > due && submissionStatus === 'pending';
    
    switch (submissionStatus) {
      case 'submitted':
        return {
          label: 'Submitted',
          color: 'bg-blue-50 text-blue-600 border-blue-200',
          icon: CheckCircle,
          textColor: 'text-blue-600'
        };
      case 'graded':
        return {
          label: 'Graded',
          color: 'bg-green-50 text-green-600 border-green-200',
          icon: CheckCircle,
          textColor: 'text-green-600'
        };
      case 'overdue':
      default:
        if (isOverdue) {
          return {
            label: 'Overdue',
            color: 'bg-red-50 text-red-600 border-red-200',
            icon: XCircle,
            textColor: 'text-red-600'
          };
        }
        return {
          label: 'Pending',
          color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
          icon: AlertCircle,
          textColor: 'text-yellow-600'
        };
    }
  };

  const formatDueDate = (dueAt) => {
    const due = new Date(dueAt);
    const now = new Date();
    const diffInHours = (due - now) / (1000 * 60 * 60);
    const diffInDays = Math.ceil(diffInHours / 24);
    
    if (diffInHours < 0) {
      return 'Overdue';
    } else if (diffInDays === 0) {
      return 'Due today';
    } else if (diffInDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffInDays} days`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sortByDueAsc = (list) => list.slice().sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  const filterAssignments = (status) => {
    switch (status) {
      case 'pending':
        return sortByDueAsc(assignments.filter(a => a.submissionStatus === 'pending' && new Date() <= new Date(a.dueAt)));
      case 'submitted':
        return assignments.filter(a => a.submissionStatus === 'submitted');
      case 'graded':
        return assignments.filter(a => a.submissionStatus === 'graded');
      case 'overdue':
        return sortByDueAsc(assignments.filter(a => 
          (a.submissionStatus === 'pending' && new Date() > new Date(a.dueAt)) || 
          a.submissionStatus === 'overdue'
        ));
      default:
        return sortByDueAsc(assignments);
    }
  };

  const AssignmentCard = ({ assignment }) => {
    const statusInfo = getStatusInfo(assignment);
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card 
        className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 cursor-pointer group" 
        data-testid={`assignment-card-${assignment._id}`}
        onClick={() => setLocation(`/assignments/${assignment._id}`)}
      >
        <CardHeader className="p-6 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold group-hover:text-primary-600 transition-colors">
                {assignment.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {assignment.courseId?.title}
              </CardDescription>
            </div>
            <Badge className={`border ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {assignment.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">{formatDate(assignment.dueAt)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">{formatDueDate(assignment.dueAt)}</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">{assignment.maxScore || 0} points</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">{assignment.courseId?.instructor || 'Instructor'}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          {assignment.submission && assignment.submissionStatus === 'graded' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Grade: {assignment.submission.score}/{assignment.submission.maxScore}
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {Math.round((assignment.submission.score / assignment.submission.maxScore) * 100)}%
                </span>
              </div>
              {assignment.submission.feedback && (
                <p className="text-sm text-green-700">
                  {assignment.submission.feedback}
                </p>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${statusInfo.textColor}`}>
              {statusInfo.label}
            </span>
            <Button 
              size="sm"
              variant={assignment.submissionStatus === 'pending' ? 'default' : 'outline'}
              className="flex-shrink-0"
              data-testid={`button-view-assignment-${assignment._id}`}
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/assignments/${assignment._id}`);
              }}
            >
              {assignment.submissionStatus === 'pending' ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-60 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-80 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[0,1,2,3].map((i) => (
              <div key={i} className="border-0 shadow-sm bg-white rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-7 w-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs + content */}
          <div className="space-y-6">
            <div className="w-full max-w-xl h-10 bg-white rounded-md shadow-sm animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="border-0 shadow-sm bg-white rounded-xl p-6 space-y-4">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-3">
                    {[0,1,2,3].map((k) => (
                      <div key={k} className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                  </div>
                  <div className="h-9 w-24 bg-gray-200 rounded animate-pulse ml-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-12 text-center">
              <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load assignments</h3>
              <p className="text-gray-600">Please refresh the page or try again later</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pendingCount = filterAssignments('pending').length;
  const submittedCount = filterAssignments('submitted').length;
  const gradedCount = filterAssignments('graded').length;
  const overdueCount = filterAssignments('overdue').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
              <p className="text-gray-600 mt-1">Track and submit your course assignments</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{submittedCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Graded</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{gradedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{overdueCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-fit bg-white shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              All ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Submitted ({submittedCount})
            </TabsTrigger>
            <TabsTrigger value="graded" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Graded ({gradedCount})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700">
              Overdue ({overdueCount})
            </TabsTrigger>
          </TabsList>

          {['all', 'pending', 'submitted', 'graded', 'overdue'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-6">
              {(() => {
                const filteredAssignments = filterAssignments(tabValue);
                
                if (filteredAssignments.length === 0) {
                  return (
                    <Card className="border-0 shadow-sm bg-white">
                      <CardContent className="p-12 text-center">
                        <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          No {tabValue === 'all' ? '' : tabValue} assignments
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {tabValue === 'all' 
                            ? 'No assignments found. Enroll in courses to see assignments.'
                            : `No ${tabValue} assignments at the moment.`
                          }
                        </p>
                        {tabValue === 'all' && (
                          <Button onClick={() => window.location.href = '/courses'}>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Browse Courses
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssignments.map((assignment) => (
                      <AssignmentCard key={assignment._id} assignment={assignment} />
                    ))}
                  </div>
                );
              })()}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Assignments;
