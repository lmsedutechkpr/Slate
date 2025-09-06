import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Download,
  Upload,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Target,
  Activity,
  Eye,
  Edit,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';

const AttendanceTracker = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMarkAttendanceDialogOpen, setIsMarkAttendanceDialogOpen] = useState(false);
  const [localAttendanceData, setLocalAttendanceData] = useState({});
  const [bulkAction, setBulkAction] = useState('');

  // Fetch courses
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

  // Fetch students for selected course
  const { data: studentsData } = useQuery({
    queryKey: ['course-students', selectedCourse, accessToken],
    queryFn: async () => {
      if (!selectedCourse) return { students: [] };
      const res = await fetch(buildApiUrl(`/api/instructor/courses/${selectedCourse}/students`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { students: [] };
      return res.json();
    },
    enabled: !!accessToken && !!selectedCourse,
    refetchInterval: 15000
  });

  // Fetch attendance records
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-records', selectedCourse, selectedDate, accessToken],
    queryFn: async () => {
      if (!selectedCourse) return { records: [], summary: {} };
      const res = await fetch(buildApiUrl(`/api/instructor/attendance?courseId=${selectedCourse}&date=${selectedDate}`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { records: [], summary: {} };
      return res.json();
    },
    enabled: !!accessToken && !!selectedCourse,
    refetchInterval: 10000
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(buildApiUrl('/api/instructor/attendance'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to mark attendance');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance Marked",
        description: "Attendance has been recorded successfully.",
      });
      queryClient.invalidateQueries(['attendance-records']);
      setIsMarkAttendanceDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, status, notes }) => {
      const response = await fetch(buildApiUrl(`/api/instructor/attendance/${studentId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status, notes, date: selectedDate, courseId: selectedCourse })
      });

      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance Updated",
        description: "Attendance record has been updated successfully.",
      });
      queryClient.invalidateQueries(['attendance-records']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleMarkAttendance = () => {
    const attendanceRecords = Object.entries(localAttendanceData).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      notes: data.notes || '',
      date: selectedDate,
      courseId: selectedCourse
    }));

    markAttendanceMutation.mutate({ records: attendanceRecords });
  };

  const handleAttendanceChange = (studentId, status) => {
    setLocalAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setLocalAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleBulkAction = (action) => {
    const studentIds = studentsData?.students?.map(s => s._id) || [];
    
    if (action === 'mark-all-present') {
      const newData = {};
      studentIds.forEach(id => {
        newData[id] = { status: 'present', notes: '' };
      });
      setLocalAttendanceData(newData);
    } else if (action === 'mark-all-absent') {
      const newData = {};
      studentIds.forEach(id => {
        newData[id] = { status: 'absent', notes: '' };
      });
      setLocalAttendanceData(newData);
    } else if (action === 'clear-all') {
      setLocalAttendanceData({});
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceRate = () => {
    const records = localAttendanceData || {};
    const total = Object.keys(records).length;
    if (total === 0) return 0;
    const present = Object.values(records).filter(r => r.status === 'present').length;
    return Math.round((present / total) * 100);
  };

  const filteredStudents = () => {
    let students = studentsData?.students || [];
    
    if (searchQuery) {
      students = students.filter(student => 
        student.profile?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.profile?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      students = students.filter(student => {
        const status = localAttendanceData[student._id]?.status || 'unmarked';
        return status === filterStatus;
      });
    }
    
    return students;
  };

  const courses = coursesData?.courses || [];
  const students = filteredStudents();
  const records = attendanceData?.records || [];
  const summary = attendanceData?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-gray-600">Track and manage student attendance</p>
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
          <Button 
            onClick={() => setIsMarkAttendanceDialogOpen(true)}
            disabled={!selectedCourse}
          >
            <Plus className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
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
                    <p className="text-sm font-medium text-gray-600">Present Today</p>
                    <p className="text-2xl font-bold text-green-600">{summary.present || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent Today</p>
                    <p className="text-2xl font-bold text-red-600">{summary.absent || 0}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.rate || 0}%</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="unmarked">Unmarked</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('mark-all-present')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                All Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('mark-all-absent')}
              >
                <XCircle className="w-4 h-4 mr-1" />
                All Absent
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('clear-all')}
              >
                <Minus className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance for {selectedDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((student) => {
                  const currentStatus = localAttendanceData[student._id]?.status || 'unmarked';
                  const notes = localAttendanceData[student._id]?.notes || '';
                  
                  return (
                    <div key={student._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {student.profile?.firstName?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {student.profile?.firstName} {student.profile?.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={currentStatus === 'present' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student._id, 'present')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === 'absent' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student._id, 'absent')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === 'late' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student._id, 'late')}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Late
                          </Button>
                        </div>
                        
                        <div className="w-32">
                          <Input
                            placeholder="Notes..."
                            value={notes}
                            onChange={(e) => handleNotesChange(student._id, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        
                        <Badge className={getStatusColor(currentStatus)}>
                          {getStatusIcon(currentStatus)}
                          <span className="ml-1 capitalize">{currentStatus}</span>
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
            <p className="text-gray-600">Choose a course to track attendance</p>
          </CardContent>
        </Card>
      )}

      {/* Mark Attendance Dialog */}
      <Dialog open={isMarkAttendanceDialogOpen} onOpenChange={setIsMarkAttendanceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Record attendance for {selectedDate}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {students.map((student) => {
                const currentStatus = localAttendanceData[student._id]?.status || 'unmarked';
                const notes = localAttendanceData[student._id]?.notes || '';
                
                return (
                  <div key={student._id} className="flex items-center justify-between p-3 border rounded">
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
                    
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={currentStatus === 'present' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student._id, 'present')}
                          className="text-xs px-2 py-1"
                        >
                          P
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'absent' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student._id, 'absent')}
                          className="text-xs px-2 py-1"
                        >
                          A
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'late' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student._id, 'late')}
                          className="text-xs px-2 py-1"
                        >
                          L
                        </Button>
                      </div>
                      <Input
                        placeholder="Notes"
                        value={notes}
                        onChange={(e) => handleNotesChange(student._id, e.target.value)}
                        className="w-20 text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Attendance Rate: {getAttendanceRate()}%
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsMarkAttendanceDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleMarkAttendance}
                  disabled={markAttendanceMutation.isPending}
                >
                  {markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceTracker;
