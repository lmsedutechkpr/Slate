import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Video } from 'lucide-react';

const LiveClasses = ({ liveSessions = [] }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isLive = (session) => {
    const now = new Date();
    const start = new Date(session.startAt);
    const end = new Date(session.endAt);
    return now >= start && now <= end;
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const start = new Date(session.startAt);
    const end = new Date(session.endAt);
    
    if (now >= start && now <= end) return 'live';
    if (now < start) return 'upcoming';
    return 'completed';
  };

  if (!liveSessions.length) {
    return null;
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Live Classes
          </CardTitle>
          {liveSessions.some(session => isLive(session)) && (
            <Badge variant="destructive" className="bg-red-100 text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
              Live Now
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {liveSessions.map((session) => {
          const status = getSessionStatus(session);
          const isCurrentlyLive = status === 'live';
          
          return (
            <div 
              key={session._id}
              className={`border rounded-lg p-4 ${
                isCurrentlyLive 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200'
              }`}
              data-testid={`live-session-${session._id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {session.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    with {session.instructorId?.username || 'Instructor'}
                  </p>
                </div>
                {isCurrentlyLive && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">LIVE</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                {isCurrentlyLive ? (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Started {formatTime(session.startAt)}</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(session.startAt)} at {formatTime(session.startAt)}
                    </span>
                  </>
                )}
              </div>
              
              <Button 
                className={`w-full ${
                  isCurrentlyLive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
                }`}
                variant={isCurrentlyLive ? 'default' : 'outline'}
                data-testid={`button-${isCurrentlyLive ? 'join' : 'remind'}-${session._id}`}
              >
                {isCurrentlyLive ? (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Join Live Class
                  </>
                ) : (
                  'Set Reminder'
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default LiveClasses;
