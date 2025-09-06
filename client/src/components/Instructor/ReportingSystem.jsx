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
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Award,
  Target,
  FileText,
  Video,
  MessageSquare,
  Bell,
  Activity,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const ReportingSystem = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [isCreateReportDialogOpen, setIsCreateReportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [localReportData, setLocalReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    type: 'student-performance',
    courseId: '',
    dateRange: '30d',
    includeCharts: true,
    includeDetails: true,
    includeRecommendations: true
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

  // Fetch report data
  const { data: reportData } = useQuery({
    queryKey: ['instructor-report', selectedCourse, selectedReport, dateRange, accessToken],
    queryFn: async () => {
      if (!selectedCourse || !selectedReport) return null;
      const res = await fetch(buildApiUrl(`/api/instructor/reports/${selectedReport}?courseId=${selectedCourse}&dateRange=${dateRange}`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!accessToken && !!selectedCourse && !!selectedReport,
    refetchInterval: 30000
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportConfig) => {
      const response = await fetch(buildApiUrl('/api/instructor/reports/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(reportConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully.",
      });
      setLocalReportData(data);
      setIsGenerating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  });

  // Export report mutation
  const exportReportMutation = useMutation({
    mutationFn: async ({ reportId, format }) => {
      const response = await fetch(buildApiUrl(`/api/instructor/reports/${reportId}/export?format=${format}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      return response.blob();
    },
    onSuccess: (blob, { format }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Exported",
        description: `Report has been exported as ${format.toUpperCase()}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleGenerateReport = () => {
    if (!selectedCourse || !selectedReport) {
      toast({
        title: "Error",
        description: "Please select a course and report type.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateReportMutation.mutate({
      courseId: selectedCourse,
      reportType: selectedReport,
      dateRange: dateRange
    });
  };

  const handleExportReport = (format) => {
    if (!localReportData) {
      toast({
        title: "Error",
        description: "No report data to export.",
        variant: "destructive",
      });
      return;
    }

    exportReportMutation.mutate({
      reportId: localReportData.id,
      format: format
    });
  };

  const handleCreateReport = () => {
    if (!newReport.title.trim() || !newReport.courseId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    generateReportMutation.mutate(newReport);
    setIsCreateReportDialogOpen(false);
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'student-performance': return <Users className="w-5 h-5 text-blue-500" />;
      case 'course-analytics': return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'assignment-analysis': return <FileText className="w-5 h-5 text-purple-500" />;
      case 'attendance-report': return <Target className="w-5 h-5 text-orange-500" />;
      case 'grade-distribution': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'engagement-metrics': return <Activity className="w-5 h-5 text-red-500" />;
      case 'communication-summary': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'comprehensive': return <BarChart3 className="w-5 h-5 text-gray-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getReportTitle = (type) => {
    switch (type) {
      case 'student-performance': return 'Student Performance Report';
      case 'course-analytics': return 'Course Analytics Report';
      case 'assignment-analysis': return 'Assignment Analysis Report';
      case 'attendance-report': return 'Attendance Report';
      case 'grade-distribution': return 'Grade Distribution Report';
      case 'engagement-metrics': return 'Engagement Metrics Report';
      case 'communication-summary': return 'Communication Summary Report';
      case 'comprehensive': return 'Comprehensive Report';
      default: return 'Unknown Report';
    }
  };

  const getReportDescription = (type) => {
    switch (type) {
      case 'student-performance': return 'Detailed analysis of individual student performance and progress';
      case 'course-analytics': return 'Overall course performance metrics and trends';
      case 'assignment-analysis': return 'Analysis of assignment completion and grading patterns';
      case 'attendance-report': return 'Attendance tracking and patterns analysis';
      case 'grade-distribution': return 'Grade distribution and statistical analysis';
      case 'engagement-metrics': return 'Student engagement and participation metrics';
      case 'communication-summary': return 'Communication activity and message analysis';
      case 'comprehensive': return 'Complete overview of all course metrics and data';
      default: return 'Report description not available';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const courses = coursesData?.courses || [];
  const reportTypes = [
    'student-performance',
    'course-analytics',
    'assignment-analysis',
    'attendance-report',
    'grade-distribution',
    'engagement-metrics',
    'communication-summary',
    'comprehensive'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporting System</h1>
          <p className="text-gray-600">Generate comprehensive reports and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateReportDialogOpen(true)}
            disabled={!selectedCourse}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={!localReportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="course">Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getReportTitle(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={handleGenerateReport}
              disabled={!selectedCourse || !selectedReport || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((type) => (
          <Card 
            key={type} 
            className={`cursor-pointer transition-colors ${
              selectedReport === type ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
            }`}
            onClick={() => setSelectedReport(type)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getReportIcon(type)}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{getReportTitle(type)}</h4>
                  <p className="text-xs text-gray-500 mt-1">{getReportDescription(type)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Results */}
      {localReportData && (
        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getReportIcon(selectedReport)}
                    {getReportTitle(selectedReport)}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Generated on {formatDate(localReportData.generatedAt)} • 
                    {localReportData.dateRange} • 
                    {localReportData.courseTitle}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportReport('pdf')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportReport('excel')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {localReportData.summary?.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                      {metric.change && (
                        <div className="flex items-center mt-1">
                          {metric.change > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                          )}
                          <span className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(metric.change)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-gray-400">
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Data */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localReportData.details?.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{section.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                    {section.data && (
                      <div className="space-y-2">
                        {section.data.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="text-sm">{item.label}</span>
                            <span className="text-sm font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {localReportData.recommendations && localReportData.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {localReportData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-sm">{recommendation.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Report Dialog */}
      <Dialog open={isCreateReportDialogOpen} onOpenChange={setIsCreateReportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
            <DialogDescription>
              Generate a custom report with specific parameters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportTitle">Report Title</Label>
              <Input
                id="reportTitle"
                value={newReport.title}
                onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter report title"
              />
            </div>
            <div>
              <Label htmlFor="reportDescription">Description</Label>
              <textarea
                id="reportDescription"
                value={newReport.description}
                onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter report description"
                className="w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={newReport.type} onValueChange={(value) => setNewReport(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getReportTitle(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reportCourse">Course</Label>
                <Select value={newReport.courseId} onValueChange={(value) => setNewReport(prev => ({ ...prev, courseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reportDateRange">Date Range</Label>
              <Select value={newReport.dateRange} onValueChange={(value) => setNewReport(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={newReport.includeCharts}
                  onCheckedChange={(checked) => setNewReport(prev => ({ ...prev, includeCharts: checked }))}
                />
                <Label htmlFor="includeCharts">Include Charts and Graphs</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={newReport.includeDetails}
                  onCheckedChange={(checked) => setNewReport(prev => ({ ...prev, includeDetails: checked }))}
                />
                <Label htmlFor="includeDetails">Include Detailed Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRecommendations"
                  checked={newReport.includeRecommendations}
                  onCheckedChange={(checked) => setNewReport(prev => ({ ...prev, includeRecommendations: checked }))}
                />
                <Label htmlFor="includeRecommendations">Include Recommendations</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateReport}
                disabled={generateReportMutation.isPending}
              >
                {generateReportMutation.isPending ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Choose the format for exporting your report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleExportReport('pdf')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <FileText className="w-8 h-8 mb-2" />
                PDF
              </Button>
              <Button
                onClick={() => handleExportReport('excel')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <BarChart3 className="w-8 h-8 mb-2" />
                Excel
              </Button>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportingSystem;
