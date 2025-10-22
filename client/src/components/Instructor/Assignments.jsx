import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';
import { Plus, Edit, Trash2, Clock, CheckCircle, Calendar, Users, Eye, Download, FileText, ClipboardList, Star, MessageSquare, Award } from 'lucide-react';
import { format } from 'date-fns';

const InstructorAssignments = () => {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    maxGrade: 100,
    instructions: '',
    type: 'practice'
  });

  // Comprehensive dummy data for assignments
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

  const dummyAssignmentsData = {
    assignments: [
      {
        _id: '1',
        title: 'Build a Personal Portfolio Website',
        description: 'Create a responsive portfolio website using HTML, CSS, and JavaScript. Include sections for about, projects, skills, and contact.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        dueDate: '2024-02-15T23:59:59.000Z',
        maxGrade: 100,
        instructions: 'Use modern CSS techniques like Flexbox or Grid. Include at least 3 projects with descriptions and links.',
        type: 'project',
        status: 'active',
        submissions: 45,
        graded: 42,
        avgGrade: 87.5,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z'
      },
      {
        _id: '2',
        title: 'React Todo Application',
        description: 'Build a todo application using React with features like add, edit, delete, and mark as complete.',
        courseId: { 
          _id: '2', 
          title: 'React.js Complete Guide',
          coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop'
        },
        dueDate: '2024-02-20T23:59:59.000Z',
        maxGrade: 80,
        instructions: 'Use React hooks (useState, useEffect). Implement local storage for persistence.',
        type: 'practice',
        status: 'active',
        submissions: 23,
        graded: 18,
        avgGrade: 82.3,
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-22T00:00:00.000Z'
      },
      {
        _id: '3',
        title: 'REST API with Express',
        description: 'Create a RESTful API using Express.js with CRUD operations for a blog system.',
        courseId: { 
          _id: '3', 
          title: 'Node.js Backend Development',
          coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop'
        },
        dueDate: '2024-02-25T23:59:59.000Z',
        maxGrade: 120,
        instructions: 'Include endpoints for posts, comments, and users. Use proper HTTP status codes and error handling.',
        type: 'project',
        status: 'active',
        submissions: 12,
        graded: 8,
        avgGrade: 78.9,
        createdAt: '2024-01-25T00:00:00.000Z',
        updatedAt: '2024-01-28T00:00:00.000Z'
      },
      {
        _id: '4',
        title: 'CSS Grid Layout Exercise',
        description: 'Create a responsive layout using CSS Grid for a magazine-style webpage.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        dueDate: '2024-01-30T23:59:59.000Z',
        maxGrade: 60,
        instructions: 'Include header, sidebar, main content, and footer areas. Make it responsive for mobile devices.',
        type: 'practice',
        status: 'completed',
        submissions: 38,
        graded: 38,
        avgGrade: 91.2,
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-30T00:00:00.000Z'
      },
      {
        _id: '5',
        title: 'JavaScript DOM Manipulation',
        description: 'Create an interactive webpage that demonstrates various DOM manipulation techniques.',
        courseId: { 
          _id: '1', 
          title: 'Complete Web Development Bootcamp',
          coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop'
        },
        dueDate: '2024-02-05T23:59:59.000Z',
        maxGrade: 70,
        instructions: 'Include event listeners, element creation, styling changes, and form validation.',
        type: 'practice',
        status: 'upcoming',
        submissions: 0,
        graded: 0,
        avgGrade: 0,
        createdAt: '2024-01-28T00:00:00.000Z',
        updatedAt: '2024-01-28T00:00:00.000Z'
      }
    ]
  };

  // Fetch assignments (realtime)
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['/api/instructor/assignments', accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyAssignmentsData;
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 15000
  });

  // Fetch instructor courses for assignment creation
  const { data: coursesData } = useQuery({
    queryKey: ['/api/instructor/courses'],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyCoursesData;
    },
    enabled: true, // Always enabled for dummy data
  });

  // Real-time updates
  useRealtimeInvalidate([
    ['/api/instructor/assignments', accessToken],
    ['/api/instructor/courses']
  ], ['assignments', 'courses']);

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData) => {
      const response = await fetch(buildApiUrl('/api/instructor/assignments'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create assignment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/assignments'] });
      toast({
        title: "Assignment Created",
        description: "New assignment has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewAssignment({
        title: '',
        description: '',
        courseId: '',
        dueDate: '',
        maxGrade: 100,
        instructions: '',
        type: 'practice'
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive"
      });
    }
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId) => {
      const response = await fetch(buildApiUrl(`/api/instructor/assignments/${assignmentId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/assignments'] });
      toast({
        title: "Assignment Deleted",
        description: "Assignment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive"
      });
    }
  });

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    createAssignmentMutation.mutate(newAssignment);
  };

  const handleDeleteAssignment = (assignmentId) => {
    deleteAssignmentMutation.mutate(assignmentId);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default', color: 'bg-green-100 text-green-800' },
      upcoming: { label: 'Upcoming', variant: 'secondary', color: 'bg-blue-100 text-blue-800' },
      overdue: { label: 'Overdue', variant: 'destructive', color: 'bg-red-100 text-red-800' },
      completed: { label: 'Completed', variant: 'outline', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSubmissionStats = (assignment) => {
    const totalSubmissions = assignment.submissions?.length || 0;
    const gradedSubmissions = assignment.submissions?.filter(s => s.grade !== null).length || 0;
    const pendingGrading = totalSubmissions - gradedSubmissions;
    
    return { totalSubmissions, gradedSubmissions, pendingGrading };
  };

  const assignments = assignmentsData?.assignments || [];
  const courses = coursesData?.courses || [];

  const filterAssignments = (status) => {
    switch (status) {
      case 'active':
        return assignments.filter(a => a.status === 'active');
      case 'upcoming':
        return assignments.filter(a => a.status === 'upcoming');
      case 'completed':
        return assignments.filter(a => a.status === 'completed');
      case 'grading':
        return assignments.filter(a => {
          const stats = getSubmissionStats(a);
          return stats.pendingGrading > 0;
        });
      default:
        return assignments;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignment Grading</h1>
          <p className="text-gray-600 mt-2">Grade assignments, provide feedback, and track student progress</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter assignment title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="course">Course</Label>
                <Select 
                  value={newAssignment.courseId} 
                  onValueChange={(value) => setNewAssignment(prev => ({ ...prev, courseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the assignment"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxGrade">Max Grade</Label>
                  <Input
                    id="maxGrade"
                    type="number"
                    value={newAssignment.maxGrade}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, maxGrade: parseInt(e.target.value) }))}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Detailed instructions for students"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="type">Assignment Type</Label>
                <Select 
                  value={newAssignment.type} 
                  onValueChange={(value) => setNewAssignment(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAssignmentMutation.isPending}>
                  {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Active ({filterAssignments('active').length})
          </TabsTrigger>
          <TabsTrigger value="grading" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Need Grading ({filterAssignments('grading').length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Upcoming ({filterAssignments('upcoming').length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed ({filterAssignments('completed').length})
          </TabsTrigger>
        </TabsList>

        {['active', 'grading', 'upcoming', 'completed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="grid gap-4">
              {filterAssignments(tab).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-center">
                      No {tab} assignments found
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterAssignments(tab).map((assignment) => {
                  const stats = getSubmissionStats(assignment);
                  return (
                    <Card key={assignment.id} className="card-hover">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-3">
                              {assignment.title}
                              {getStatusBadge(assignment.status)}
                            </CardTitle>
                            <p className="text-sm text-gray-600">{assignment.courseTitle}</p>
                            <p className="text-sm text-gray-500">{assignment.description}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            {tab === 'grading' && (
                              <Button 
                                size="sm" 
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => setSelectedAssignmentForGrading(assignment)}
                              >
                                <Star className="w-4 h-4" />
                                Grade Now
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              Feedback
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{assignment.title}"? This action cannot be undone and all student submissions will be lost.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              Max Grade: {assignment.maxGrade}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {stats.totalSubmissions} submission{stats.totalSubmissions !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          {stats.pendingGrading > 0 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {stats.pendingGrading} need grading
                            </Badge>
                          )}
                        </div>
                        
                        {stats.totalSubmissions > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Grading Progress</span>
                              <span>{stats.gradedSubmissions}/{stats.totalSubmissions}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${(stats.gradedSubmissions / stats.totalSubmissions) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Grading Interface Dialog */}
      <Dialog open={!!selectedAssignmentForGrading} onOpenChange={() => setSelectedAssignmentForGrading(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Grading Interface</DialogTitle>
            <DialogDescription>
              Grade student submissions with detailed feedback and rubric-based scoring
            </DialogDescription>
          </DialogHeader>
          {selectedAssignmentForGrading && (
            <div className="p-4">
              <p className="text-gray-600">Grading interface will be implemented here.</p>
              <Button onClick={() => setSelectedAssignmentForGrading(null)} className="mt-4">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorAssignments;