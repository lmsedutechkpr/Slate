import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Play, 
  Pause, 
  Save,
  Upload,
  Download,
  Search,
  Filter,
  Clock,
  Users,
  Award,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  BarChart3,
  Settings,
  BookOpen,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Calendar,
  User,
  Mail,
  Phone
} from 'lucide-react';

const QuizBuilder = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isCreateQuizDialogOpen, setIsCreateQuizDialogOpen] = useState(false);
  const [isEditQuestionDialogOpen, setIsEditQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  // Comprehensive dummy data for quiz builder
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

  const dummyQuizzesData = {
    quizzes: [
      {
        _id: '1',
        title: 'HTML Fundamentals Quiz',
        description: 'Test your knowledge of HTML basics including tags, attributes, and structure.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        questions: 10,
        type: 'Multiple Choice',
        status: 'published',
        attempts: 45,
        avgScore: 82.5,
        timeLimit: 30,
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        totalPoints: 100,
        passingScore: 70
      },
      {
        _id: '2',
        title: 'React Hooks Quiz',
        description: 'Comprehensive quiz on React hooks including useState, useEffect, and custom hooks.',
        courseId: { 
          _id: '2', 
          title: 'React.js Complete Guide',
          coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop'
        },
        questions: 8,
        type: 'Mixed',
        status: 'published',
        attempts: 23,
        avgScore: 78.3,
        timeLimit: 25,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
        totalPoints: 80,
        passingScore: 60
      },
      {
        _id: '3',
        title: 'CSS Grid Layout Quiz',
        description: 'Test your understanding of CSS Grid layout properties and techniques.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        questions: 12,
        type: 'True/False',
        status: 'draft',
        attempts: 0,
        avgScore: 0,
        timeLimit: 20,
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
        totalPoints: 60,
        passingScore: 45
      },
      {
        _id: '4',
        title: 'Node.js Express Quiz',
        description: 'Quiz covering Express.js fundamentals, middleware, and routing.',
        courseId: { 
          _id: '3', 
          title: 'Node.js Backend Development',
          coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop'
        },
        questions: 15,
        type: 'Multiple Choice',
        status: 'draft',
        attempts: 0,
        avgScore: 0,
        timeLimit: 35,
        createdAt: '2024-01-25T00:00:00.000Z',
        updatedAt: '2024-01-25T00:00:00.000Z',
        totalPoints: 150,
        passingScore: 105
      },
      {
        _id: '5',
        title: 'JavaScript ES6+ Features',
        description: 'Advanced JavaScript concepts including arrow functions, destructuring, and async/await.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        questions: 20,
        type: 'Mixed',
        status: 'published',
        attempts: 67,
        avgScore: 85.2,
        timeLimit: 45,
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-12T00:00:00.000Z',
        totalPoints: 200,
        passingScore: 140
      }
    ]
  };

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    courseId: '',
    timeLimit: 0,
    attempts: 1,
    shuffleQuestions: false,
    shuffleAnswers: false,
    showCorrectAnswers: true,
    showFeedback: true,
    passingScore: 70
  });

  const [newQuestion, setNewQuestion] = useState({
    type: 'multiple-choice',
    question: '',
    points: 1,
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    media: null
  });

  // Fetch courses
  const { data: coursesData } = useQuery({
    queryKey: ['instructor-courses', user?._id, accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyCoursesData;
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 30000
  });

  // Fetch quizzes
  const { data: quizzesData } = useQuery({
    queryKey: ['instructor-quizzes', user?._id, accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyQuizzesData;
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 15000
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (quizData) => {
      const response = await fetch(buildApiUrl('/api/instructor/quizzes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(quizData)
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz Created",
        description: "New quiz has been created successfully.",
      });
      queryClient.invalidateQueries(['instructor-quizzes']);
      setIsCreateQuizDialogOpen(false);
      setNewQuiz({
        title: '',
        description: '',
        courseId: '',
        timeLimit: 0,
        attempts: 1,
        shuffleQuestions: false,
        shuffleAnswers: false,
        showCorrectAnswers: true,
        showFeedback: true,
        passingScore: 70
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async ({ quizId, questionData }) => {
      const response = await fetch(buildApiUrl(`/api/instructor/quizzes/${quizId}/questions`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        throw new Error('Failed to add question');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Added",
        description: "Question has been added successfully.",
      });
      queryClient.invalidateQueries(['instructor-quizzes']);
      setIsEditQuestionDialogOpen(false);
      setEditingQuestion(null);
      setNewQuestion({
        type: 'multiple-choice',
        question: '',
        points: 1,
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        media: null
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ quizId, questionId, questionData }) => {
      const response = await fetch(buildApiUrl(`/api/instructor/quizzes/${quizId}/questions/${questionId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Updated",
        description: "Question has been updated successfully.",
      });
      queryClient.invalidateQueries(['instructor-quizzes']);
      setIsEditQuestionDialogOpen(false);
      setEditingQuestion(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async ({ quizId, questionId }) => {
      const response = await fetch(buildApiUrl(`/api/instructor/quizzes/${quizId}/questions/${questionId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Question Deleted",
        description: "Question has been deleted successfully.",
      });
      queryClient.invalidateQueries(['instructor-quizzes']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateQuiz = () => {
    if (!newQuiz.title.trim() || !newQuiz.courseId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createQuizMutation.mutate(newQuiz);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question.",
        variant: "destructive",
      });
      return;
    }

    if (newQuestion.type === 'multiple-choice' && newQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Error",
        description: "Please fill in all answer options.",
        variant: "destructive",
      });
      return;
    }

    addQuestionMutation.mutate({
      quizId: selectedQuiz._id,
      questionData: newQuestion
    });
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setNewQuestion({
      type: question.type,
      question: question.question,
      points: question.points,
      options: question.options || ['', '', '', ''],
      correctAnswer: question.correctAnswer || 0,
      explanation: question.explanation || '',
      media: question.media
    });
    setIsEditQuestionDialogOpen(true);
  };

  const handleUpdateQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question.",
        variant: "destructive",
      });
      return;
    }

    updateQuestionMutation.mutate({
      quizId: selectedQuiz._id,
      questionId: editingQuestion._id,
      questionData: newQuestion
    });
  };

  const handleDeleteQuestion = (questionId) => {
    deleteQuestionMutation.mutate({
      quizId: selectedQuiz._id,
      questionId
    });
  };

  const handleAddOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleRemoveOption = (index) => {
    if (newQuestion.options.length > 2) {
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
        correctAnswer: prev.correctAnswer >= index ? prev.correctAnswer - 1 : prev.correctAnswer
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple-choice': return <Target className="w-4 h-4 text-blue-500" />;
      case 'true-false': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'short-answer': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'essay': return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'fill-blank': return <Edit className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple-choice': return 'Multiple Choice';
      case 'true-false': return 'True/False';
      case 'short-answer': return 'Short Answer';
      case 'essay': return 'Essay';
      case 'fill-blank': return 'Fill in the Blank';
      default: return 'Unknown';
    }
  };

  const filteredQuizzes = () => {
    let quizzes = quizzesData?.quizzes || [];
    
    if (searchQuery) {
      quizzes = quizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      quizzes = quizzes.filter(quiz => quiz.status === filterType);
    }
    
    return quizzes;
  };

  const courses = coursesData?.courses || [];
  const quizzes = filteredQuizzes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
          <p className="text-gray-600">Create interactive quizzes and assessments</p>
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
            onClick={() => setIsCreateQuizDialogOpen(true)}
            disabled={!selectedCourse}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Quiz
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quizzes List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Quizzes ({quizzes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedQuiz?._id === quiz._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedQuiz(quiz)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{quiz.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {quiz.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {quiz.questions?.length || 0} questions
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {quiz.timeLimit || 0} min
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quiz Editor */}
        <div className="lg:col-span-2">
          {selectedQuiz ? (
            <div className="space-y-6">
              {/* Quiz Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {selectedQuiz.title}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{selectedQuiz.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4 mr-1" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedQuiz.questions?.length || 0}</p>
                      <p className="text-sm text-gray-600">Questions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedQuiz.timeLimit || 0}</p>
                      <p className="text-sm text-gray-600">Minutes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{selectedQuiz.attempts || 1}</p>
                      <p className="text-sm text-gray-600">Attempts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{selectedQuiz.passingScore || 70}%</p>
                      <p className="text-sm text-gray-600">Passing Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Questions ({selectedQuiz.questions?.length || 0})
                    </CardTitle>
                    <Button 
                      size="sm"
                      onClick={() => setIsEditQuestionDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedQuiz.questions?.map((question, index) => (
                      <div key={question._id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">Q{index + 1}</span>
                              {getQuestionTypeIcon(question.type)}
                              <span className="text-sm text-gray-500">
                                {getQuestionTypeLabel(question.type)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {question.points} pts
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mb-2">{question.question}</p>
                            {question.type === 'multiple-choice' && (
                              <div className="space-y-1">
                                {question.options?.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2 text-sm">
                                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      optIndex === question.correctAnswer 
                                        ? 'border-green-500 bg-green-100' 
                                        : 'border-gray-300'
                                    }`}>
                                      {optIndex === question.correctAnswer && (
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                      )}
                                    </span>
                                    <span className={optIndex === question.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                      {option}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {question.explanation && (
                              <p className="text-xs text-gray-500 mt-2">
                                <strong>Explanation:</strong> {question.explanation}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditQuestion(question)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteQuestion(question._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Quiz</h3>
                <p className="text-gray-600">Choose a quiz to edit or create a new one</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Quiz Dialog */}
      <Dialog open={isCreateQuizDialogOpen} onOpenChange={setIsCreateQuizDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>
              Create a new quiz for your course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quizTitle">Quiz Title</Label>
              <Input
                id="quizTitle"
                value={newQuiz.title}
                onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <Label htmlFor="quizDescription">Description</Label>
              <Textarea
                id="quizDescription"
                value={newQuiz.description}
                onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter quiz description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="0"
                  value={newQuiz.timeLimit}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="attempts">Attempts Allowed</Label>
                <Input
                  id="attempts"
                  type="number"
                  min="1"
                  value={newQuiz.attempts}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, attempts: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={newQuiz.passingScore}
                  onChange={(e) => setNewQuiz(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shuffleQuestions"
                  checked={newQuiz.shuffleQuestions}
                  onCheckedChange={(checked) => setNewQuiz(prev => ({ ...prev, shuffleQuestions: checked }))}
                />
                <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shuffleAnswers"
                  checked={newQuiz.shuffleAnswers}
                  onCheckedChange={(checked) => setNewQuiz(prev => ({ ...prev, shuffleAnswers: checked }))}
                />
                <Label htmlFor="shuffleAnswers">Shuffle Answers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showCorrectAnswers"
                  checked={newQuiz.showCorrectAnswers}
                  onCheckedChange={(checked) => setNewQuiz(prev => ({ ...prev, showCorrectAnswers: checked }))}
                />
                <Label htmlFor="showCorrectAnswers">Show Correct Answers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showFeedback"
                  checked={newQuiz.showFeedback}
                  onCheckedChange={(checked) => setNewQuiz(prev => ({ ...prev, showFeedback: checked }))}
                />
                <Label htmlFor="showFeedback">Show Feedback</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateQuizDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateQuiz}
                disabled={createQuizMutation.isPending}
              >
                {createQuizMutation.isPending ? 'Creating...' : 'Create Quiz'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={isEditQuestionDialogOpen} onOpenChange={setIsEditQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Update the question details' : 'Create a new question for your quiz'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionType">Question Type</Label>
                <Select value={newQuestion.type} onValueChange={(value) => setNewQuestion(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                    <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="questionPoints">Points</Label>
                <Input
                  id="questionPoints"
                  type="number"
                  min="1"
                  value={newQuestion.points}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="questionText">Question</Label>
              <Textarea
                id="questionText"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>
            
            {newQuestion.type === 'multiple-choice' && (
              <div>
                <Label>Answer Options</Label>
                <div className="space-y-2">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <RadioGroup
                        value={newQuestion.correctAnswer.toString()}
                        onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correctAnswer: parseInt(value) }))}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="sr-only">
                            Option {index + 1}
                          </Label>
                        </div>
                      </RadioGroup>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      {newQuestion.options.length > 2 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddOption}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {newQuestion.type === 'true-false' && (
              <div>
                <Label>Correct Answer</Label>
                <RadioGroup
                  value={newQuestion.correctAnswer.toString()}
                  onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correctAnswer: parseInt(value) }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="true" />
                    <Label htmlFor="true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="false" />
                    <Label htmlFor="false">False</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div>
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Enter explanation for the correct answer..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                disabled={addQuestionMutation.isPending || updateQuestionMutation.isPending}
              >
                {editingQuestion 
                  ? (updateQuestionMutation.isPending ? 'Updating...' : 'Update Question')
                  : (addQuestionMutation.isPending ? 'Adding...' : 'Add Question')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizBuilder;
