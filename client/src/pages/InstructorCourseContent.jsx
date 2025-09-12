import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeInvalidate } from '@/lib/useRealtimeInvalidate.js';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Upload, 
  FileText, 
  Video, 
  Image, 
  Link, 
  Plus, 
  Edit3, 
  Trash2, 
  Download,
  Eye,
  Calendar,
  Clock
} from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';

const InstructorCourseContent = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [, params] = useRoute('/instructor/courses/:courseId');
  
  const courseId = params?.courseId;
  
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'document',
    description: '',
    file: null
  });

  // Fetch course details
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/courses/${courseId}`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    },
    enabled: !!courseId && !!accessToken,
    refetchInterval: 30000
  });

  // Fetch course materials
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: ['course-materials', courseId, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/courses/${courseId}/materials`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { materials: [] };
      return res.json();
    },
    enabled: !!courseId && !!accessToken,
    refetchInterval: 30000
  });

  useRealtimeInvalidate([
    ['course', courseId],
    ['course-materials', courseId]
  ], ['courses', 'materials']);

  // Add material mutation
  const addMaterialMutation = useMutation({
    mutationFn: async (materialData) => {
      const formData = new FormData();
      formData.append('title', materialData.title);
      formData.append('type', materialData.type);
      formData.append('description', materialData.description);
      if (materialData.file) {
        formData.append('file', materialData.file);
      }

      const response = await fetch(buildApiUrl(`/api/courses/${courseId}/materials`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to add material');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material Added",
        description: "Course material has been added successfully.",
      });
      queryClient.invalidateQueries(['course-materials']);
      setNewMaterial({ title: '', type: 'document', description: '', file: null });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId) => {
      const response = await fetch(buildApiUrl(`/api/courses/${courseId}/materials/${materialId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete material');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material Deleted",
        description: "Course material has been deleted successfully.",
      });
      queryClient.invalidateQueries(['course-materials']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newMaterial.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the material.",
        variant: "destructive",
      });
      return;
    }
    addMaterialMutation.mutate(newMaterial);
  };

  const handleDeleteMaterial = (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      deleteMaterialMutation.mutate(materialId);
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'video': return Video;
      case 'image': return Image;
      case 'link': return Link;
      default: return FileText;
    }
  };

  const getMaterialTypeColor = (type) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'link': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (courseLoading) return <LoadingSpinner />;

  const course = courseData?.course;
  const materials = materialsData?.materials || [];

  if (!course) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => setLocation('/instructor/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600">Manage course content and materials</p>
        </div>
        <Button onClick={() => setLocation('/instructor/courses')} variant="outline">
          Back to Courses
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Course Details</h3>
              <p className="text-sm text-gray-600 mb-1">{course.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                  {course.status}
                </Badge>
                <span className="text-sm text-gray-500">{course.enrolledStudents || 0} students</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Content Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Materials:</span>
                  <span className="font-medium">{materials.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lessons:</span>
                  <span className="font-medium">{course.lessons?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{course.duration || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Button size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lesson
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Materials
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Management Tabs */}
      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          {/* Add Material Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Material</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter material title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="document">Document</option>
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                      <option value="link">Link</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter material description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="file">File (if applicable)</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, file: e.target.files[0] }))}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.jpeg,.png"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={addMaterialMutation.isPending}
                  className="w-full"
                >
                  {addMaterialMutation.isPending ? 'Adding...' : 'Add Material'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Materials List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Course Materials</h3>
            {materialsLoading ? (
              <LoadingSpinner />
            ) : materials.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No materials yet</h3>
                  <p className="text-gray-600">Add your first course material to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => {
                  const Icon = getMaterialIcon(material.type);
                  return (
                    <Card key={material._id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-5 h-5 text-gray-600" />
                            <CardTitle className="text-sm">{material.title}</CardTitle>
                          </div>
                          <Badge className={getMaterialTypeColor(material.type)}>
                            {material.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                          <span>{material.fileSize || 'N/A'}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteMaterial(material._id)}
                            disabled={deleteMaterialMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Lessons Management</h3>
              <p className="text-gray-600 mb-6">Create and manage course lessons</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Lesson
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Course Assignments</h3>
              <p className="text-gray-600 mb-6">Manage assignments for this course</p>
              <Button onClick={() => setLocation('/instructor/assignments')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorCourseContent;
