import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Fetch assignments with real-time updates
  const { data: assignmentsData, isLoading, error } = useQuery({
    queryKey: ['/api/students/assignments', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/students/assignments'));
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    staleTime: 30000,
  });

  const assignments = assignmentsData?.assignments || [];

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="xl" />
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
