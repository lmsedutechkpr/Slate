import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const Assignments = () => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  const { data: assignmentsData, isLoading, error } = useQuery({
    queryKey: ['/api/students/assignments', accessToken],
    queryFn: async () => {
      const response = await fetch('/api/students/assignments', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
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
          color: 'bg-blue-100 text-blue-700',
          icon: CheckCircle,
          textColor: 'text-blue-600'
        };
      case 'graded':
        return {
          label: 'Graded',
          color: 'bg-green-100 text-green-700',
          icon: CheckCircle,
          textColor: 'text-green-600'
        };
      case 'overdue':
      default:
        if (isOverdue) {
          return {
            label: 'Overdue',
            color: 'bg-red-100 text-red-700',
            icon: XCircle,
            textColor: 'text-red-600'
          };
        }
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-700',
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

  const filterAssignments = (status) => {
    switch (status) {
      case 'pending':
        return assignments.filter(a => a.submissionStatus === 'pending' && new Date() <= new Date(a.dueAt));
      case 'submitted':
        return assignments.filter(a => a.submissionStatus === 'submitted');
      case 'graded':
        return assignments.filter(a => a.submissionStatus === 'graded');
      case 'overdue':
        return assignments.filter(a => 
          (a.submissionStatus === 'pending' && new Date() > new Date(a.dueAt)) || 
          a.submissionStatus === 'overdue'
        );
      default:
        return assignments;
    }
  };

  const AssignmentCard = ({ assignment }) => {
    const statusInfo = getStatusInfo(assignment);
    const StatusIcon = statusInfo.icon;
    
    return (
      <Card className="card-hover" data-testid={`assignment-card-${assignment._id}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {assignment.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {assignment.courseId?.title}
              </CardDescription>
            </div>
            <Badge className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {assignment.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(assignment.dueAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDueDate(assignment.dueAt)}
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {assignment.maxScore} points
              </div>
            </div>
          </div>
          
          {assignment.submission && assignment.submissionStatus === 'graded' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-800">
                  Grade: {assignment.submission.score}/{assignment.submission.maxScore}
                </span>
                <span className="text-sm text-green-600">
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
              data-testid={`button-view-assignment-${assignment._id}`}
            >
              {assignment.submissionStatus === 'pending' ? 'Submit' : 'View Details'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load assignments</h3>
          <p className="text-gray-600">Please refresh the page or try again later</p>
        </div>
      </div>
    );
  }

  const pendingCount = filterAssignments('pending').length;
  const submittedCount = filterAssignments('submitted').length;
  const gradedCount = filterAssignments('graded').length;
  const overdueCount = filterAssignments('overdue').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h1>
        <p className="text-gray-600">Track and submit your course assignments</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{submittedCount}</div>
            <div className="text-sm text-gray-600">Submitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{gradedCount}</div>
            <div className="text-sm text-gray-600">Graded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-fit">
          <TabsTrigger value="all" data-testid="tab-all-assignments">
            All ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-assignments">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="submitted" data-testid="tab-submitted-assignments">
            Submitted ({submittedCount})
          </TabsTrigger>
          <TabsTrigger value="graded" data-testid="tab-graded-assignments">
            Graded ({gradedCount})
          </TabsTrigger>
          <TabsTrigger value="overdue" data-testid="tab-overdue-assignments">
            Overdue ({overdueCount})
          </TabsTrigger>
        </TabsList>

        {['all', 'pending', 'submitted', 'graded', 'overdue'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-6">
            {(() => {
              const filteredAssignments = filterAssignments(tabValue);
              
              if (filteredAssignments.length === 0) {
                return (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {tabValue === 'all' ? '' : tabValue} assignments
                    </h3>
                    <p className="text-gray-600">
                      {tabValue === 'all' 
                        ? 'No assignments found. Enroll in courses to see assignments.'
                        : `No ${tabValue} assignments at the moment.`
                      }
                    </p>
                  </div>
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
  );
};

export default Assignments;
