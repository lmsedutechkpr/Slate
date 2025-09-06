import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  MessageSquare, 
  Share, 
  Settings,
  Play,
  Pause,
  Square,
  Circle,
  StopCircle,
  Clock,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  Award,
  Target,
  BarChart3,
  Activity,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const LiveSessionManager = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const chatRef = useRef(null);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [isCreateSessionDialogOpen, setIsCreateSessionDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    duration: 0,
    participants: 0,
    messages: 0,
    questions: 0
  });

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ['instructor-courses', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/courses'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { courses: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 30000
  });

  // Fetch live sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['live-sessions', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/live-sessions'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { sessions: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 10000
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData) => {
      const response = await fetch(buildApiUrl('/api/instructor/live-sessions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Created",
        description: "Live session has been created successfully.",
      });
      queryClient.invalidateQueries(['live-sessions']);
      setIsCreateSessionDialogOpen(false);
      setSessionTitle('');
      setSessionDescription('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      const response = await fetch(buildApiUrl(`/api/instructor/live-sessions/${sessionId}/start`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Started",
        description: "Live session has been started successfully.",
      });
      setIsLive(true);
      queryClient.invalidateQueries(['live-sessions']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      const response = await fetch(buildApiUrl(`/api/instructor/live-sessions/${sessionId}/end`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Ended",
        description: "Live session has been ended successfully.",
      });
      setIsLive(false);
      setIsRecording(false);
      queryClient.invalidateQueries(['live-sessions']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateSession = () => {
    if (!sessionTitle.trim() || !selectedCourse) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createSessionMutation.mutate({
      title: sessionTitle,
      description: sessionDescription,
      courseId: selectedCourse,
      scheduledFor: new Date().toISOString(),
      duration: 60 // Default 60 minutes
    });
  };

  const handleStartSession = (sessionId) => {
    startSessionMutation.mutate(sessionId);
  };

  const handleEndSession = (sessionId) => {
    endSessionMutation.mutate(sessionId);
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({
        title: "Recording Started",
        description: "Session recording has been started.",
      });
    } else {
      toast({
        title: "Recording Stopped",
        description: "Session recording has been stopped.",
      });
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: user.profile?.firstName || 'Instructor',
        message: chatMessage,
        timestamp: new Date(),
        type: 'instructor'
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live': return <Video className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'ended': return <Square className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const courses = coursesData?.courses || [];
  const sessions = sessionsData?.sessions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Session Manager</h1>
          <p className="text-gray-600">Conduct live classes and interactive sessions</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsCreateSessionDialogOpen(true)}
            disabled={!selectedCourse}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Live Session Controls */}
      {isLive && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-red-800">LIVE</span>
                </div>
                <div className="text-sm text-red-700">
                  Duration: {formatDuration(sessionStats.duration)}
                </div>
                <div className="text-sm text-red-700">
                  Participants: {sessionStats.participants}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isMuted ? "destructive" : "outline"}
                  onClick={handleToggleMute}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isVideoOff ? "destructive" : "outline"}
                  onClick={handleToggleVideo}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={handleToggleRecording}
                >
                  {isRecording ? <StopCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleEndSession('current')}
                >
                  <Square className="w-4 h-4 mr-1" />
                  End Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Live Sessions ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session) => (
                <div key={session._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{session.title}</h4>
                        <Badge className={getStatusColor(session.status)}>
                          {getStatusIcon(session.status)}
                          <span className="ml-1 capitalize">{session.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.scheduledFor).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.scheduledFor).toLocaleTimeString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {session.participants || 0} participants
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {session.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleStartSession(session._id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {session.status === 'live' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleEndSession(session._id)}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          End
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Live Session Panel */}
        <div className="lg:col-span-1">
          {isLive ? (
            <div className="space-y-4">
              {/* Video Player */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Live Stream
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Live video stream</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participants ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">
                            {participant.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{participant.name}</span>
                        <div className="flex gap-1 ml-auto">
                          <Button size="sm" variant="outline" className="p-1">
                            <Mic className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="p-1">
                            <Video className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chat */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-32 overflow-y-auto border rounded p-2 space-y-2" ref={chatRef}>
                      {chatMessages.map((message) => (
                        <div key={message.id} className="text-sm">
                          <span className="font-medium text-blue-600">{message.sender}:</span>
                          <span className="ml-2">{message.message}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={handleSendMessage}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
                <p className="text-gray-600">Start a live session to begin teaching</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Session Dialog */}
      <Dialog open={isCreateSessionDialogOpen} onOpenChange={setIsCreateSessionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Live Session</DialogTitle>
            <DialogDescription>
              Schedule a new live session for your course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sessionTitle">Session Title</Label>
              <Input
                id="sessionTitle"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Enter session title"
              />
            </div>
            <div>
              <Label htmlFor="sessionDescription">Description</Label>
              <Textarea
                id="sessionDescription"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="Enter session description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateSessionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveSessionManager;
