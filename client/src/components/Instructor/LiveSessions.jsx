import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
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
  const { accessToken } = useAuth();
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

  // Fetch instructor's courses for session selection
  const { data: coursesData } = useQuery({
    queryKey: ['/api/instructor/courses'],
    queryFn: async () => {
      const response = await fetch('/api/instructor/courses', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Mock live sessions data (in a real app, this would come from the API)
  const mockSessions = [
    {
      _id: '1',
      title: 'JavaScript Advanced Concepts',
      description: 'Deep dive into closures, prototypes, and async programming',
      courseId: { title: 'JavaScript Fundamentals' },
      startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      endAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      hostType: 'gmeet',
      status: 'scheduled',
      attendance: []
    },
    {
      _id: '2',
      title: 'React Hooks Deep Dive',
      description: 'Understanding useState, useEffect, and custom hooks',
      courseId: { title: 'React Development' },
      startAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      hostType: 'internal',
      status: 'live',
      attendance: [
        { studentId: '1', status: 'present' },
        { studentId: '2', status: 'present' },
        { studentId: '3', status: 'late' }
      ]
    },
    {
      _id: '3',
      title: 'Node.js Project Q&A',
      description: 'Question and answer session for the final project',
      courseId: { title: 'Node.js Backend' },
      startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      endAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // 2 days ago + 90 minutes
      hostType: 'youtube',
      status: 'completed',
      attendance: [
        { studentId: '1', status: 'present' },
        { studentId: '2', status: 'absent' },
        { studentId: '3', status: 'present' },
        { studentId: '4', status: 'present' }
      ]
    }
  ];

  const courses = coursesData?.courses || [];

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Sessions</h2>
          <p className="text-gray-600">Schedule and manage live classes for your students</p>
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
              {mockSessions.filter(s => s.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {mockSessions.filter(s => s.status === 'live').length}
            </div>
            <div className="text-sm text-gray-600">Live Now</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {mockSessions.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mockSessions.reduce((total, session) => 
                total + (session.attendance?.filter(a => a.status === 'present').length || 0), 0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Attendees</div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      {mockSessions.length === 0 ? (
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
          {mockSessions.map((session) => (
            <LiveSessionCard key={session._id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveSessions;
