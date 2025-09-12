import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { buildApiUrl } from '../../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Eye, 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  Award,
  Clock,
  Target
} from 'lucide-react';

const StudentAnalytics = () => {
  const { accessToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);

  // Fetch student analytics
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/students', { search: searchTerm, courseId: selectedCourse, page, limit }, accessToken],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCourse && selectedCourse !== 'all') params.append('courseId', selectedCourse);
      params.append('page', String(page));
      params.append('limit', String(limit));
      
      const response = await fetch(buildApiUrl(`/api/admin/analytics/students?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch student analytics');
      }
      
      return response.json();
    },
    enabled: !!accessToken,
  });

  // Fetch course options for filter
  const { data: coursesList } = useQuery({
    queryKey: ['/api/courses', 'student-analytics-filter'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '100');
      params.append('isPublished', 'true');
      const res = await fetch(buildApiUrl(`/api/courses?${params.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
    enabled: !!accessToken,
    staleTime: 300000
  });
  const courseOptions = (coursesList?.courses || []).map((c) => ({ id: c._id, title: c.title }));

  const students = studentsData?.students || [];
  const pagination = studentsData?.pagination || { page, limit, total: 0 };

  // Calculate summary statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.analytics?.lastActivity && 
    new Date(s.analytics.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const avgProgress = students.length > 0 
    ? students.reduce((sum, s) => sum + (s.analytics?.avgProgress || 0), 0) / students.length 
    : 0;
  const totalXP = students.reduce((sum, s) => sum + (s.analytics?.totalXP || 0), 0);

  const openStudentDetail = (student) => {
    setSelectedStudent(student);
    setStudentDetailOpen(true);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-yellow-100 text-yellow-700';
      case 'banned': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Student Analytics</h2>
          <p className="text-sm sm:text-base text-gray-600">Comprehensive analysis of student performance and engagement</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active (7 days)</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{activeStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{Math.round(avgProgress)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total XP</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalXP.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courseOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Performance ({students.length})</CardTitle>
          <CardDescription>
            Detailed view of student engagement and progress
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {students.length > 0 && (
            <div className="flex justify-end px-4 sm:px-0 pb-3">
              <Button variant="outline" onClick={() => {
                const rows = students.map(s => ({
                  id: s._id,
                  username: s.username,
                  email: s.email,
                  status: s.status,
                  totalCourses: s.analytics?.totalCourses || 0,
                  completedCourses: s.analytics?.completedCourses || 0,
                  avgProgress: s.analytics?.avgProgress || 0,
                  totalXP: s.analytics?.totalXP || 0,
                  lastActivity: s.analytics?.lastActivity || ''
                }));
                const header = Object.keys(rows[0] || {}).join(',');
                const body = rows.map(r => Object.values(r).map(v => typeof v === 'string' && v.includes(',') ? `"${v.replaceAll('"','""')}"` : v).join(',')).join('\n');
                const csv = header + '\n' + body;
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click(); URL.revokeObjectURL(url);
              }}>Export CSV</Button>
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found matching your criteria</p>
            </div>
          ) : (
            <>
              {/* Mobile List (sm:hidden) */}
              <div className="sm:hidden space-y-3 p-4">
                {students.map((student) => (
                  <div key={student._id} className="border rounded-lg p-3 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {student.profile?.firstName && student.profile?.lastName
                            ? `${student.profile.firstName} ${student.profile.lastName}`
                            : student.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{student.email}</div>
                        <div className="text-xs text-gray-400 truncate">@{student.username}</div>
                      </div>
                      <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Courses:</span>
                        <span className="ml-1 font-medium">{student.analytics?.totalCourses || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">XP:</span>
                        <span className="ml-1 font-medium">{student.analytics?.totalXP || 0}</span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Avg Progress</span>
                          <span className="font-medium">{student.analytics?.avgProgress || 0}%</span>
                        </div>
                        <Progress value={student.analytics?.avgProgress || 0} className="h-2" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-500">{formatDate(student.analytics?.lastActivity)}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openStudentDetail(student)}>
                          <Eye className="w-3 h-3 mr-1" /> Details
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2">
                          <BarChart3 className="w-3 h-3 mr-1" /> Progress
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden on xs) */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Student</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Courses</TableHead>
                      <TableHead className="text-xs sm:text-sm">Avg Progress</TableHead>
                      <TableHead className="text-xs sm:text-sm">Total XP</TableHead>
                      <TableHead className="text-xs sm:text-sm">Last Activity</TableHead>
                      <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-xs sm:text-sm">
                              {student.profile?.firstName && student.profile?.lastName
                                ? `${student.profile.firstName} ${student.profile.lastName}`
                                : student.username
                              }
                            </div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                            <div className="text-xs text-gray-400">@{student.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium text-xs sm:text-sm">{student.analytics?.totalCourses || 0}</div>
                            <div className="text-xs text-gray-500">
                              {student.analytics?.completedCourses || 0} completed
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span>{student.analytics?.avgProgress || 0}%</span>
                            </div>
                            <Progress 
                              value={student.analytics?.avgProgress || 0} 
                              className="h-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Award className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                            <span className="font-medium text-xs sm:text-sm">{student.analytics?.totalXP || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs sm:text-sm">
                            {formatDate(student.analytics?.lastActivity)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStudentDetail(student)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => setLocation(`/admin/students/${student._id}`)}>View</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Progress
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-gray-600">
          Page {pagination.page} of {pagination.pages || 1} • {pagination.total} results
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={pagination.page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={pagination.page >= (pagination.pages || 1)} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
          <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-20 sm:w-24">
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

      {/* Student Detail Dialog */}
      <Dialog open={studentDetailOpen} onOpenChange={setStudentDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details - {selectedStudent?.username}</DialogTitle>
            <DialogDescription>
              Comprehensive view of student profile and performance
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-sm text-gray-900">
                    {selectedStudent.profile?.firstName && selectedStudent.profile?.lastName
                      ? `${selectedStudent.profile.firstName} ${selectedStudent.profile.lastName}`
                      : 'Not provided'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-sm text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <p className="text-sm text-gray-900">@{selectedStudent.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(selectedStudent.status)}>
                    {selectedStudent.status}
                  </Badge>
                </div>
              </div>

              {/* Academic Info */}
              {selectedStudent.studentProfile && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Academic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Year of Study:</span>
                      <span className="ml-2 text-gray-900">{selectedStudent.studentProfile.yearOfStudy || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Degree:</span>
                      <span className="ml-2 text-gray-900">{selectedStudent.studentProfile.degree || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Learning Pace:</span>
                      <span className="ml-2 text-gray-900">{selectedStudent.studentProfile.learningPace || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Career Goal:</span>
                      <span className="ml-2 text-gray-900">{selectedStudent.studentProfile.careerGoal || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Summary */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Performance Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Courses:</span>
                    <span className="ml-2 text-gray-900">{selectedStudent.analytics?.totalCourses || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Completed Courses:</span>
                    <span className="ml-2 text-gray-900">{selectedStudent.analytics?.completedCourses || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Average Progress:</span>
                    <span className="ml-2 text-gray-900">{selectedStudent.analytics?.avgProgress || 0}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total XP:</span>
                    <span className="ml-2 text-gray-900">{selectedStudent.analytics?.totalXP || 0}</span>
                  </div>
                </div>
              </div>

              {/* Recent Enrollments */}
              {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recent Enrollments</h4>
                  <div className="space-y-2">
                    {selectedStudent.enrollments.slice(0, 3).map((enrollment, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{enrollment.courseId?.title || 'Unknown Course'}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{enrollment.progressPct || 0}%</span>
                          <Progress value={enrollment.progressPct || 0} className="w-16 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAnalytics; 
