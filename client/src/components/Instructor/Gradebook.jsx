import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp, 
  TrendingDown,
  Download,
  Upload,
  Search,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Calculator,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Eye,
  FileText,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Calendar,
  User,
  Mail,
  Phone
} from 'lucide-react';

const Gradebook = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState('1'); // Set default course
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [isEditGradeDialogOpen, setIsEditGradeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingGrade, setEditingGrade] = useState({});
  const [gradeWeights, setGradeWeights] = useState({});
  const [viewMode, setViewMode] = useState('students');

  // Comprehensive dummy data for gradebook
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

  const dummyGradebookData = {
    courseId: '1',
    courseTitle: 'Complete Web Development Bootcamp',
    assignments: [
      {
        _id: '1',
        title: 'Build a Personal Portfolio Website',
        maxGrade: 100,
        weight: 25,
        dueDate: '2024-02-15T23:59:59.000Z',
        type: 'project'
      },
      {
        _id: '2',
        title: 'CSS Grid Layout Exercise',
        maxGrade: 60,
        weight: 15,
        dueDate: '2024-01-30T23:59:59.000Z',
        type: 'practice'
      },
      {
        _id: '3',
        title: 'JavaScript DOM Manipulation',
        maxGrade: 70,
        weight: 20,
        dueDate: '2024-02-05T23:59:59.000Z',
        type: 'practice'
      },
      {
        _id: '4',
        title: 'HTML Fundamentals Quiz',
        maxGrade: 50,
        weight: 10,
        dueDate: '2024-01-25T23:59:59.000Z',
        type: 'quiz'
      },
      {
        _id: '5',
        title: 'Final Project',
        maxGrade: 150,
        weight: 30,
        dueDate: '2024-03-01T23:59:59.000Z',
        type: 'project'
      }
    ],
    students: [
      {
        _id: '1',
        profile: { firstName: 'Alice', lastName: 'Johnson' },
        email: 'alice.johnson@example.com',
        studentId: 'S001',
        grades: [
          { assignmentId: '1', grade: 95, maxGrade: 100, status: 'graded', submittedAt: '2024-02-14T10:30:00.000Z' },
          { assignmentId: '2', grade: 88, maxGrade: 60, status: 'graded', submittedAt: '2024-01-29T14:20:00.000Z' },
          { assignmentId: '3', grade: null, maxGrade: 70, status: 'pending', submittedAt: null },
          { assignmentId: '4', grade: 45, maxGrade: 50, status: 'graded', submittedAt: '2024-01-24T16:45:00.000Z' },
          { assignmentId: '5', grade: null, maxGrade: 150, status: 'not-submitted', submittedAt: null }
        ],
        overallGrade: 91.5,
        attendance: 100,
        lastActivity: '2024-01-20T15:30:00.000Z'
      },
      {
        _id: '2',
        profile: { firstName: 'Bob', lastName: 'Smith' },
        email: 'bob.smith@example.com',
        studentId: 'S002',
        grades: [
          { assignmentId: '1', grade: 80, maxGrade: 100, status: 'graded', submittedAt: '2024-02-13T11:15:00.000Z' },
          { assignmentId: '2', grade: 75, maxGrade: 60, status: 'graded', submittedAt: '2024-01-28T09:30:00.000Z' },
          { assignmentId: '3', grade: null, maxGrade: 70, status: 'pending', submittedAt: null },
          { assignmentId: '4', grade: 38, maxGrade: 50, status: 'graded', submittedAt: '2024-01-23T13:45:00.000Z' },
          { assignmentId: '5', grade: null, maxGrade: 150, status: 'not-submitted', submittedAt: null }
        ],
        overallGrade: 77.5,
        attendance: 85,
        lastActivity: '2024-01-19T14:20:00.000Z'
      },
      {
        _id: '3',
        profile: { firstName: 'Charlie', lastName: 'Brown' },
        email: 'charlie.brown@example.com',
        studentId: 'S003',
        grades: [
          { assignmentId: '1', grade: 70, maxGrade: 100, status: 'graded', submittedAt: '2024-02-12T16:20:00.000Z' },
          { assignmentId: '2', grade: 65, maxGrade: 60, status: 'graded', submittedAt: '2024-01-27T12:10:00.000Z' },
          { assignmentId: '3', grade: null, maxGrade: 70, status: 'pending', submittedAt: null },
          { assignmentId: '4', grade: 32, maxGrade: 50, status: 'graded', submittedAt: '2024-01-22T15:30:00.000Z' },
          { assignmentId: '5', grade: null, maxGrade: 150, status: 'not-submitted', submittedAt: null }
        ],
        overallGrade: 67.5,
        attendance: 90,
        lastActivity: '2024-01-18T16:45:00.000Z'
      },
      {
        _id: '4',
        profile: { firstName: 'Diana', lastName: 'Prince' },
        email: 'diana.prince@example.com',
        studentId: 'S004',
        grades: [
          { assignmentId: '1', grade: 92, maxGrade: 100, status: 'graded', submittedAt: '2024-02-14T08:45:00.000Z' },
          { assignmentId: '2', grade: 90, maxGrade: 60, status: 'graded', submittedAt: '2024-01-29T10:15:00.000Z' },
          { assignmentId: '3', grade: null, maxGrade: 70, status: 'pending', submittedAt: null },
          { assignmentId: '4', grade: 48, maxGrade: 50, status: 'graded', submittedAt: '2024-01-24T11:20:00.000Z' },
          { assignmentId: '5', grade: null, maxGrade: 150, status: 'not-submitted', submittedAt: null }
        ],
        overallGrade: 89.0,
        attendance: 95,
        lastActivity: '2024-01-20T12:30:00.000Z'
      },
      {
        _id: '5',
        profile: { firstName: 'Eve', lastName: 'Adams' },
        email: 'eve.adams@example.com',
        studentId: 'S005',
        grades: [
          { assignmentId: '1', grade: 85, maxGrade: 100, status: 'graded', submittedAt: '2024-02-13T14:30:00.000Z' },
          { assignmentId: '2', grade: 82, maxGrade: 60, status: 'graded', submittedAt: '2024-01-28T16:45:00.000Z' },
          { assignmentId: '3', grade: null, maxGrade: 70, status: 'pending', submittedAt: null },
          { assignmentId: '4', grade: 42, maxGrade: 50, status: 'graded', submittedAt: '2024-01-23T09:15:00.000Z' },
          { assignmentId: '5', grade: null, maxGrade: 150, status: 'not-submitted', submittedAt: null }
        ],
        overallGrade: 81.0,
        attendance: 88,
        lastActivity: '2024-01-19T11:45:00.000Z'
      }
    ]
  };

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

  // Fetch assignments for selected course
  const { data: assignmentsData } = useQuery({
    queryKey: ['course-assignments', selectedCourse, accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return { assignments: dummyGradebookData.assignments };
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 15000
  });

  // Fetch students and grades for selected course
  const { data: gradebookData } = useQuery({
    queryKey: ['gradebook', selectedCourse, accessToken],
    queryFn: async () => {
      // Return dummy data for demonstration
      return dummyGradebookData;
    },
    enabled: true, // Always enabled for dummy data
    refetchInterval: 10000
  });

  // Real-time updates
  useRealtimeInvalidate([
    ['instructor-courses', user?._id],
    ['instructor-assignments', selectedCourse],
    ['instructor-gradebook', selectedCourse]
  ], ['courses', 'assignments', 'grades']);

  // Update grade mutation
  const updateGradeMutation = useMutation({
    mutationFn: async ({ studentId, assignmentId, grade, feedback }) => {
      const response = await fetch(buildApiUrl(`/api/instructor/grades/${studentId}/${assignmentId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ grade, feedback })
      });

      if (!response.ok) {
        throw new Error('Failed to update grade');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Grade Updated",
        description: "Student grade has been updated successfully.",
      });
      queryClient.invalidateQueries(['gradebook']);
      setIsEditGradeDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Bulk grade update mutation
  const bulkGradeUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      const response = await fetch(buildApiUrl(`/api/instructor/grades/bulk`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ updates, courseId: selectedCourse })
      });

      if (!response.ok) {
        throw new Error('Failed to update grades');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Grades Updated",
        description: "All grades have been updated successfully.",
      });
      queryClient.invalidateQueries(['gradebook']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEditGrade = (student, assignment) => {
    setSelectedStudent(student);
    setEditingGrade({
      studentId: student._id,
      assignmentId: assignment._id,
      grade: assignment.grade || 0,
      feedback: assignment.feedback || ''
    });
    setIsEditGradeDialogOpen(true);
  };

  const handleSaveGrade = () => {
    if (editingGrade.grade < 0 || editingGrade.grade > 100) {
      toast({
        title: "Invalid Grade",
        description: "Grade must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    updateGradeMutation.mutate(editingGrade);
  };

  const calculateStudentAverage = (student) => {
    const grades = student.assignments || [];
    if (grades.length === 0) return 0;
    
    const totalPoints = grades.reduce((sum, assignment) => {
      const weight = gradeWeights[assignment.assignmentId] || 1;
      return sum + (assignment.grade || 0) * weight;
    }, 0);
    
    const totalWeight = grades.reduce((sum, assignment) => {
      return sum + (gradeWeights[assignment.assignmentId] || 1);
    }, 0);
    
    return totalWeight > 0 ? Math.round(totalPoints / totalWeight) : 0;
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBadgeColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredStudents = () => {
    let students = Array.isArray(gradebookData?.students) ? gradebookData.students : [];
    
    if (searchQuery && Array.isArray(students)) {
      students = students.filter(student => 
        student.profile?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.profile?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterGrade !== 'all' && Array.isArray(students)) {
      students = students.filter(student => {
        const average = calculateStudentAverage(student);
        switch (filterGrade) {
          case 'A': return average >= 90;
          case 'B': return average >= 80 && average < 90;
          case 'C': return average >= 70 && average < 80;
          case 'D': return average >= 60 && average < 70;
          case 'F': return average < 60;
          default: return true;
        }
      });
    }
    
    return students;
  };

  const courses = coursesData?.courses || [];
  const assignments = assignmentsData?.assignments || [];
  const students = filteredStudents();
  const summary = gradebookData?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-gray-600">Manage student grades and track academic progress</p>
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {selectedCourse ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class Average</p>
                    <p className="text-2xl font-bold text-green-600">{summary.average || 0}%</p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Passing Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.passingRate || 0}%</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assignments</p>
                    <p className="text-2xl font-bold text-purple-600">{assignments.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">A (90-100)</SelectItem>
                <SelectItem value="B">B (80-89)</SelectItem>
                <SelectItem value="C">C (70-79)</SelectItem>
                <SelectItem value="D">D (60-69)</SelectItem>
                <SelectItem value="F">F (0-59)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={viewMode === 'students' ? 'default' : 'outline'}
                onClick={() => setViewMode('students')}
              >
                Students
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'assignments' ? 'default' : 'outline'}
                onClick={() => setViewMode('assignments')}
              >
                Assignments
              </Button>
            </div>
          </div>

          {/* Gradebook Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Gradebook - {courses.find(c => c._id === selectedCourse)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Student</th>
                      {assignments.map((assignment) => (
                        <th key={assignment._id} className="text-center p-3 font-medium min-w-[100px]">
                          <div className="flex flex-col items-center">
                            <span className="text-sm">{assignment.title}</span>
                            <span className="text-xs text-gray-500">{assignment.maxPoints} pts</span>
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-3 font-medium">Average</th>
                      <th className="text-center p-3 font-medium">Grade</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const average = calculateStudentAverage(student);
                      const gradeLetter = getGradeLetter(average);
                      
                      return (
                        <tr key={student._id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {student.profile?.firstName?.charAt(0) || 'S'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">
                                  {student.profile?.firstName} {student.profile?.lastName}
                                </h4>
                                <p className="text-xs text-gray-500">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          {assignments.map((assignment) => {
                            const studentAssignment = student.assignments?.find(a => a.assignmentId === assignment._id);
                            const grade = studentAssignment?.grade || 0;
                            const isGraded = studentAssignment?.graded || false;
                            
                            return (
                              <td key={assignment._id} className="text-center p-3">
                                <div className="flex flex-col items-center">
                                  <span className={`font-medium ${getGradeColor(grade)}`}>
                                    {isGraded ? grade : '-'}
                                  </span>
                                  {isGraded && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(studentAssignment?.gradedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="text-center p-3">
                            <span className={`font-bold text-lg ${getGradeColor(average)}`}>
                              {average}%
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <Badge className={getGradeBadgeColor(average)}>
                              {gradeLetter}
                            </Badge>
                          </td>
                          <td className="text-center p-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditGrade(student, { _id: 'all', title: 'All Assignments' })}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
            <p className="text-gray-600">Choose a course to view its gradebook</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Grade Dialog */}
      <Dialog open={isEditGradeDialogOpen} onOpenChange={setIsEditGradeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Update grade for {selectedStudent?.profile?.firstName} {selectedStudent?.profile?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                value={editingGrade.grade}
                onChange={(e) => setEditingGrade(prev => ({ ...prev, grade: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <textarea
                id="feedback"
                value={editingGrade.feedback}
                onChange={(e) => setEditingGrade(prev => ({ ...prev, feedback: e.target.value }))}
                className="w-full p-2 border rounded-md"
                rows={4}
                placeholder="Enter feedback for the student..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditGradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveGrade}
                disabled={updateGradeMutation.isPending}
              >
                {updateGradeMutation.isPending ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gradebook;
