import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRefresh } from '../../hooks/useAuthRefresh.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { buildApiUrl, getImageUrl } from '../../lib/utils.js';
import { 
  BookOpen, Search, Users, UserCheck, Plus, Eye, Edit, 
  Archive, Play, Filter, CheckCircle, Trash2, MoreHorizontal, Upload,
  ListPlus, Video, User, ThumbsUp, ThumbsDown, Star
} from 'lucide-react';
import { getSocket } from '@/lib/realtime.js';

const CourseManagement = () => {
  const { accessToken, user, isAuthenticated, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  

  
  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      </div>
    );
  }
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all'); // all | featured | non
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    language: 'English',
    price: 0,
    isPublished: false,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [structureOpen, setStructureOpen] = useState(false);
  const [structureCourse, setStructureCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [savingStructure, setSavingStructure] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [editCover, setEditCover] = useState(null);

  // Fetch courses with pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses', { isPublished: 'false', search: searchTerm, category: selectedCategory, level: selectedLevel, featuredFilter, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('isPublished', 'false'); // Get all courses, including unpublished
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel && selectedLevel !== 'all') params.append('level', selectedLevel);
      if (featuredFilter === 'featured') params.append('isFeatured', 'true');
      if (featuredFilter === 'non') params.append('isFeatured', 'false');
      params.append('page', String(page));
      params.append('limit', String(limit));
      
      const response = await authenticatedFetch(buildApiUrl(`/api/courses?${params.toString()}`), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      return response.json();
    },
    enabled: !!accessToken && !authLoading,
  });

  // Realtime refresh on course updates
  useEffect(() => {
    const socket = getSocket(accessToken);
    if (!socket) return;
    const handler = () => queryClient.invalidateQueries(['/api/courses']);
    socket.on('admin:courses:update', handler);
    return () => { try { socket.off('admin:courses:update', handler); } catch {} };
  }, [accessToken, queryClient]);

  // Fetch instructors for assignment
  const { data: instructorsData } = useQuery({
    queryKey: ['/api/admin/users', { role: 'instructor' }],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl('/api/admin/users?role=instructor'), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch instructors');
      }
      
      return response.json();
    },
    enabled: !!accessToken && !authLoading && assignDialogOpen,
  });

  // Assign instructor mutation
  const assignInstructorMutation = useMutation({
    mutationFn: async ({ courseId, instructorId }) => {
      const response = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId}/assign-instructor`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instructorId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign instructor');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Instructor assigned successfully",
      });
      setAssignDialogOpen(false);
      setSelectedCourse(null);
      setSelectedInstructor('');
      queryClient.invalidateQueries(['/api/courses']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (courseId) => {
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/courses/${courseId}/approve`), { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approve failed');
      return data;
    },
    onSuccess: () => { toast({ title: 'Approved' }); queryClient.invalidateQueries(['/api/courses']); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const rejectMutation = useMutation({
    mutationFn: async (courseId) => {
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/courses/${courseId}/reject`), { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reject failed');
      return data;
    },
    onSuccess: () => { toast({ title: 'Moved to review' }); queryClient.invalidateQueries(['/api/courses']); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const featureMutation = useMutation({
    mutationFn: async ({ courseId, isFeatured }) => {
      const res = await authenticatedFetch(buildApiUrl(`/api/admin/courses/${courseId}/featured`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFeatured }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Feature toggle failed');
      return data;
    },
    onSuccess: () => { toast({ title: 'Updated' }); queryClient.invalidateQueries(['/api/courses']); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await authenticatedFetch(buildApiUrl('/api/admin/courses/bulk/approve'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Bulk approve failed'); return data;
    },
    onSuccess: () => { toast({ title: 'Approved selected' }); setSelectedIds([]); queryClient.invalidateQueries(['/api/courses']); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const bulkCategoryMutation = useMutation({
    mutationFn: async ({ ids, category }) => {
      const res = await authenticatedFetch(buildApiUrl('/api/admin/courses/bulk/category'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, category }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Bulk category failed'); return data;
    },
    onSuccess: () => { toast({ title: 'Category assigned' }); setSelectedIds([]); setBulkCategory(''); queryClient.invalidateQueries(['/api/courses']); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const courses = coursesData?.courses || [];
  const pagination = coursesData?.pagination || { page, limit, total: courses.length };
  
  // Debug: Log course data to see coverUrl values
  console.log('=== COURSES DEBUG ===');
  console.log('Courses data:', courses);
  console.log('Courses loading:', coursesLoading);
  console.log('Query enabled:', !!accessToken && !authLoading);
  courses.forEach((course, index) => {
    console.log(`Course ${index + 1}:`, {
      title: course.title,
      coverUrl: course.coverUrl,
      cover: course.cover,
      hasCover: !!(course.coverUrl || course.cover),
      allFields: Object.keys(course)
    });
  });
  const instructors = instructorsData?.users || [];

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (isPublished) => {
    return isPublished 
      ? 'bg-green-100 text-green-700' 
      : 'bg-yellow-100 text-yellow-700';
  };

  const handleAssignInstructor = () => {
    if (selectedCourse && selectedInstructor) {
      assignInstructorMutation.mutate({
        courseId: selectedCourse._id,
        instructorId: selectedInstructor
      });
    }
  };

  const openAssignDialog = (course) => {
    setSelectedCourse(course);
    setSelectedInstructor(course.assignedInstructor?._id || '');
    setAssignDialogOpen(true);
  };

  const openStructureDialog = (course) => {
    setStructureCourse(course);
    setSections(Array.isArray(course.sections) ? JSON.parse(JSON.stringify(course.sections)) : []);
    setStructureOpen(true);
  };

  const addSection = () => setSections(prev => [...prev, { title: '', lectures: [] }]);
  const updateSectionTitle = (idx, title) => setSections(prev => prev.map((s, i) => i === idx ? { ...s, title } : s));
  const removeSection = (idx) => setSections(prev => prev.filter((_, i) => i !== idx));
  const addLecture = (sidx) => setSections(prev => prev.map((s, i) => i === sidx ? { ...s, lectures: [...(s.lectures || []), { title: '', videoUrl: '' }] } : s));
  const updateLecture = (sidx, lidx, field, value) => setSections(prev => prev.map((s, i) => {
    if (i !== sidx) return s;
    const lectures = (s.lectures || []).map((l, j) => j === lidx ? { ...l, [field]: value } : l);
    return { ...s, lectures };
  }));
  const removeLecture = (sidx, lidx) => setSections(prev => prev.map((s, i) => i === sidx ? { ...s, lectures: (s.lectures || []).filter((_, j) => j !== lidx) } : s));

  const uploadLectureVideo = async (file) => {
    const form = new FormData();
    form.append('video', file);
          const res = await authenticatedFetch(buildApiUrl(`/api/courses/${structureCourse._id}/lectures/upload`), { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to upload');
    return data.url;
  };

  const saveStructure = async () => {
    setSavingStructure(true);
    try {
      const res = await authenticatedFetch(buildApiUrl(`/api/courses/${structureCourse._id}/structure`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      toast({ title: 'Saved', description: 'Course structure updated' });
      setStructureOpen(false);
      setStructureCourse(null);
      setSections([]);
      queryClient.invalidateQueries(['/api/courses']);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSavingStructure(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Management</h2>
          <p className="text-gray-600">Manage all courses and assign instructors</p>
        </div>
        
        <div className="flex gap-2">

          <Button onClick={() => setCreateOpen(true)} data-testid="button-create-course">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.isPublished).length}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {courses.filter(c => !c.isPublished).length}
            </div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {courses.reduce((total, course) => total + (course.enrollmentCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Enrollments</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md border-0 bg-gradient-to-r from-gray-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-courses"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="programming">Programming</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="data-science">Data Science</SelectItem>
                  <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="non">Non-featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedIds.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="text-sm text-gray-700">Selected: {selectedIds.length}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => bulkApproveMutation.mutate(selectedIds)} disabled={bulkApproveMutation.isPending}>Approve Selected</Button>
                <div className="flex gap-2 items-center">
                  <Input placeholder="Category" value={bulkCategory} onChange={(e)=> setBulkCategory(e.target.value)} className="w-40" />
                  <Button size="sm" variant="outline" onClick={() => bulkCategory && bulkCategoryMutation.mutate({ ids: selectedIds, category: bulkCategory })} disabled={!bulkCategory || bulkCategoryMutation.isPending}>Assign Category</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="text-sm font-medium text-gray-700">Page {pagination.page} of {Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || limit)))} • {pagination.total || 0} results</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={pagination.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="hover:bg-blue-50 hover:border-blue-300">Prev</Button>
          <Button variant="outline" disabled={pagination.page >= Math.ceil((pagination.total || 0) / (pagination.limit || limit))} onClick={() => setPage(p => p + 1)} className="hover:bg-blue-50 hover:border-blue-300">Next</Button>
          <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-24 hover:border-blue-300">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Courses Table */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
          <CardTitle className="text-2xl font-bold text-gray-800">All Courses ({courses.length})</CardTitle>
          <CardDescription className="text-gray-600 font-medium">
            Manage courses and assign instructors
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {coursesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No courses found</p>
            </div>
          ) : (
            <Table className="w-full border-collapse border border-gray-200 rounded-xl overflow-hidden shadow-lg">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                  <TableHead className="w-8 px-2"><input type="checkbox" checked={selectedIds.length>0 && selectedIds.length===courses.length} onChange={(e)=> setSelectedIds(e.target.checked ? courses.map(c=>c._id) : [])} /></TableHead>
                  <TableHead className="w-20 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">Thumbnail</TableHead>
                  <TableHead className="w-64 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">Course</TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">Instructor</TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">Level</TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">Status</TableHead>
                  <TableHead className="w-24 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200">Featured</TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">Enrollments</TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">Created</TableHead>
                  <TableHead className="w-48 px-4 py-3 text-left font-bold text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course._id} data-testid={`course-row-${course._id}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100 hover:shadow-md hover:scale-[1.01] transform">
                    <TableCell className="px-2"><input type="checkbox" checked={selectedIds.includes(course._id)} onChange={(e)=> setSelectedIds(s => e.target.checked ? [...new Set([...s, course._id])] : s.filter(id=>id!==course._id))} /></TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200 hover:bg-blue-50 transition-colors">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105">
                        {(course.coverUrl || course.cover) ? (
                          <img 
                            src={getImageUrl(course.coverUrl || course.cover, buildApiUrl(''))} 
                            alt={course.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <BookOpen className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200 hover:bg-blue-50 transition-colors">
                      <div className="w-64">
                        <div className="font-bold text-gray-900 truncate text-lg mb-2 hover:text-blue-600 transition-colors cursor-pointer">{course.title}</div>
                        <div className="text-sm text-gray-600 leading-relaxed max-w-xs overflow-hidden mb-3">
                          <div className="line-clamp-2" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {course.description}
                          </div>
                        </div>
                        <div className="text-xs text-blue-700 font-bold mt-2 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1.5 rounded-full inline-block border border-blue-200 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105">
                          {course.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200 hover:bg-blue-50 transition-colors">
                      {course.assignedInstructor ? (
                        <div>
                          <div className="font-medium">
                            {course.assignedInstructor.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            Assigned
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-red-600">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200 hover:bg-blue-50 transition-colors">
                      <Badge className={`${getLevelColor(course.level)} px-3 py-1.5 font-semibold shadow-sm`}>
                        {course.level || 'Beginner'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200 hover:bg-blue-50 transition-colors">
                      <Badge className={`${getStatusColor(course.isPublished)} px-3 py-1.5 font-semibold shadow-sm`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                      {course.isFeatured ? <span className="text-yellow-600 font-medium">Yes</span> : <span className="text-gray-500">No</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        {course.enrollmentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200 hover:bg-blue-50 transition-colors">
                      {formatDate(course.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 hover:bg-blue-50 transition-colors">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssignDialog(course)}
                          data-testid={`button-assign-instructor-${course._id}`}
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          {course.assignedInstructor ? 'Reassign' : 'Assign'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-view-course-${course._id}`}
                          className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditCourse(course); setEditOpen(true); setEditCover(null); }}
                          data-testid={`button-edit-course-${course._id}`}
                          className="hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 transition-all duration-200"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStructureDialog(course)}
                          data-testid={`button-structure-${course._id}`}
                          className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200"
                        >
                          <ListPlus className="w-3 h-3 mr-1" />
                          Structure
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(course._id)}><ThumbsUp className="w-3 h-3 mr-1"/>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(course._id)}><ThumbsDown className="w-3 h-3 mr-1"/>Reject</Button>
                        <Button size="sm" variant={course.isFeatured ? 'default' : 'outline'} onClick={() => featureMutation.mutate({ courseId: course._id, isFeatured: !course.isFeatured })}><Star className="w-3 h-3 mr-1"/>{course.isFeatured ? 'Unfeature' : 'Feature'}</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Instructor Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Instructor</DialogTitle>
            <DialogDescription>
              Select an instructor to assign to "{selectedCourse?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger data-testid="select-instructor">
                  <SelectValue placeholder="Select an instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor._id} value={instructor._id}>
                      {instructor.profile?.firstName && instructor.profile?.lastName
                        ? `${instructor.profile.firstName} ${instructor.profile.lastName} (${instructor.username})`
                        : instructor.username
                      } - {instructor.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setAssignDialogOpen(false)}
                data-testid="button-cancel-assign"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignInstructor}
                disabled={!selectedInstructor || assignInstructorMutation.isPending}
                data-testid="button-confirm-assign"
              >
                {assignInstructorMutation.isPending ? 'Assigning...' : 'Assign Instructor'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Structure Dialog */}
      <Dialog open={structureOpen} onOpenChange={setStructureOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Structure - {structureCourse?.title}</DialogTitle>
            <DialogDescription>Manage sections and lectures. Upload lecture videos to attach URLs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Total sections: {sections.length}</div>
              <Button size="sm" onClick={addSection}><ListPlus className="w-4 h-4 mr-1" />Add Section</Button>
            </div>
            {sections.map((section, sidx) => (
              <div key={sidx} className="border rounded-lg p-3 space-y-3">
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-500">Section {sidx + 1}</span>
                  <Input placeholder="Section title" value={section.title} onChange={e => updateSectionTitle(sidx, e.target.value)} />
                  <Button size="sm" variant="outline" onClick={() => removeSection(sidx)}>Remove</Button>
                </div>
                <div className="space-y-2">
                  {(section.lectures || []).map((lec, lidx) => (
                    <div key={lidx} className="border rounded p-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input placeholder="Lecture title" value={lec.title} onChange={e => updateLecture(sidx, lidx, 'title', e.target.value)} />
                        <div className="flex items-center gap-2">
                          <Input placeholder="Video URL" value={lec.videoUrl || ''} onChange={e => updateLecture(sidx, lidx, 'videoUrl', e.target.value)} />
                          <label className="text-sm cursor-pointer inline-flex items-center gap-1 text-primary-600">
                            <input type="file" accept="video/*" className="hidden" onChange={async e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const url = await uploadLectureVideo(file);
                                updateLecture(sidx, lidx, 'videoUrl', url);
                                toast({ title: 'Uploaded', description: 'Video attached to lecture' });
                              } catch (err) {
                                toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
                              }
                            }} />
                            <Video className="w-4 h-4" /> Upload
                          </label>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => removeLecture(sidx, lidx)}>Remove Lecture</Button>
                      </div>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addLecture(sidx)}>Add Lecture</Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setStructureOpen(false)}>Cancel</Button>
              <Button disabled={savingStructure} onClick={saveStructure}>{savingStructure ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information and settings
            </DialogDescription>
          </DialogHeader>
          {editCourse && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={editCourse.title} onChange={e => setEditCourse(c => ({...c, title: e.target.value}))} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input value={editCourse.description} onChange={e => setEditCourse(c => ({...c, description: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input value={editCourse.category || ''} onChange={e => setEditCourse(c => ({...c, category: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Level</label>
                  <Select value={editCourse.level || 'beginner'} onValueChange={v => setEditCourse(c => ({...c, level: v}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Input value={editCourse.language || ''} onChange={e => setEditCourse(c => ({...c, language: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input type="number" value={editCourse.price ?? 0} onChange={e => setEditCourse(c => ({...c, price: Number(e.target.value)}))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editCourse.isPublished} onChange={e => setEditCourse(c => ({...c, isPublished: e.target.checked}))} />
                  Published
                </label>
                <div className="text-sm text-gray-600">Current cover: {editCourse.coverUrl ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Replace Cover</label>
                <input type="file" accept="image/*" onChange={e => setEditCover(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button disabled={editing} onClick={async () => {
                  setEditing(true);
                  try {
                    const form = new FormData();
                    form.append('title', editCourse.title);
                    form.append('description', editCourse.description);
                    if (editCourse.category != null) form.append('category', editCourse.category);
                    if (editCourse.level != null) form.append('level', editCourse.level);
                    if (editCourse.language != null) form.append('language', editCourse.language);
                    if (editCourse.price != null) form.append('price', String(editCourse.price));
                    form.append('isPublished', String(!!editCourse.isPublished));
                    if (editCover) form.append('cover', editCover);
                    const res = await authenticatedFetch(buildApiUrl(`/api/courses/${editCourse._id}`), { 
                      method: 'PUT', 
                      body: form 
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Failed to update');
                    toast({ title: 'Updated', description: 'Course updated' });
                    setEditOpen(false);
                    setEditCourse(null);
                    setEditCover(null);
                    queryClient.invalidateQueries(['/api/courses']);
                  } catch (e) {
                    toast({ title: 'Error', description: e.message, variant: 'destructive' });
                  } finally {
                    setEditing(false);
                  }
                }}>{editing ? 'Saving...' : 'Save'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Create Course Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
            <DialogDescription>Fill in details and optionally upload a cover image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={newCourse.title} onChange={e => setNewCourse(c => ({...c, title: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={newCourse.description} onChange={e => setNewCourse(c => ({...c, description: e.target.value}))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input value={newCourse.category} onChange={e => setNewCourse(c => ({...c, category: e.target.value}))} />
              </div>
              <div>
                <label className="text-sm font-medium">Level</label>
                <Select value={newCourse.level} onValueChange={v => setNewCourse(c => ({...c, level: v}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Language</label>
                <Input value={newCourse.language} onChange={e => setNewCourse(c => ({...c, language: e.target.value}))} />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input type="number" value={newCourse.price} onChange={e => setNewCourse(c => ({...c, price: Number(e.target.value)}))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Cover Image</label>
              <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newCourse.isPublished} onChange={e => setNewCourse(c => ({...c, isPublished: e.target.checked}))} />
                Publish immediately
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button disabled={creating} onClick={async () => {
                if (!newCourse.title || !newCourse.description) {
                  toast({ title: 'Validation', description: 'Title and description are required', variant: 'destructive' });
                  return;
                }
                setCreating(true);
                try {
                  const form = new FormData();
                  form.append('title', newCourse.title);
                  form.append('description', newCourse.description);
                  if (newCourse.category) form.append('category', newCourse.category);
                  if (newCourse.level) form.append('level', newCourse.level);
                  if (newCourse.language) form.append('language', newCourse.language);
                  if (newCourse.price != null) form.append('price', String(newCourse.price));
                  form.append('isPublished', String(newCourse.isPublished));
                  if (coverFile) form.append('cover', coverFile);
                  
                  // Debug: Log what we're sending
                  console.log('=== FRONTEND COURSE CREATION ===');
                  console.log('FormData contents:');
                  for (let [key, value] of form.entries()) {
                    console.log(`${key}:`, value);
                  }
                  console.log('API URL:', buildApiUrl('/api/courses'));
                  console.log('Token:', accessToken ? 'Present' : 'Missing');
                  
                  const res = await authenticatedFetch(buildApiUrl('/api/courses'), { 
                    method: 'POST', 
                    body: form 
                  });
                  
                  // Debug: Log the response
                  console.log('Response status:', res.status);
                  console.log('Response headers:', Object.fromEntries(res.headers.entries()));
                  
                  const data = await res.json();
                  console.log('Response data:', data);
                  
                  if (!res.ok) throw new Error(data.message || 'Failed to create course');
                  toast({ title: 'Created', description: 'Course created successfully' });
                  setCreateOpen(false);
                  setNewCourse({ 
                    title: '', 
                    description: '', 
                    category: '', 
                    level: 'beginner', 
                    language: 'English', 
                    price: 0, 
                    isPublished: false,
                    prerequisites: '',
                    learningOutcomes: '',
                    maxStudents: '',
                    startDate: '',
                    endDate: '',
                    completionCertificate: false
                  });
                  setCoverFile(null);
                  queryClient.invalidateQueries(['/api/courses']);
                } catch (e) {
                  toast({ title: 'Error', description: e.message, variant: 'destructive' });
                } finally {
                  setCreating(false);
                }
              }}>{creating ? 'Creating...' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagement;
