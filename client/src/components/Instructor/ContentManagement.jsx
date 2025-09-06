import { useState, useRef, useCallback } from 'react';
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
  Upload, 
  Folder, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share,
  Clock,
  User,
  Calendar,
  FolderPlus,
  FilePlus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

const ContentManagement = () => {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [newFolder, setNewFolder] = useState({ name: '', description: '' });

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

  // Fetch course content
  const { data: contentData } = useQuery({
    queryKey: ['course-content', selectedCourse, accessToken],
    queryFn: async () => {
      if (!selectedCourse) return { folders: [], files: [] };
      const res = await fetch(buildApiUrl(`/api/instructor/courses/${selectedCourse}/content`), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return { folders: [], files: [] };
      return res.json();
    },
    enabled: !!accessToken && !!selectedCourse,
    refetchInterval: 15000
  });

  // Upload files mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetch(buildApiUrl(`/api/instructor/courses/${selectedCourse}/content/upload`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload files');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Files Uploaded",
        description: "Your files have been uploaded successfully.",
      });
      queryClient.invalidateQueries(['course-content']);
      setIsUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadProgress({});
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData) => {
      const response = await fetch(buildApiUrl(`/api/instructor/courses/${selectedCourse}/content/folders`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(folderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Folder Created",
        description: "New folder has been created successfully.",
      });
      queryClient.invalidateQueries(['course-content']);
      setIsCreateFolderDialogOpen(false);
      setNewFolder({ name: '', description: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      const response = await fetch(buildApiUrl(`/api/instructor/courses/${selectedCourse}/content/${type}/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Deleted",
        description: "Content has been deleted successfully.",
      });
      queryClient.invalidateQueries(['course-content']);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...fileArray]);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      formData.append('files', file);
    });
    formData.append('folderId', selectedFolder);
    formData.append('courseId', selectedCourse);

    uploadFilesMutation.mutate(formData);
  };

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name.",
        variant: "destructive",
      });
      return;
    }

    createFolderMutation.mutate({
      ...newFolder,
      courseId: selectedCourse,
      parentFolderId: selectedFolder
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-red-500" />;
    if (fileType.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="w-5 h-5 text-orange-500" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredContent = () => {
    let content = [...(contentData?.folders || []), ...(contentData?.files || [])];
    
    if (searchQuery) {
      content = content.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      content = content.filter(item => {
        if (item.type === 'folder') return filterType === 'folders';
        return item.fileType?.startsWith(filterType);
      });
    }
    
    return content;
  };

  const courses = coursesData?.courses || [];
  const content = filteredContent();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Organize and manage your course materials</p>
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
            onClick={() => setIsUploadDialogOpen(true)}
            disabled={!selectedCourse}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsCreateFolderDialogOpen(true)}
            disabled={!selectedCourse}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {selectedCourse ? (
        <>
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="folders">Folders</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="application">Documents</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content Display */}
          <div className="space-y-4">
            {content.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Folder className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                  <p className="text-gray-600 mb-4">Upload files or create folders to get started</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateFolderDialogOpen(true)}>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Create Folder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                {content.map((item) => (
                  <Card key={item._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.type === 'folder' ? (
                            <Folder className="w-8 h-8 text-blue-500" />
                          ) : (
                            getFileIcon(item.fileType)
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.name}</h4>
                            <p className="text-sm text-gray-500">
                              {item.type === 'folder' 
                                ? `${item.fileCount || 0} items`
                                : formatFileSize(item.size)
                              }
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Folder className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
            <p className="text-gray-600">Choose a course to manage its content</p>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload files to your course content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              ref={dropZoneRef}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Support for images, videos, documents, and more
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Choose Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Folder Selection */}
            <div>
              <Label htmlFor="folder">Upload to Folder (Optional)</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Root folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Root folder</SelectItem>
                  {(contentData?.folders || []).map((folder) => (
                    <SelectItem key={folder._id} value={folder._id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload Progress */}
            {uploadFilesMutation.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{Object.keys(uploadProgress).length} files</span>
                </div>
                <Progress value={50} className="w-full" />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploadFilesMutation.isPending}
              >
                {uploadFilesMutation.isPending ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolder.name}
                onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter folder name"
              />
            </div>
            <div>
              <Label htmlFor="folderDescription">Description (Optional)</Label>
              <Textarea
                id="folderDescription"
                value={newFolder.description}
                onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter folder description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFolder}
                disabled={!newFolder.name.trim() || createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
