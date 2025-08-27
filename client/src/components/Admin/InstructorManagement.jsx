import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, BookOpen } from 'lucide-react';

const InstructorManagement = () => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    username: '', email: '', password: '', firstName: '', lastName: '', googleEmail: ''
  });
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(searchTerm), 400);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch instructors
  const { data: instructorsData, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { role: 'instructor', search: debounced, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('role', 'instructor');
      if (debounced) params.append('search', debounced);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to fetch instructors');
      return res.json();
    },
    enabled: !!accessToken,
    keepPreviousData: true,
  });

  const instructors = instructorsData?.users || [];
  const pagination = instructorsData?.pagination || { page, limit, total: instructors.length };

  // Fetch courses for selected instructor (on demand)
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['/api/courses', { instructorId: selectedInstructor?._id }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('instructorId', selectedInstructor._id);
      params.append('isPublished', 'false');
      params.append('page', '1');
      params.append('limit', '100');
      const res = await fetch(`/api/courses?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
    enabled: !!accessToken && !!selectedInstructor && coursesOpen,
  });

  const courses = coursesData?.courses || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Instructor Management</h2>
          <p className="text-gray-600">Browse and inspect instructors and their courses</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-instructor">Create Instructor</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Instructor</DialogTitle>
              <DialogDescription>Add a new instructor to the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="First name" value={newInstructor.firstName} onChange={e => setNewInstructor(p => ({...p, firstName: e.target.value}))} />
                <Input placeholder="Last name" value={newInstructor.lastName} onChange={e => setNewInstructor(p => ({...p, lastName: e.target.value}))} />
              </div>
              <Input placeholder="Username" value={newInstructor.username} onChange={e => setNewInstructor(p => ({...p, username: e.target.value}))} />
              <Input placeholder="Email" type="email" value={newInstructor.email} onChange={e => setNewInstructor(p => ({...p, email: e.target.value}))} />
              <Input placeholder="Temporary password" type="password" value={newInstructor.password} onChange={e => setNewInstructor(p => ({...p, password: e.target.value}))} />
              <Input placeholder="Google email (optional)" type="email" value={newInstructor.googleEmail} onChange={e => setNewInstructor(p => ({...p, googleEmail: e.target.value}))} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button disabled={creating} onClick={async () => {
                  if (!newInstructor.username || !newInstructor.email || !newInstructor.password) return;
                  setCreating(true);
                  try {
                    const res = await fetch('/api/admin/instructors', {
                      method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify(newInstructor)
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Failed to create instructor');
                    setCreateOpen(false);
                    setNewInstructor({ username: '', email: '', password: '', firstName: '', lastName: '', googleEmail: '' });
                  } catch (e) {
                    // Optionally display toast if available in this scope
                    console.error(e);
                  } finally { setCreating(false); }
                }}>{creating ? 'Creating...' : 'Create'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-instructors"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructors ({instructors.length})</CardTitle>
          <CardDescription>Manage instructor accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : instructors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No instructors found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((instructor) => (
                  <TableRow key={instructor._id}>
                    <TableCell>
                      <div className="font-medium">{instructor.username}</div>
                      <div className="text-xs text-gray-500">
                        {instructor.profile?.firstName} {instructor.profile?.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{instructor.email}</TableCell>
                    <TableCell>{new Date(instructor.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedInstructor(instructor); setCoursesOpen(true); }}>
                        <BookOpen className="w-3 h-3 mr-1" /> Courses
                      </Button>
                      <Button size="sm" className="ml-2" variant="outline" onClick={async () => {
                        setSelectedInstructor(instructor);
                        setAssignOpen(true);
                        setAssignLoading(true);
                        try {
                          const params = new URLSearchParams();
                          params.append('isPublished', 'false');
                          params.append('page', '1');
                          params.append('limit', '100');
                          const res = await fetch(`/api/courses?${params.toString()}`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
                          const data = await res.json();
                          const all = (data.courses || []);
                          setAvailableCourses(all.filter(c => !c.assignedInstructor));
                        } catch { setAvailableCourses([]); }
                        finally { setAssignLoading(false); }
                      }}>
                        Assign Course
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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

      {/* Instructor Courses Dialog */}
      <Dialog open={coursesOpen} onOpenChange={setCoursesOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Courses - {selectedInstructor?.username}</DialogTitle>
            <DialogDescription>Courses assigned to this instructor</DialogDescription>
          </DialogHeader>
          {!selectedInstructor ? null : loadingCourses ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No courses found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.title}</TableCell>
                    <TableCell className="capitalize">{c.level}</TableCell>
                    <TableCell>{c.isPublished ? 'Published' : 'Draft'}</TableCell>
                    <TableCell>{c.enrollmentCount || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Course Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Course - {selectedInstructor?.username}</DialogTitle>
            <DialogDescription>Select a draft/unassigned course to assign.</DialogDescription>
          </DialogHeader>
          {assignLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
                <Button disabled={!selectedCourseId} onClick={async () => {
                  try {
                    const res = await fetch(`/api/courses/${selectedCourseId}/assign-instructor`, {
                      method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ instructorId: selectedInstructor._id })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Failed to assign');
                    setAssignOpen(false); setSelectedCourseId(''); setAvailableCourses([]);
                  } catch (e) { console.error(e); }
                }}>Assign</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorManagement;


