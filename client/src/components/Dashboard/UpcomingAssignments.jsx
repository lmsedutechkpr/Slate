import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight } from 'lucide-react';

const UpcomingAssignments = ({ assignments = [] }) => {
  const getStatusColor = (dueDate, submissionStatus) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (submissionStatus === 'submitted' || submissionStatus === 'graded') {
      return 'green';
    }
    
    if (daysUntilDue <= 2) return 'red';
    if (daysUntilDue <= 5) return 'yellow';
    return 'green';
  };

  const getStatusText = (dueDate, submissionStatus) => {
    if (submissionStatus === 'submitted') return 'Submitted';
    if (submissionStatus === 'graded') return 'Graded';
    
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${daysUntilDue} days`;
  };

  const getBorderColor = (color) => {
    switch (color) {
      case 'red': return 'hover:border-red-300 border-red-200';
      case 'yellow': return 'hover:border-yellow-300 border-yellow-200';
      case 'green': return 'hover:border-green-300 border-green-200';
      default: return 'hover:border-gray-300 border-gray-200';
    }
  };

  const getDotColor = (color) => {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTextColor = (color) => {
    switch (color) {
      case 'red': return 'text-red-600';
      case 'yellow': return 'text-yellow-600';
      case 'green': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!assignments.length) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Upcoming Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No upcoming assignments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Upcoming Assignments
          </CardTitle>
          <Link href="/assignments">
            <button 
              className="text-primary-600 text-sm hover:text-primary-700"
              data-testid="link-view-all-assignments"
            >
              View All
            </button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.slice(0, 3).map((assignment) => {
          const statusColor = getStatusColor(assignment.dueAt, assignment.submissionStatus);
          const statusText = getStatusText(assignment.dueAt, assignment.submissionStatus);
          
          return (
            <div 
              key={assignment._id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${getBorderColor(statusColor)}`}
              data-testid={`assignment-card-${assignment._id}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getDotColor(statusColor)}`}></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {assignment.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {assignment.courseId?.title}
                  </div>
                  <div className={`text-xs ${getTextColor(statusColor)}`}>
                    {statusText}
                  </div>
                </div>
              </div>
              <Link href={`/assignments/${assignment._id}`}>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  data-testid={`button-view-assignment-${assignment._id}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UpcomingAssignments;
