import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  MessageSquare, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  User,
  Calendar,
  Award,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Edit3
} from 'lucide-react';

const GradingInterface = ({ assignment, onClose }) => {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingData, setGradingData] = useState({
    grade: 0,
    feedback: '',
    rubricScores: {},
    attachments: [],
    isGraded: false
  });
  const [rubric, setRubric] = useState([
    { id: 'content', name: 'Content Quality', maxScore: 40, description: 'Relevance, depth, and accuracy of content' },
    { id: 'structure', name: 'Structure & Organization', maxScore: 30, description: 'Logical flow and clear organization' },
    { id: 'creativity', name: 'Creativity & Originality', maxScore: 20, description: 'Original thinking and creative approach' },
    { id: 'presentation', name: 'Presentation', maxScore: 10, description: 'Clarity, formatting, and professional appearance' }
  ]);

  // Grade submission mutation
  const gradeSubmissionMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(buildApiUrl(`/api/assignments/${assignment._id}/submissions/${selectedSubmission._id}/grade`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to grade submission');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission Graded",
        description: "Student submission has been graded successfully.",
      });
      queryClient.invalidateQueries(['instructor-assignments']);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGradeSubmission = () => {
    const totalScore = Object.values(gradingData.rubricScores).reduce((sum, score) => sum + (score || 0), 0);
    const maxPossibleScore = rubric.reduce((sum, item) => sum + item.maxScore, 0);
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    gradeSubmissionMutation.mutate({
      grade: Math.round(percentage),
      feedback: gradingData.feedback,
      rubricScores: gradingData.rubricScores,
      attachments: gradingData.attachments
    });
  };

  const handleRubricScoreChange = (rubricId, score) => {
    setGradingData(prev => ({
      ...prev,
      rubricScores: {
        ...prev.rubricScores,
        [rubricId]: Math.min(Math.max(0, score), rubric.find(r => r.id === rubricId)?.maxScore || 0)
      }
    }));
  };

  const calculateTotalScore = () => {
    return Object.values(gradingData.rubricScores).reduce((sum, score) => sum + (score || 0), 0);
  };

  const calculateMaxScore = () => {
    return rubric.reduce((sum, item) => sum + item.maxScore, 0);
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (!assignment) return null;

  const submissions = assignment.submissions || [];
  const pendingSubmissions = submissions.filter(sub => sub.status === 'submitted' && !sub.graded);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grade Assignment</h2>
          <p className="text-gray-600">{assignment.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Grades
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Submissions ({submissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSubmission?._id === submission._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{submission.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.graded ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Graded
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                  {submission.grade && (
                    <div className="text-sm font-medium mt-1">
                      Grade: {submission.grade}% ({getGradeLetter(submission.grade)})
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Grading Interface */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <div className="space-y-6">
              {/* Submission Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {selectedSubmission.studentName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Submission Content</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm">{selectedSubmission.content || 'No content provided'}</p>
                      </div>
                    </div>
                    
                    {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                      <div>
                        <Label>Attachments</Label>
                        <div className="mt-2 space-y-2">
                          {selectedSubmission.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{attachment.name}</span>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rubric Grading */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Rubric-Based Grading
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rubric.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="font-medium">{item.name}</Label>
                        <span className="text-sm text-gray-500">
                          {gradingData.rubricScores[item.id] || 0} / {item.maxScore}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={item.maxScore}
                          value={gradingData.rubricScores[item.id] || 0}
                          onChange={(e) => handleRubricScoreChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">points</span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Score:</span>
                      <span className="text-lg font-bold">
                        {calculateTotalScore()} / {calculateMaxScore()} 
                        ({Math.round((calculateTotalScore() / calculateMaxScore()) * 100)}%)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="feedback">Written Feedback</Label>
                      <Textarea
                        id="feedback"
                        value={gradingData.feedback}
                        onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                        placeholder="Provide detailed feedback to help the student improve..."
                        rows={6}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Good Work
                      </Button>
                      <Button variant="outline" size="sm">
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        Needs Improvement
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-1" />
                        Add Attachment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGradeSubmission}
                  disabled={gradeSubmissionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {gradeSubmissionMutation.isPending ? 'Grading...' : 'Submit Grade'}
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Submission</h3>
                <p className="text-gray-600">Choose a student submission from the list to begin grading</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradingInterface;
