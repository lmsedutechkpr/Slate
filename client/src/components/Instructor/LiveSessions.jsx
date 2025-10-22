import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, Video, Plus, Edit, Trash2 } from 'lucide-react';

const LiveSessions = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    courseId: '',
    startAt: '',
    endAt: '',
    hostType: 'internal',
    joinLink: '',
    maxParticipants: ''
  });

  // Comprehensive dummy data for live sessions
  const dummyCoursesData = {
    courses: [
      {
        _id: '1',
        title: 'Complete Web Development Bootcamp',
        description: 'Learn modern web development from scratch.',
        coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
      },
      {
        _id: '2',
        title: 'React.js Complete Guide',
        description: 'Master React.js from fundamentals to advanced concepts.',
        coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop'
      },
      {
        _id: '3',
        title: 'Node.js Backend Development',
        description: 'Build scalable backend applications with Node.js.',
        coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop'
      }
    ]
  };

  const dummySessionsData = {
    sessions: [
      {
        _id: '1',
        title: 'React Hooks Deep Dive',
        description: 'Deep dive into React hooks including useState, useEffect, useContext, and custom hooks.',
        courseId: { 
          _id: '2', 
          title: 'React.js Complete Guide',
          coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop'
        },
        scheduledAt: '2024-02-01T18:00:00.000Z',
        duration: 90,
        status: 'scheduled',
        participants: 25,
        maxParticipants: 50,
        meetingUrl: 'https://meet.google.com/react-hooks-session',
        instructor: {
          profile: { firstName: 'Sarah', lastName: 'Wilson' }
        },
        createdAt: '2024-01-25T00:00:00.000Z',
        updatedAt: '2024-01-25T00:00:00.000Z'
      },
      {
        _id: '2',
        title: 'Web Development Q&A',
        description: 'Q&A session for web development concepts and project help.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        scheduledAt: '2024-02-03T17:00:00.000Z',
        duration: 60,
        status: 'scheduled',
        participants: 15,
        maxParticipants: 30,
        meetingUrl: 'https://meet.google.com/webdev-qa',
        instructor: {
          profile: { firstName: 'John', lastName: 'Doe' }
        },
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z'
      },
      {
        _id: '3',
        title: 'Node.js Best Practices',
        description: 'Learn best practices for Node.js development including error handling, security, and performance.',
        courseId: { 
          _id: '3', 
          title: 'Node.js Backend Development',
          coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop'
        },
        scheduledAt: '2024-01-30T19:00:00.000Z',
        duration: 75,
        status: 'completed',
        participants: 18,
        maxParticipants: 25,
        recordingUrl: 'https://recordings.example.com/nodejs-best-practices.mp4',
        instructor: {
          profile: { firstName: 'Mike', lastName: 'Johnson' }
        },
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-30T20:15:00.000Z'
      },
      {
        _id: '4',
        title: 'CSS Grid Layout Workshop',
        description: 'Hands-on workshop for CSS Grid layout techniques and responsive design.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        scheduledAt: '2024-01-28T14:00:00.000Z',
        duration: 120,
        status: 'completed',
        participants: 22,
        maxParticipants: 30,
        recordingUrl: 'https://recordings.example.com/css-grid-workshop.mp4',
        instructor: {
          profile: { firstName: 'John', lastName: 'Doe' }
        },
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-28T16:00:00.000Z'
      },
      {
        _id: '5',
        title: 'JavaScript ES6+ Features',
        description: 'Explore modern JavaScript features including arrow functions, destructuring, and async/await.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        scheduledAt: '2024-02-05T16:00:00.000Z',
        duration: 90,
        status: 'scheduled',
        participants: 0,
        maxParticipants: 40,
        meetingUrl: 'https://meet.google.com/js-es6-features',
        instructor: {
          profile: { firstName: 'John', lastName: 'Doe' }
        },
        createdAt: '2024-01-30T00:00:00.000Z',
        updatedAt: '2024-01-30T00:00:00.000Z'
      }
    ]
  };

  // Fetch instructor's courses for session selection
  const { data: coursesData } = useQuery({
    queryKey: ['/api/instructor/courses'],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyCoursesData;
    },
    enabled: true, // Always enabled for dummy data
  });

  // Fetch instructor live sessions
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['/api/instructor/live-sessions', accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummySessionsData;
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 15000,
  });

  const courses = Array.isArray(coursesData?.courses) ? coursesData.courses : [];
  const sessions = Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : [];

  // Real-time updates
  useRealtimeInvalidate([
    ['/api/instructor/courses', accessToken],
    ['/api/instructor/live-sessions', accessToken]
  ], ['courses', 'live-sessions']);

  // Create session
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(buildApiUrl('/api/instructor/live-sessions'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/instructor/live-sessions', accessToken]);
      setIsCreateDialogOpen(false);
      setNewSession({ title: '', description: '', courseId: '', startAt: '', endAt: '', hostType: 'internal', joinLink: '', maxParticipants: '' });
    }
  });

  // Delete session
  const deleteMutation = useMutation({
    mutationFn: async (sessionId) => {
      const res = await fetch(buildApiUrl(`/api/instructor/live-sessions/${sessionId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to delete session');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['/api/instructor/live-sessions', accessToken])
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getHostTypeIcon = (hostType) => {
    switch (hostType) {
      case 'gmeet': return '🎥';
      case 'zoom': return '📹';
      case 'youtube': return '▶️';
      case 'internal': return '💻';
      default: return '🎪';
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (startAt, endAt) => {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const durationMs = end - start;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    if (durationMinutes < 60) {
      return `${durationMinutes}m`;
    }
    return `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
  };

  const LiveSessionCard = ({ session }) => {
    const isLive = session.status === 'live';
    const isScheduled = session.status === 'scheduled';
    const attendanceCount = session.attendance?.filter(a => a.status === 'present').length || 0;
    
    return (
      <Card className="card-hover" data-testid={`session-card-${session._id}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="text-lg">{getHostTypeIcon(session.hostType)}</span>
                {session.title}
                {isLive && (
                  <Badge className={`${getStatusColor(session.status)} animate-pulse`}>
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {session.description}
              </CardDescription>
              <div className="text-sm text-gray-600 mt-2">
                Course: {session.courseId?.title}
              </div>
            </div>
            <Badge className={getStatusColor(session.status)}>
              {session.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDateTime(session.startAt)}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {calculateDuration(session.startAt, session.endAt)}
              </div>
            </div>
            
            {session.attendance && session.attendance.length > 0 && (
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {attendanceCount} / {session.attendance.length} students attended
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-600 capitalize">
                {session.hostType} session
              </div>
              <div className="flex space-x-2">
                {isLive && (
                  <Button 
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    data-testid={`button-join-${session._id}`}
                  >
                    <Video className="w-3 h-3 mr-1" />
                    Join Live
                  </Button>
                )}
                {isScheduled && (
                  <Button 
                    size="sm"
                    variant="outline"
                    data-testid={`button-edit-${session._id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
                {session.status === 'completed' && (
                  <Button 
                    size="sm"
                    variant="outline"
                    data-testid={`button-view-recording-${session._id}`}
                  >
                    <Video className="w-3 h-3 mr-1" />
                    Recording
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Sessions</h1>
          <p className="text-gray-600 mt-2">Schedule and manage live classes for your students</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-session">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Live Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule Live Session</DialogTitle>
              <DialogDescription>
                Create a new live session for your students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sessionTitle">Session Title</Label>
                <Input
                  id="sessionTitle"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., JavaScript Q&A Session"
                  data-testid="input-session-title"
                />
              </div>
              <div>
                <Label htmlFor="sessionDescription">Description</Label>
                <Textarea
                  id="sessionDescription"
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What will you cover in this session?"
                  data-testid="textarea-session-description"
                />
              </div>
              <div>
                <Label htmlFor="courseSelect">Course</Label>
                <Select 
                  value={newSession.courseId} 
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, courseId: value }))}
                >
                  <SelectTrigger data-testid="select-session-course">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startAt">Start Date & Time</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={newSession.startAt}
                    onChange={(e) => setNewSession(prev => ({ ...prev, startAt: e.target.value }))}
                    data-testid="input-session-startAt"
                  />
                </div>
                <div>
                  <Label htmlFor="endAt">End Date & Time</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    value={newSession.endAt}
                    onChange={(e) => setNewSession(prev => ({ ...prev, endAt: e.target.value }))}
                    data-testid="input-session-endAt"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="hostType">Platform</Label>
                <Select 
                  value={newSession.hostType} 
                  onValueChange={(value) => setNewSession(prev => ({ ...prev, hostType: value }))}
                >
                  <SelectTrigger data-testid="select-session-hostType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Platform</SelectItem>
                    <SelectItem value="gmeet">Google Meet</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="youtube">YouTube Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newSession.hostType !== 'internal' && (
                <div>
                  <Label htmlFor="joinLink">Join Link</Label>
                  <Input
                    id="joinLink"
                    value={newSession.joinLink}
                    onChange={(e) => setNewSession(prev => ({ ...prev, joinLink: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                    data-testid="input-session-joinLink"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="maxParticipants">Max Participants (Optional)</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={newSession.maxParticipants}
                  onChange={(e) => setNewSession(prev => ({ ...prev, maxParticipants: e.target.value }))}
                  placeholder="Leave empty for unlimited"
                  data-testid="input-session-maxParticipants"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-session"
                >
                  Cancel
                </Button>
                <Button 
                  disabled={!newSession.title || !newSession.courseId || !newSession.startAt || !newSession.endAt}
                  data-testid="button-save-session"
                  onClick={() => createMutation.mutate(newSession)}
                >
                  Schedule Session
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {sessions.filter(s => s.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {sessions.filter(s => s.status === 'live').length}
            </div>
            <div className="text-sm text-gray-600">Live Now</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {sessions.reduce((total, session) => 
                total + (session.attendance?.filter(a => a.status === 'present').length || 0), 0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Attendees</div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No live sessions scheduled</h3>
            <p className="text-gray-600 mb-6">
              Create your first live session to interact with your students in real-time
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Your First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session) => (
            <div key={session._id}>
              <LiveSessionCard session={session} />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(session._id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveSessions;
