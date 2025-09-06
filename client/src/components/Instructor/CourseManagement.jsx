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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Video, 
  Calendar,
  Clock,
  Star,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  BarChart3,
  Target,
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

const CourseManagement = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateSectionDialogOpen, setIsCreateSectionDialogOpen] = useState(false);
  const [isCreateLectureDialogOpen, setIsCreateLectureDialogOpen] = useState(false);
  const [newSection, setNewSection] = useState({ title: '', description: '' });
  const [newLecture, setNewLecture] = useState({ 
    title: '', 
    description: '', 
    type: 'video', 
    duration: 0, 
    content: '',
    sectionId: ''
  });
  const [expandedSections, setExpandedSections] = useState(new Set());

  // Fetch instructor courses
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

  // Fetch course details
  const { data: courseDetails } = useQuery({
    queryKey: ['course-details', selectedCourse, accessToken],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const res = await fetch(buildApiUrl(`/api/instructor/courses/${selectedCourse}/details`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!accessToken && !!selectedCourse,
    refetchInterval: 15000
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (sectionData) => {
      const response = await fetch(buildApiUrl(`/api/instructor/courses/${selectedCourse}/sections`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(sectionData)
      });

      if (!response.ok) {
        throw new Error('Failed to create section');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Section Created",
        description: "New section has been created successfully.",
      });
      queryClient.invalidateQueries(['course-details']);
      setIsCreateSectionDialogOpen(false);
      setNewSection({ title: '', description: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create lecture mutation
  const createLectureMutation = useMutation({
    mutationFn: async (lectureData) => {
      const response = await fetch(buildApiUrl(`/api/instructor/courses/${selectedCourse}/lectures`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(lectureData)
      });

      if (!response.ok) {
        throw new Error('Failed to create lecture');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lecture Created",
        description: "New lecture has been created successfully.",
      });
      queryClient.invalidateQueries(['course-details']);
      setIsCreateLectureDialogOpen(false);
      setNewLecture({ 
        title: '', 
        description: '', 
        type: 'video', 
        duration: 0, 
        content: '',
        sectionId: ''
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

  // Update course status mutation
  const updateCourseStatusMutation = useMutation({
    mutationFn: async ({ courseId, status }) => {
      const response = await fetch(buildApiUrl(`/api/instructor/courses/${courseId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update course status');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Course status has been updated successfully.",
      });
      queryClient.invalidateQueries(['instructor-courses']);
      queryClient.invalidateQueries(['course-details']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateSection = () => {
    if (!newSection.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a section title.",
        variant: "destructive",
      });
      return;
    }

    createSectionMutation.mutate({
      ...newSection,
      courseId: selectedCourse
    });
  };

  const handleCreateLecture = () => {
    if (!newLecture.title.trim() || !newLecture.sectionId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createLectureMutation.mutate({
      ...newLecture,
      courseId: selectedCourse
    });
  };

  const handleToggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'archived': return <XCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getLectureIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-red-500" />;
      case 'text': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'quiz': return <Target className="w-4 h-4 text-green-500" />;
      case 'assignment': return <Award className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const filteredCourses = () => {
    let courses = coursesData?.courses || [];
    
    if (searchQuery) {
      courses = courses.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      courses = courses.filter(course => course.status === filterStatus);
    }
    
    return courses;
  };

  const courses = filteredCourses();
  const course = courseDetails;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600">Manage your assigned courses and content</p>
        </div>
        <div className="flex gap-2">
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

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Your Courses ({courses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCourse === course._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCourse(course._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{course.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(course.status)}>
                          {getStatusIcon(course.status)}
                          <span className="ml-1 capitalize">{course.status}</span>
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {course.enrolledStudents || 0} students
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Course Details */}
        <div className="lg:col-span-2">
          {selectedCourse && course ? (
            <div className="space-y-6">
              {/* Course Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        {course.title}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{course.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Select 
                        value={course.status} 
                        onValueChange={(status) => updateCourseStatusMutation.mutate({ 
                          courseId: selectedCourse, 
                          status 
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{course.enrolledStudents || 0}</p>
                      <p className="text-sm text-gray-600">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{course.sections?.length || 0}</p>
                      <p className="text-sm text-gray-600">Sections</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{course.totalLectures || 0}</p>
                      <p className="text-sm text-gray-600">Lectures</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{course.rating || 0}</p>
                      <p className="text-sm text-gray-600">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Course Content
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => setIsCreateSectionDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        New Section
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setIsCreateLectureDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        New Lecture
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.sections?.map((section) => (
                      <div key={section._id} className="border rounded-lg">
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleToggleSection(section._id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {section.order || 1}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium">{section.title}</h4>
                                <p className="text-sm text-gray-500">{section.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {section.lectures?.length || 0} lectures
                              </span>
                              <Button size="sm" variant="outline">
                                {expandedSections.has(section._id) ? 'Collapse' : 'Expand'}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {expandedSections.has(section._id) && (
                          <div className="border-t bg-gray-50">
                            <div className="p-4 space-y-2">
                              {section.lectures?.map((lecture) => (
                                <div key={lecture._id} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div className="flex items-center gap-3">
                                    {getLectureIcon(lecture.type)}
                                    <div>
                                      <h5 className="font-medium text-sm">{lecture.title}</h5>
                                      <p className="text-xs text-gray-500">{lecture.description}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {formatDuration(lecture.duration)}
                                    </span>
                                    <Button size="sm" variant="outline">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                <p className="text-gray-600">Choose a course to manage its content</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Section Dialog */}
      <Dialog open={isCreateSectionDialogOpen} onOpenChange={setIsCreateSectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
            <DialogDescription>
              Add a new section to organize your course content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sectionTitle">Section Title</Label>
              <Input
                id="sectionTitle"
                value={newSection.title}
                onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter section title"
              />
            </div>
            <div>
              <Label htmlFor="sectionDescription">Description</Label>
              <Textarea
                id="sectionDescription"
                value={newSection.description}
                onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter section description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateSectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSection}
                disabled={createSectionMutation.isPending}
              >
                {createSectionMutation.isPending ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Lecture Dialog */}
      <Dialog open={isCreateLectureDialogOpen} onOpenChange={setIsCreateLectureDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Lecture</DialogTitle>
            <DialogDescription>
              Add a new lecture to your course section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lectureTitle">Lecture Title</Label>
              <Input
                id="lectureTitle"
                value={newLecture.title}
                onChange={(e) => setNewLecture(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter lecture title"
              />
            </div>
            <div>
              <Label htmlFor="lectureDescription">Description</Label>
              <Textarea
                id="lectureDescription"
                value={newLecture.description}
                onChange={(e) => setNewLecture(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter lecture description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lectureType">Type</Label>
                <Select value={newLecture.type} onValueChange={(value) => setNewLecture(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lectureDuration">Duration (minutes)</Label>
                <Input
                  id="lectureDuration"
                  type="number"
                  min="0"
                  value={newLecture.duration}
                  onChange={(e) => setNewLecture(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="lectureSection">Section</Label>
              <Select value={newLecture.sectionId} onValueChange={(value) => setNewLecture(prev => ({ ...prev, sectionId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {course?.sections?.map((section) => (
                    <SelectItem key={section._id} value={section._id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lectureContent">Content</Label>
              <Textarea
                id="lectureContent"
                value={newLecture.content}
                onChange={(e) => setNewLecture(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter lecture content or instructions"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateLectureDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLecture}
                disabled={createLectureMutation.isPending}
              >
                {createLectureMutation.isPending ? 'Creating...' : 'Create Lecture'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagement;
