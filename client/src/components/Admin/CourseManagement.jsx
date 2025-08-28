import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Search, Users, UserCheck, Plus, Eye, ListPlus, Video, Edit } from 'lucide-react';

const CourseManagement = () => {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
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
    queryKey: ['/api/courses', { isPublished: 'false', search: searchTerm, category: selectedCategory, level: selectedLevel, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('isPublished', 'false'); // Get all courses, including unpublished
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel && selectedLevel !== 'all') params.append('level', selectedLevel);
      params.append('page', String(page));
      params.append('limit', String(limit));
      
      const response = await fetch(`/api/courses?${params.toString()}`, {
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
    enabled: !!accessToken,
  });

  // Fetch instructors for assignment
  const { data: instructorsData } = useQuery({
    queryKey: ['/api/admin/users', { role: 'instructor' }],
    queryFn: async () => {
      const response = await fetch('/api/admin/users?role=instructor', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch instructors');
      }
      
      return response.json();
    },
    enabled: !!accessToken && assignDialogOpen,
  });

  // Assign instructor mutation
  const assignInstructorMutation = useMutation({
    mutationFn: async ({ courseId, instructorId }) => {
      const response = await fetch(`/api/courses/${courseId}/assign-instructor`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  const courses = coursesData?.courses || [];
  const pagination = coursesData?.pagination || { page, limit, total: courses.length };
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
    const res = await fetch(`/api/courses/${structureCourse._id}/lectures/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to upload');
    return data.url;
  };

  const saveStructure = async () => {
    setSavingStructure(true);
    try {
      const res = await fetch(`/api/courses/${structureCourse._id}/structure`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
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
        
        <Button onClick={() => setCreateOpen(true)} data-testid="button-create-course">
          <Plus className="w-4 h-4 mr-2" />
          Create Course
        </Button>
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
      <Card>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {pagination.page} of {Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || limit)))} • {pagination.total || 0} results</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={pagination.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
          <Button variant="outline" disabled={pagination.page >= Math.ceil((pagination.total || 0) / (pagination.limit || limit))} onClick={() => setPage(p => p + 1)}>Next</Button>
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

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Courses ({courses.length})</CardTitle>
          <CardDescription>
            Manage courses and assign instructors
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course._id} data-testid={`course-row-${course._id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {course.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {course.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level || 'Beginner'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(course.isPublished)}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        {course.enrollmentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(course.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssignDialog(course)}
                          data-testid={`button-assign-instructor-${course._id}`}
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          {course.assignedInstructor ? 'Reassign' : 'Assign'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-view-course-${course._id}`}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditCourse(course); setEditOpen(true); setEditCover(null); }}
                          data-testid={`button-edit-course-${course._id}`}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStructureDialog(course)}
                          data-testid={`button-structure-${course._id}`}
                        >
                          <ListPlus className="w-3 h-3 mr-1" />
                          Structure
                        </Button>
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
                    const res = await fetch(`/api/courses/${editCourse._id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form });
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
                  const res = await fetch('/api/courses', { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` }, body: form });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'Failed to create course');
                  toast({ title: 'Created', description: 'Course created successfully' });
                  setCreateOpen(false);
                  setNewCourse({ title: '', description: '', category: '', level: 'beginner', language: 'English', price: 0, isPublished: false });
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
