import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  BookOpen, 
  Target, 
  BarChart3, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Settings, 
  RefreshCw, 
  Filter, 
  SortAsc, 
  SortDesc, 
  ExternalLink, 
  Copy, 
  Share, 
  Star, 
  Award, 
  Activity, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const PlagiarismChecker = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [checkSettings, setCheckSettings] = useState({
    sensitivity: 'medium',
    checkSources: ['web', 'academic', 'internal'],
    excludeQuotes: true,
    excludeReferences: true,
    minMatchLength: 5,
    similarityThreshold: 15
  });

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

  // Fetch assignments
  const { data: assignmentsData } = useQuery({
    queryKey: ['instructor-assignments', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/assignments'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { assignments: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 30000
  });

  // Fetch plagiarism reports
  const { data: reportsData } = useQuery({
    queryKey: ['plagiarism-reports', user?._id, accessToken],
    queryFn: async () => {
      const res = await fetch(buildApiUrl('/api/instructor/plagiarism/reports'), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { reports: [] };
      return res.json();
    },
    enabled: !!accessToken && !!user?._id,
    refetchInterval: 15000
  });

  // Check plagiarism mutation
  const checkPlagiarismMutation = useMutation({
    mutationFn: async (checkData) => {
      const response = await fetch(buildApiUrl('/api/instructor/plagiarism/check'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(checkData)
      });

      if (!response.ok) {
        throw new Error('Failed to check plagiarism');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Plagiarism Check Complete",
        description: `Found ${data.matches.length} potential matches.`,
      });
      queryClient.invalidateQueries(['plagiarism-reports']);
      setIsChecking(false);
      setCheckingProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsChecking(false);
      setCheckingProgress(0);
    }
  });

  // Simulate progress for demo
  useEffect(() => {
    if (isChecking) {
      const interval = setInterval(() => {
        setCheckingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isChecking]);

  const handleCheckPlagiarism = (submissionId) => {
    setIsChecking(true);
    setCheckingProgress(0);
    
    checkPlagiarismMutation.mutate({
      submissionId: submissionId,
      settings: checkSettings
    });
  };

  const handleBulkCheck = () => {
    if (!selectedAssignment) {
      toast({
        title: "Error",
        description: "Please select an assignment first.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setCheckingProgress(0);
    
    checkPlagiarismMutation.mutate({
      assignmentId: selectedAssignment,
      settings: checkSettings
    });
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 80) return 'text-red-600';
    if (similarity >= 60) return 'text-orange-600';
    if (similarity >= 40) return 'text-yellow-600';
    if (similarity >= 20) return 'text-blue-600';
    return 'text-green-600';
  };

  const getSimilarityBadgeColor = (similarity) => {
    if (similarity >= 80) return 'bg-red-100 text-red-800';
    if (similarity >= 60) return 'bg-orange-100 text-orange-800';
    if (similarity >= 40) return 'bg-yellow-100 text-yellow-800';
    if (similarity >= 20) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getSimilarityLevel = (similarity) => {
    if (similarity >= 80) return 'High Risk';
    if (similarity >= 60) return 'Medium Risk';
    if (similarity >= 40) return 'Low Risk';
    if (similarity >= 20) return 'Minimal Risk';
    return 'Original';
  };

  const getSimilarityIcon = (similarity) => {
    if (similarity >= 80) return <XCircle className="w-4 h-4 text-red-600" />;
    if (similarity >= 60) return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    if (similarity >= 40) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    if (similarity >= 20) return <CheckCircle className="w-4 h-4 text-blue-600" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const filteredReports = () => {
    let reports = reportsData?.reports || [];
    
    if (searchQuery) {
      reports = reports.filter(report => 
        report.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      reports = reports.filter(report => {
        const similarity = report.similarity || 0;
        switch (filterStatus) {
          case 'high-risk': return similarity >= 80;
          case 'medium-risk': return similarity >= 60 && similarity < 80;
          case 'low-risk': return similarity >= 20 && similarity < 60;
          case 'original': return similarity < 20;
          default: return true;
        }
      });
    }
    
    return reports;
  };

  const courses = coursesData?.courses || [];
  const assignments = assignmentsData?.assignments || [];
  const reports = filteredReports();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plagiarism Checker</h1>
          <p className="text-gray-600">Detect and prevent academic dishonesty</p>
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
          <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Assignment" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((assignment) => (
                <SelectItem key={assignment._id} value={assignment._id}>
                  {assignment.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleBulkCheck}
            disabled={!selectedAssignment || isChecking}
          >
            <Search className="w-4 h-4 mr-2" />
            Check All
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isChecking && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Checking for plagiarism...</span>
                  <span>{checkingProgress}%</span>
                </div>
                <Progress value={checkingProgress} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Checks</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
              <Search className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {reports.filter(r => (r.similarity || 0) >= 80).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medium Risk</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reports.filter(r => (r.similarity || 0) >= 60 && (r.similarity || 0) < 80).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Original</p>
                <p className="text-2xl font-bold text-green-600">
                  {reports.filter(r => (r.similarity || 0) < 20).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search reports..."
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
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="high-risk">High Risk</SelectItem>
            <SelectItem value="medium-risk">Medium Risk</SelectItem>
            <SelectItem value="low-risk">Low Risk</SelectItem>
            <SelectItem value="original">Original</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Plagiarism Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
                <p className="text-gray-600">Run plagiarism checks on student submissions</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {report.studentName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{report.studentName}</h4>
                          <p className="text-sm text-gray-500">{report.assignmentTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(report.checkedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {report.wordCount || 0} words
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {report.matches?.length || 0} matches
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {getSimilarityIcon(report.similarity || 0)}
                          <span className={`font-bold text-lg ${getSimilarityColor(report.similarity || 0)}`}>
                            {report.similarity || 0}%
                          </span>
                        </div>
                        <Badge className={getSimilarityBadgeColor(report.similarity || 0)}>
                          {getSimilarityLevel(report.similarity || 0)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Matches Preview */}
                  {report.matches && report.matches.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h5 className="font-medium text-sm mb-2">Detected Matches:</h5>
                      <div className="space-y-2">
                        {report.matches.slice(0, 3).map((match, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{match.source}</p>
                              <p className="text-xs text-gray-500">{match.url}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-red-600">
                                {match.similarity}%
                              </span>
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {report.matches.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{report.matches.length - 3} more matches
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Plagiarism Check Settings</DialogTitle>
            <DialogDescription>
              Configure how plagiarism detection works
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sensitivity">Detection Sensitivity</Label>
              <Select value={checkSettings.sensitivity} onValueChange={(value) => setCheckSettings(prev => ({ ...prev, sensitivity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Strict)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="high">High (Sensitive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="similarityThreshold">Similarity Threshold (%)</Label>
              <Input
                id="similarityThreshold"
                type="number"
                min="0"
                max="100"
                value={checkSettings.similarityThreshold}
                onChange={(e) => setCheckSettings(prev => ({ ...prev, similarityThreshold: parseInt(e.target.value) || 15 }))}
              />
            </div>
            <div>
              <Label htmlFor="minMatchLength">Minimum Match Length (words)</Label>
              <Input
                id="minMatchLength"
                type="number"
                min="1"
                value={checkSettings.minMatchLength}
                onChange={(e) => setCheckSettings(prev => ({ ...prev, minMatchLength: parseInt(e.target.value) || 5 }))}
              />
            </div>
            <div>
              <Label>Check Sources</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="checkWeb"
                    checked={checkSettings.checkSources.includes('web')}
                    onChange={(e) => {
                      const sources = e.target.checked 
                        ? [...checkSettings.checkSources, 'web']
                        : checkSettings.checkSources.filter(s => s !== 'web');
                      setCheckSettings(prev => ({ ...prev, checkSources: sources }));
                    }}
                  />
                  <Label htmlFor="checkWeb">Web Sources</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="checkAcademic"
                    checked={checkSettings.checkSources.includes('academic')}
                    onChange={(e) => {
                      const sources = e.target.checked 
                        ? [...checkSettings.checkSources, 'academic']
                        : checkSettings.checkSources.filter(s => s !== 'academic');
                      setCheckSettings(prev => ({ ...prev, checkSources: sources }));
                    }}
                  />
                  <Label htmlFor="checkAcademic">Academic Databases</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="checkInternal"
                    checked={checkSettings.checkSources.includes('internal')}
                    onChange={(e) => {
                      const sources = e.target.checked 
                        ? [...checkSettings.checkSources, 'internal']
                        : checkSettings.checkSources.filter(s => s !== 'internal');
                      setCheckSettings(prev => ({ ...prev, checkSources: sources }));
                    }}
                  />
                  <Label htmlFor="checkInternal">Internal Submissions</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="excludeQuotes"
                  checked={checkSettings.excludeQuotes}
                  onChange={(e) => setCheckSettings(prev => ({ ...prev, excludeQuotes: e.target.checked }))}
                />
                <Label htmlFor="excludeQuotes">Exclude Quoted Text</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="excludeReferences"
                  checked={checkSettings.excludeReferences}
                  onChange={(e) => setCheckSettings(prev => ({ ...prev, excludeReferences: e.target.checked }))}
                />
                <Label htmlFor="excludeReferences">Exclude References</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsSettingsDialogOpen(false)}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlagiarismChecker;
