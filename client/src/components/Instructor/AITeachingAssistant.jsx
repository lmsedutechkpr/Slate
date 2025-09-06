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
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Send, 
  Lightbulb, 
  BookOpen, 
  Target, 
  Users, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  Video, 
  Clock, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  Settings, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Share, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Award, 
  Calendar, 
  Bell, 
  User, 
  Mail, 
  Phone
} from 'lucide-react';

const AITeachingAssistant = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assistantMode, setAssistantMode] = useState('general');
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    personality: 'helpful',
    expertise: 'general',
    responseLength: 'medium',
    includeExamples: true,
    includeReferences: true,
    language: 'en'
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

  // Fetch AI suggestions
  const { data: suggestionsData } = useQuery({
    queryKey: ['ai-suggestions', user?._id, accessToken, selectedCourse],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/instructor/ai/suggestions?courseId=${selectedCourse}`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { suggestions: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 60000
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const response = await fetch(buildApiUrl('/api/instructor/ai/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        message: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions || [],
        confidence: data.confidence || 0.8
      }]);
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsTyping(false);
    }
  });

  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (contentData) => {
      const response = await fetch(buildApiUrl('/api/instructor/ai/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(contentData)
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Generated",
        description: "AI has generated the requested content.",
      });
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        message: `Here's the generated content:\n\n${data.content}`,
        timestamp: new Date(),
        content: data.content,
        contentType: data.type
      }]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatMessage,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsTyping(true);

    sendMessageMutation.mutate({
      message: chatMessage,
      courseId: selectedCourse,
      mode: assistantMode,
      settings: aiSettings
    });
  };

  const handleGenerateContent = (type, prompt) => {
    generateContentMutation.mutate({
      type: type,
      prompt: prompt,
      courseId: selectedCourse,
      settings: aiSettings
    });
  };

  const handleSuggestionClick = (suggestion) => {
    setChatMessage(suggestion.prompt);
  };

  const handleFeedback = (messageId, feedback) => {
    // Send feedback to improve AI responses
    toast({
      title: "Feedback Recorded",
      description: "Thank you for your feedback!",
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const getAssistantIcon = (mode) => {
    switch (mode) {
      case 'general': return <Bot className="w-5 h-5 text-blue-500" />;
      case 'content': return <FileText className="w-5 h-5 text-green-500" />;
      case 'assessment': return <Target className="w-5 h-5 text-purple-500" />;
      case 'analytics': return <BarChart3 className="w-5 h-5 text-orange-500" />;
      case 'communication': return <MessageSquare className="w-5 h-5 text-red-500" />;
      default: return <Bot className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const courses = coursesData?.courses || [];
  const suggestions = suggestionsData?.suggestions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Teaching Assistant</h1>
          <p className="text-gray-600">Get AI-powered help with your teaching tasks</p>
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
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getAssistantIcon(assistantMode)}
                  AI Assistant - {assistantMode.charAt(0).toUpperCase() + assistantMode.slice(1)} Mode
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={assistantMode === 'general' ? 'default' : 'outline'}
                    onClick={() => setAssistantMode('general')}
                  >
                    General
                  </Button>
                  <Button
                    size="sm"
                    variant={assistantMode === 'content' ? 'default' : 'outline'}
                    onClick={() => setAssistantMode('content')}
                  >
                    Content
                  </Button>
                  <Button
                    size="sm"
                    variant={assistantMode === 'assessment' ? 'default' : 'outline'}
                    onClick={() => setAssistantMode('assessment')}
                  >
                    Assessment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to AI Assistant</h3>
                      <p className="text-gray-600">Ask me anything about teaching, course content, or student management!</p>
                    </div>
                  ) : (
                    chatHistory.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.type === 'assistant' && (
                              <Bot className="w-4 h-4 mt-1 text-gray-500" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                              {message.confidence && (
                                <div className="flex items-center gap-1 mt-2">
                                  <span className="text-xs text-gray-500">Confidence:</span>
                                  <span className={`text-xs font-medium ${getConfidenceColor(message.confidence)}`}>
                                    {Math.round(message.confidence * 100)}%
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">
                                  {formatTime(message.timestamp)}
                                </span>
                                {message.type === 'assistant' && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="p-1 h-6"
                                      onClick={() => handleFeedback(message.id, 'positive')}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="p-1 h-6"
                                      onClick={() => handleFeedback(message.id, 'negative')}
                                    >
                                      <ThumbsDown className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-gray-500" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything about teaching..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start gap-2">
                      {getAssistantIcon(suggestion.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{suggestion.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent('assignment', 'Create an assignment for')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Assignment
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent('quiz', 'Create a quiz for')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Generate Quiz
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent('lesson', 'Create a lesson plan for')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Generate Lesson Plan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGenerateContent('feedback', 'Generate feedback for')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Generate Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>AI Assistant Settings</DialogTitle>
            <DialogDescription>
              Customize your AI assistant's behavior and responses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="personality">Personality</Label>
              <Select value={aiSettings.personality} onValueChange={(value) => setAiSettings(prev => ({ ...prev, personality: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helpful">Helpful & Supportive</SelectItem>
                  <SelectItem value="professional">Professional & Formal</SelectItem>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="expert">Expert & Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expertise">Expertise Level</Label>
              <Select value={aiSettings.expertise} onValueChange={(value) => setAiSettings(prev => ({ ...prev, expertise: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Education</SelectItem>
                  <SelectItem value="elementary">Elementary Education</SelectItem>
                  <SelectItem value="secondary">Secondary Education</SelectItem>
                  <SelectItem value="higher">Higher Education</SelectItem>
                  <SelectItem value="specialized">Specialized Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="responseLength">Response Length</Label>
              <Select value={aiSettings.responseLength} onValueChange={(value) => setAiSettings(prev => ({ ...prev, responseLength: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short & Concise</SelectItem>
                  <SelectItem value="medium">Medium Detail</SelectItem>
                  <SelectItem value="long">Detailed & Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeExamples"
                  checked={aiSettings.includeExamples}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, includeExamples: e.target.checked }))}
                />
                <Label htmlFor="includeExamples">Include Examples in Responses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeReferences"
                  checked={aiSettings.includeReferences}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, includeReferences: e.target.checked }))}
                />
                <Label htmlFor="includeReferences">Include References and Sources</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsSettingsDialogOpen(false)}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AITeachingAssistant;
