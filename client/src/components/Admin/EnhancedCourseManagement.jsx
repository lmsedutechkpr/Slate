import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { buildApiUrl, getImageUrl } from '../../lib/utils.js';
import { useAuthRefresh } from '../../hooks/useAuthRefresh.js';
import { useRealtimeInvalidate } from '../../lib/useRealtimeInvalidate.js';
import { 
  BookOpen, Search, Users, UserCheck, Plus, Eye, Edit, 
  Archive, Play, Filter, CheckCircle, Trash2, MoreHorizontal, Upload, ListPlus, RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

const EnhancedCourseManagement = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { authLoading } = useAuthRefresh();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch courses from API
  const { data: courseList, isLoading, isFetching } = useQuery({
    queryKey: ['/api/admin/courses', { searchTerm, selectedCategory, selectedLevel, selectedStatus, page, limit, sortBy, sortDir }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      // Ensure we do not send implicit isPublished which could hide archived
      // For admin, show all by default; status filter applied server-side
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      const res = await authenticatedFetch(buildApiUrl(`/api/courses?${params.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
    enabled: !!accessToken && !authLoading,
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  const courses = courseList?.courses || [];
  const pagination = courseList?.pagination || { page, limit, total: courses.length };

  // Real-time updates
  useRealtimeInvalidate(
    ['/api/admin/courses', '/api/courses'], 
    ['courses:update', 'courses:create', 'courses:delete', 'courses:publish', 'courses:archive']
  );

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

  // Handle bulk selection
  useEffect(() => {
    if (selectAll) {
      setSelectedCourses(courses.map(c => c._id));
    } else {
      setSelectedCourses([]);
    }
  }, [selectAll, courses]);

  const invalidateCourses = () => queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });

  const bulkPublishMutation = useMutation({
    mutationFn: async (courseIds) => {
      const res = await authenticatedFetch(buildApiUrl('/api/admin/courses/bulk/publish'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: courseIds })
      });
      if (!res.ok) throw new Error('Failed to publish courses');
      return res.json();
    },
    onSuccess: async () => {
      toast({ title: 'Success', description: 'Selected courses published successfully' });
      setSelectedCourses([]); setSelectAll(false);
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/courses'] });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to publish courses', variant: 'destructive' })
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (courseIds) => {
      const res = await authenticatedFetch(buildApiUrl('/api/admin/courses/bulk/archive'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: courseIds })
      });
      if (!res.ok) throw new Error('Failed to archive courses');
      return res.json();
    },
    onSuccess: async () => {
      toast({ title: 'Success', description: 'Selected courses archived successfully' });
      setSelectedCourses([]); setSelectAll(false);
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/courses'] });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to archive courses', variant: 'destructive' })
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId) => {
      console.log(`Frontend: Deleting course ${courseId}`);
      const res = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId}`), {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to delete course:', errorData);
        throw new Error(errorData.message || 'Failed to delete course');
      }
      const result = await res.json();
      console.log('Course deletion result:', result);
      return result;
    },
    onSuccess: () => { 
      console.log('Course deleted successfully, invalidating queries');
      toast({ title: 'Deleted', description: 'Course removed successfully' }); 
      invalidateCourses(); 
    },
    onError: (error) => {
      console.error('Course deletion error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete course', variant: 'destructive' });
    }
  });

  const confirmAndDelete = (course) => {
    const token = course.title ? course.title.slice(0, 6) : course._id?.slice(-6);
    const input = window.prompt(`Type the first 6 chars of the course title to confirm delete: \n${token}`);
    if (!input || input !== token) return;
    deleteCourseMutation.mutate(course._id);
  };

  // Create/Update Dialog state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'programming',
    level: 'beginner',
    price: 0,
    isPublished: true
  });
  const [coverFile, setCoverFile] = useState(null);

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ title: '', description: '', category: 'programming', level: 'beginner', price: 0, isPublished: true });
    setEditorOpen(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'programming',
      level: course.level || 'beginner',
      price: course.price || 0,
      isPublished: course.isPublished !== false
    });
    setEditorOpen(true);
  };

  const createCourseMutation = useMutation({
    mutationFn: async (payload) => {
      let body; let headers = {};
      if (coverFile) {
        body = new FormData();
        Object.entries(payload).forEach(([k,v]) => body.append(k, v));
        body.append('cover', coverFile);
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(payload);
      }
      const res = await authenticatedFetch(buildApiUrl('/api/courses'), { method: 'POST', headers, body });
      if (!res.ok) throw new Error('Failed to create course');
      return res.json();
    },
    onSuccess: () => { toast({ title: 'Created', description: 'Course created successfully' }); setEditorOpen(false); invalidateCourses(); },
    onError: () => toast({ title: 'Error', description: 'Failed to create course', variant: 'destructive' })
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      let body; let headers = {};
      if (coverFile) {
        body = new FormData();
        Object.entries(payload).forEach(([k,v]) => body.append(k, v));
        body.append('cover', coverFile);
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(payload);
      }
      const res = await authenticatedFetch(buildApiUrl(`/api/courses/${id}`), { method: 'PUT', headers, body });
      if (!res.ok) throw new Error('Failed to update course');
      return res.json();
    },
    onSuccess: () => { toast({ title: 'Updated', description: 'Course updated successfully' }); setEditorOpen(false); invalidateCourses(); },
    onError: () => toast({ title: 'Error', description: 'Failed to update course', variant: 'destructive' })
  });

  const submitForm = () => {
    const payload = { ...form };
    if (!payload.title || !payload.description) {
      toast({ title: 'Missing info', description: 'Title and description are required', variant: 'destructive' });
      return;
    }
    if (editingCourse) updateCourseMutation.mutate({ id: editingCourse._id, payload });
    else createCourseMutation.mutate(payload);
  };

  // Structure editor
  const [structureOpen, setStructureOpen] = useState(false);
  const [structure, setStructure] = useState([]);

  const openStructure = (course) => {
    setEditingCourse(course);
    setStructure(course.sections || []);
    setStructureOpen(true);
  };

  const updateStructureMutation = useMutation({
    mutationFn: async ({ id, sections }) => {
      const res = await authenticatedFetch(buildApiUrl(`/api/courses/${id}/structure`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      });
      if (!res.ok) throw new Error('Failed to update structure');
      return res.json();
    },
    onSuccess: () => { toast({ title: 'Updated', description: 'Course structure saved' }); setStructureOpen(false); invalidateCourses(); },
    onError: () => toast({ title: 'Error', description: 'Failed to update structure', variant: 'destructive' })
  });

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'review': return 'bg-blue-100 text-blue-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleBulkAction = (action) => {
    if (selectedCourses.length === 0) {
      toast({ title: 'Warning', description: 'Please select courses first', variant: 'destructive' });
      return;
    }
    if (action === 'publish') bulkPublishMutation.mutate(selectedCourses);
    if (action === 'archive') bulkArchiveMutation.mutate(selectedCourses);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatPrice = (price) => `₹${price}`;

  const totalPages = Math.ceil((pagination.total || 0) / (pagination.limit || limit));

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="programming">Programming</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="data-science">Data Science</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedLevel('all'); setSelectedStatus('all'); }}>
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedCourses.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleBulkAction('publish')} disabled={bulkPublishMutation.isPending}>
                  <Play className="w-4 h-4 mr-1" /> Publish All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')} disabled={bulkArchiveMutation.isPending}>
                  <Archive className="w-4 h-4 mr-1" /> Archive All
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedCourses([])}>Clear Selection</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Courses ({pagination.total || courses.length})</CardTitle>
              <CardDescription>Manage courses with advanced filtering and bulk operations</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] })}
                title="Refresh data"
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No courses found</p>
            </div>
          ) : (
            <Table className="w-full border-collapse border border-gray-200 rounded-xl overflow-hidden shadow-lg">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                  <TableHead className="w-16 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200">
                      <Checkbox checked={selectAll} onCheckedChange={setSelectAll} />
                  </TableHead>
                  <TableHead className="w-20 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200">Thumbnail</TableHead>
                  <TableHead 
                    className="w-64 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 cursor-pointer"
                      onClick={() => { setSortBy('title'); setSortDir(d => (sortBy==='title' && d==='asc') ? 'desc' : 'asc'); }}
                    >
                      Course {sortBy==='title' ? (sortDir==='asc' ? '↑' : '↓') : ''}
                  </TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200">Instructor</TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200">Level</TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200">Status</TableHead>
                  <TableHead 
                    className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 cursor-pointer"
                      onClick={() => { setSortBy('price'); setSortDir(d => (sortBy==='price' && d==='asc') ? 'desc' : 'asc'); }}
                    >
                      Price {sortBy==='price' ? (sortDir==='asc' ? '↑' : '↓') : ''}
                  </TableHead>
                  <TableHead 
                    className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 cursor-pointer"
                      onClick={() => { setSortBy('enrollmentCount'); setSortDir(d => (sortBy==='enrollmentCount' && d==='asc') ? 'desc' : 'asc'); }}
                    >
                      Enrollments {sortBy==='enrollmentCount' ? (sortDir==='asc' ? '↑' : '↓') : ''}
                  </TableHead>
                  <TableHead className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200">Rating</TableHead>
                  <TableHead 
                    className="w-32 px-4 py-3 text-left font-bold text-gray-800 border-r border-gray-200 cursor-pointer"
                      onClick={() => { setSortBy('createdAt'); setSortDir(d => (sortBy==='createdAt' && d==='asc') ? 'desc' : 'asc'); }}
                    >
                      Created {sortBy==='createdAt' ? (sortDir==='asc' ? '↑' : '↓') : ''}
                  </TableHead>
                  <TableHead className="w-48 px-4 py-3 text-left font-bold text-gray-800">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {courses.map((course) => (
                  <TableRow key={course._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                        <Checkbox
                          checked={selectedCourses.includes(course._id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedCourses(prev => [...prev, course._id]);
                            else setSelectedCourses(prev => prev.filter(id => id !== course._id));
                          }}
                        />
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200 shadow-md">
                        {(course.coverUrl || course.cover) ? (
                          <img 
                            src={getImageUrl(course.coverUrl || course.cover, buildApiUrl(''))} 
                            alt={course.title}
                            className="w-full h-full object-cover"
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
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                      <div className="w-64">
                        <div className="font-bold text-gray-900 truncate text-lg mb-2">{course.title}</div>
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
                        <div className="text-xs text-blue-700 font-bold mt-2 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1.5 rounded-full inline-block border border-blue-200 shadow-md">
                          {course.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200">
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
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                      <Badge className={`${getLevelColor(course.level)} px-3 py-1.5 font-semibold shadow-sm`}>
                        {course.level || 'Beginner'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                      <Badge className={`${getStatusColor(course.status || 'draft')} px-3 py-1.5 font-semibold shadow-sm`}>
                        {course.status || 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                        <div className="font-medium">{formatPrice(course.price)}</div>
                      <div className="text-xs text-gray-500">{course.duration}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        {course.enrollmentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                        <span className="text-sm">{(course.rating?.average ?? course.rating ?? 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 border-r border-gray-200">
                      {formatDate(course.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                        <div className="flex flex-col sm:flex-row gap-1 lg:gap-2">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setLocation(`/admin/courses/${course._id}`)}><Eye className="w-3 h-3" /></Button>
                          <Button size="sm" variant="outline" className="h-8 p-2" onClick={() => openEdit(course)}><Edit className="w-3 h-3 mr-1" /><span className="hidden sm:inline">Edit</span></Button>
                          <Button size="sm" variant="outline" className="h-8 p-2" onClick={() => openStructure(course)}>Structure</Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => confirmAndDelete(course)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                    </TableCell>
                  </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">Page {pagination.page || page} of {totalPages || 1} • {pagination.total || courses.length} results</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={(pagination.page || page) <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
          <Button variant="outline" disabled={(pagination.page || page) >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-24">
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

      {/* Editors */}
      <CourseEditor
        open={editorOpen}
        onOpenChange={(v)=> { setEditorOpen(v); if (!v) setCoverFile(null);} }
        form={form}
        setForm={setForm}
        onSubmit={submitForm}
        saving={createCourseMutation.isPending || updateCourseMutation.isPending}
        coverFile={coverFile}
        setCoverFile={setCoverFile}
      />
      <StructureEditor
        open={structureOpen}
        onOpenChange={setStructureOpen}
        structure={structure}
        setStructure={setStructure}
        onSave={() => updateStructureMutation.mutate({ id: editingCourse._id, sections: structure })}
        courseId={editingCourse?._id}
        saving={updateStructureMutation.isPending}
      />
    </div>
  );
};

export default EnhancedCourseManagement;

// Editor Dialog UI (mounted within component tree)
// Placed at end of file to keep the main component readable
function CourseEditor({ open, onOpenChange, form, setForm, onSubmit, saving, coverFile, setCoverFile }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form?.id ? 'Edit Course' : 'Create Course'}</DialogTitle>
          <DialogDescription>
            {form?.id ? 'Update course information and settings' : 'Create a new course with basic information'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm(v => ({ ...v, title: e.target.value }))} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm(v => ({ ...v, description: e.target.value }))} />
          </div>
          <div>
            <Label>Cover Image</Label>
            <input type="file" accept="image/*" onChange={(e)=> setCoverFile(e.target.files?.[0] || null)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(val) => setForm(v => ({ ...v, category: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="programming">Programming</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="data-science">Data Science</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(val) => setForm(v => ({ ...v, level: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm(v => ({ ...v, price: Number(e.target.value) }))} />
            </div>
            <div className="flex items-end gap-2">
              <Checkbox id="published" checked={!!form.isPublished} onCheckedChange={(v) => setForm(s => ({ ...s, isPublished: !!v }))} />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StructureEditor({ open, onOpenChange, structure, setStructure, onSave, saving, courseId }) {
  const addSection = () => setStructure(prev => [...prev, { title: 'New Section', order: prev.length, lectures: [] }]);
  const addLecture = (sIdx) => setStructure(prev => prev.map((s, i) => i === sIdx ? { ...s, lectures: [...s.lectures, { title: 'New Lecture', order: s.lectures.length }] } : s));

  const updateLecture = (sectionIdx, lectureIdx, patch) => {
    setStructure(prev => prev.map((s, i) => {
      if (i !== sectionIdx) return s;
      return {
        ...s,
        lectures: s.lectures.map((l, j) => (j === lectureIdx ? { ...l, ...patch } : l))
      };
    }));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Course Structure</DialogTitle>
          <DialogDescription>
            Manage course sections and lectures. Add, edit, or remove content structure.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button variant="outline" onClick={addSection}>Add Section</Button>
          <div className="space-y-3">
            {structure.map((sec, sIdx) => (
              <div key={sIdx} className="border rounded p-3">
                <div className="flex items-center gap-2">
                  <Input value={sec.title} onChange={(e) => setStructure(prev => prev.map((s, i) => (i===sIdx ? { ...s, title: e.target.value } : s)))} />
                  <Button size="sm" variant="outline" onClick={() => addLecture(sIdx)}>Add Lecture</Button>
                </div>
                <div className="mt-2 space-y-2">
                  {sec.lectures?.map((lec, lIdx) => (
                    <div key={lIdx} className="flex items-center gap-2">
                      <Input value={lec.title} onChange={(e) => updateLecture(sIdx, lIdx, { title: e.target.value })} />
                      <Input placeholder="YouTube ID / Video URL" value={lec.youtubeId || lec.videoUrl || ''} onChange={(e) => updateLecture(sIdx, lIdx, { youtubeId: e.target.value, videoUrl: '' })} />
                      <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <input type="file" accept="video/*" className="hidden" onChange={async (e)=> {
                          const file = e.target.files?.[0]; if (!file) return;
                          const form = new FormData(); form.append('video', file);
                          try {
                            const res = await authenticatedFetch(buildApiUrl(`/api/courses/${courseId || ''}/lectures/upload`), { method:'POST', body: form });
                            const data = await res.json();
                            if (res.ok && data.url) updateLecture(sIdx, lIdx, { videoUrl: data.url, youtubeId: '' });
                          } catch {}
                        }} />
                        Upload
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Structure'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
