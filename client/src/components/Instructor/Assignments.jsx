import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';
import { Plus, Edit, Trash2, Clock, CheckCircle, Calendar, Users, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';

const InstructorAssignments = () => {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    maxGrade: 100,
    instructions: '',
    type: 'practice'
  });

  // Fetch assignments
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['/api/instructor/assignments'],
    queryFn: async () => {
      const response = await fetch('/api/instructor/assignments', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      return response.json();
    },
    enabled: !!accessToken
  });

  // Fetch instructor courses for assignment creation
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
    enabled: !!accessToken
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData) => {
      const response = await fetch('/api/instructor/assignments', {
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
      const response = await fetch(`/api/instructor/assignments/${assignmentId}`, {
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

  // Mock data for demonstration - in real app this would come from API
  const mockAssignments = [
    {
      id: 1,
      title: 'React Components Exercise',
      description: 'Build a functional React component with props and state',
      courseTitle: 'Frontend Development',
      dueDate: '2024-02-15',
      maxGrade: 100,
      status: 'active',
      submissions: [
        { id: 1, studentName: 'John Doe', grade: 85 },
        { id: 2, studentName: 'Jane Smith', grade: null },
        { id: 3, studentName: 'Mike Johnson', grade: 92 }
      ]
    },
    {
      id: 2,
      title: 'Database Design Project',
      description: 'Design and implement a normalized database schema',
      courseTitle: 'Backend Development',
      dueDate: '2024-02-20',
      maxGrade: 100,
      status: 'upcoming',
      submissions: []
    }
  ];

  const assignments = assignmentsData?.assignments || mockAssignments;
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
          <p className="text-gray-600 mt-1">Manage and track your course assignments</p>
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
                      <SelectItem key={course.id} value={course.id.toString()}>
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
          <TabsTrigger value="active">Active ({filterAssignments('active').length})</TabsTrigger>
          <TabsTrigger value="grading">Need Grading ({filterAssignments('grading').length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({filterAssignments('upcoming').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterAssignments('completed').length})</TabsTrigger>
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
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
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
    </div>
  );
};

export default InstructorAssignments;