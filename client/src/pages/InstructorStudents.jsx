import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users, GraduationCap, Clock, TrendingUp, UserCheck, Calendar, Award, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';

const InstructorStudents = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    date: '',
    status: 'present',
    notes: ''
  });
  
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['instructor-students', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/students'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { students: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
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
        body: JSON.stringify({
          studentId: selectedStudent?._id,
          courseId: selectedStudent?.courseId,
          date: data.date,
          status: data.status,
          notes: data.notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark attendance');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance Marked",
        description: "Student attendance has been recorded successfully.",
      });
      queryClient.invalidateQueries(['instructor-students']);
      setIsAttendanceDialogOpen(false);
      setAttendanceData({ date: '', status: 'present', notes: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleMarkAttendance = (student) => {
    setSelectedStudent(student);
    setAttendanceData({
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      notes: ''
    });
    setIsAttendanceDialogOpen(true);
  };

  const handleSubmitAttendance = (e) => {
    e.preventDefault();
    markAttendanceMutation.mutate(attendanceData);
  };

  if (isLoading) return <LoadingSpinner />;

  const students = studentsData?.students || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Tracking</h1>
          <p className="text-gray-600">Monitor student progress, attendance, and performance</p>
        </div>
        <Button onClick={() => setIsAttendanceDialogOpen(true)}>
          <UserCheck className="w-4 h-4 mr-2" />
          Mark Attendance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{students?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-2xl font-bold">
                  {students?.filter(student => student.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">New This Week</p>
                <p className="text-2xl font-bold">
                  {students?.filter(student => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(student.enrolledAt) > weekAgo;
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold">
                  {students?.length > 0 
                    ? Math.round(students.reduce((total, student) => total + (student.attendanceRate || 0), 0) / students.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      {students?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
            <p className="text-gray-600 mb-6">
              Students will appear here once they enroll in your courses
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students?.map((student) => (
            <Card key={student._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {student.profile?.firstName} {student.profile?.lastName}
                  </CardTitle>
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                    {student.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{student.email}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{student.enrolledCourses?.length || 0} courses</span>
                    <span>{student.progress || 0}% progress</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Attendance: {student.attendanceRate || 0}%</span>
                    <span>Last seen: {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleMarkAttendance(student)}
                    className="flex-1"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Mark Attendance
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Attendance Dialog */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Record attendance for {selectedStudent?.profile?.firstName} {selectedStudent?.profile?.lastName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAttendance} className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={attendanceData.date}
                onChange={(e) => setAttendanceData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={attendanceData.status}
                onChange={(e) => setAttendanceData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={attendanceData.notes}
                onChange={(e) => setAttendanceData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={markAttendanceMutation.isPending}>
                {markAttendanceMutation.isPending ? 'Recording...' : 'Record Attendance'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorStudents;
