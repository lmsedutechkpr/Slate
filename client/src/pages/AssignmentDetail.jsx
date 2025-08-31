import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LoadingSpinner from '../components/Common/LoadingSpinner.jsx';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  Download, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Clock as ClockIcon,
  Star,
  User,
  BookOpen
} from 'lucide-react';

const AssignmentDetail = () => {
  const { user, accessToken, authenticatedFetch } = useAuth();
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [extensionReason, setExtensionReason] = useState('');
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  
  // Get assignment ID from URL
  const assignmentId = window.location.pathname.split('/').pop();
  
  const queryClient = useQueryClient();

  // Fetch assignment details
  const { data: assignmentData, isLoading: assignmentLoading } = useQuery({
    queryKey: ['/api/assignments', assignmentId, accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/assignments/${assignmentId}`));
      if (!response.ok) throw new Error('Failed to fetch assignment');
      return response.json();
    },
    enabled: !!accessToken && !!assignmentId,
  });

  // Fetch submission status
  const { data: submissionData } = useQuery({
    queryKey: ['/api/assignments', assignmentId, 'submission', accessToken],
    queryFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/assignments/${assignmentId}/submission`));
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!accessToken && !!assignmentId,
  });

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('text', submissionText);
      submissionFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await authenticatedFetch(buildApiUrl(`/api/assignments/${assignmentId}/submit`), {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to submit assignment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/assignments', assignmentId, 'submission']);
      setSubmissionText('');
      setSubmissionFiles([]);
    },
  });

  // Request extension mutation
  const extensionMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(buildApiUrl(`/api/assignments/${assignmentId}/extension`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: extensionReason }),
      });
      if (!response.ok) throw new Error('Failed to request extension');
      return response.json();
    },
    onSuccess: () => {
      setShowExtensionDialog(false);
      setExtensionReason('');
      queryClient.invalidateQueries(['/api/assignments', assignmentId]);
    },
  });

  const assignment = assignmentData?.assignment;
  const submission = submissionData?.submission;

  if (assignmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>Assignment not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatDueDate = (dueAt) => {
    const due = new Date(dueAt);
    const now = new Date();
    const diffInHours = (due - now) / (1000 * 60 * 60);
    const diffInDays = Math.ceil(diffInHours / 24);
    
    if (diffInHours < 0) {
      return 'Overdue';
    } else if (diffInDays === 0) {
      return 'Due today';
    } else if (diffInDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffInDays} days`;
    }
  };

  const getStatusInfo = () => {
    const { submissionStatus, dueAt } = assignment;
    const now = new Date();
    const due = new Date(dueAt);
    const isOverdue = now > due && submissionStatus === 'pending';
    
    switch (submissionStatus) {
      case 'submitted':
        return {
          label: 'Submitted',
          color: 'bg-blue-100 text-blue-700',
          icon: CheckCircle,
          textColor: 'text-blue-600'
        };
      case 'graded':
        return {
          label: 'Graded',
          color: 'bg-green-100 text-green-700',
          icon: CheckCircle,
          textColor: 'text-green-600'
        };
      case 'overdue':
      default:
        if (isOverdue) {
          return {
            label: 'Overdue',
            color: 'bg-red-100 text-red-700',
            icon: XCircle,
            textColor: 'text-red-600'
          };
        }
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-700',
          icon: AlertCircle,
          textColor: 'text-yellow-600'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSubmissionFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSubmissionFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Assignment Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-gray-600 mb-4">{assignment.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                {assignment.course?.title || 'Course'}
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {assignment.instructor?.profile?.firstName} {assignment.instructor?.profile?.lastName}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(assignment.dueAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDueDate(assignment.dueAt)}
              </div>
            </div>
          </div>
          <Badge className={statusInfo.color}>
            <statusInfo.icon className="w-4 h-4 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Assignment Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-primary-600">{assignment.points || 0}</div>
            <div className="text-sm text-gray-600">Points</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {submission?.grade || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Grade</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {submission ? 'Submitted' : 'Not Submitted'}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {assignment.allowLateSubmission ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Late Allowed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assignment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
              </div>
              
              {assignment.attachments?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Attachments</h4>
                  <div className="space-y-2">
                    {assignment.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{attachment.name}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission Form */}
          {!submission && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Assignment</CardTitle>
                <CardDescription>
                  Submit your work before the due date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="submission-text">Written Response</Label>
                  <Textarea
                    id="submission-text"
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Write your response here..."
                    rows={6}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="submission-files">Attachments</Label>
                  <div className="mt-1">
                    <Input
                      id="submission-files"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {submissionFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {submissionFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isLoading || (!submissionText && submissionFiles.length === 0)}
                  >
                    {submitMutation.isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Assignment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submitted Work */}
          {submission && (
            <Card>
              <CardHeader>
                <CardTitle>Your Submission</CardTitle>
                <CardDescription>
                  Submitted on {new Date(submission.submittedAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.text && (
                  <div>
                    <Label className="text-sm font-medium">Written Response</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded">
                      <p className="text-gray-700 whitespace-pre-wrap">{submission.text}</p>
                    </div>
                  </div>
                )}

                {submission.files?.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Attachments</Label>
                    <div className="mt-1 space-y-1">
                      {submission.files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {submission.grade && (
                  <div>
                    <Label className="text-sm font-medium">Grade</Label>
                    <div className="mt-1 p-3 bg-green-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">{submission.grade}</span>
                      </div>
                      {submission.feedback && (
                        <p className="text-sm text-green-600 mt-2">{submission.feedback}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Course</Label>
                  <p className="text-sm text-gray-600">{assignment.course?.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Instructor</Label>
                  <p className="text-sm text-gray-600">
                    {assignment.instructor?.profile?.firstName} {assignment.instructor?.profile?.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(assignment.dueAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Points</Label>
                  <p className="text-sm text-gray-600">{assignment.points || 0} points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!submission && (
                <Dialog open={showExtensionDialog} onOpenChange={setShowExtensionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Request Extension
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Extension</DialogTitle>
                      <DialogDescription>
                        Explain why you need an extension for this assignment.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="extension-reason">Reason</Label>
                        <Textarea
                          id="extension-reason"
                          value={extensionReason}
                          onChange={(e) => setExtensionReason(e.target.value)}
                          placeholder="Please explain your reason for requesting an extension..."
                          rows={4}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => extensionMutation.mutate()}
                          disabled={extensionMutation.isLoading || !extensionReason.trim()}
                          className="flex-1"
                        >
                          {extensionMutation.isLoading ? 'Requesting...' : 'Submit Request'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowExtensionDialog(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Instructor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;

