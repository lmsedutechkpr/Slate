import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { buildApiUrl } from '../lib/utils.js';
import { useRealtimeInvalidate } from '../lib/useRealtimeInvalidate.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Trash2,
  FileText
} from 'lucide-react';

const AdminAuditLogs = () => {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Fetch audit logs data
  const { data: auditData, isLoading, isFetching } = useQuery({
    queryKey: ['/api/admin/audit-logs', { 
      search: searchTerm, 
      action: selectedAction, 
      user: selectedUser,
      dateRange,
      page, 
      limit,
      sortBy,
      sortDir
    }, accessToken],
    queryFn: async () => {
      console.log('Fetching audit logs...');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedAction && selectedAction !== 'all') params.append('action', selectedAction);
      if (selectedUser && selectedUser !== 'all') params.append('user', selectedUser);
      if (dateRange && dateRange !== 'all') params.append('dateRange', dateRange);
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);
      
      const response = await fetch(buildApiUrl(`/api/admin/audit-logs?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      console.log('Audit logs fetched:', data);
      return data;
    },
    enabled: !!accessToken,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  const auditLogs = auditData?.logs || [];
  const pagination = auditData?.pagination || { page, limit, total: 0 };
  const stats = auditData?.stats || { total: 0, today: 0, thisWeek: 0, thisMonth: 0 };

  // Real-time updates
  useRealtimeInvalidate(
    ['/api/admin/audit-logs'], 
    ['audit:create', 'audit:update', 'users:update', 'courses:update', 'instructors:update']
  );

  // Clear audit logs mutation
  const clearAuditLogsMutation = useMutation({
    mutationFn: async ({ olderThan }) => {
      console.log('Clearing audit logs older than:', olderThan);
      const response = await fetch(buildApiUrl('/api/admin/audit-logs/clear'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ olderThan })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to clear audit logs:', errorData);
        throw new Error(errorData.message || 'Failed to clear audit logs');
      }
      
      const result = await response.json();
      console.log('Audit logs cleared:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Audit logs cleared successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-logs'] });
      toast({ title: 'Audit logs cleared successfully' });
    },
    onError: (error) => {
      console.error('Clear audit logs error:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Export audit logs mutation
  const exportAuditLogsMutation = useMutation({
    mutationFn: async ({ format = 'csv' }) => {
      console.log('Exporting audit logs in format:', format);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedAction && selectedAction !== 'all') params.append('action', selectedAction);
      if (selectedUser && selectedUser !== 'all') params.append('user', selectedUser);
      if (dateRange && dateRange !== 'all') params.append('dateRange', dateRange);
      params.append('format', format);
      
      const response = await fetch(buildApiUrl(`/api/admin/audit-logs/export?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: 'Audit logs exported successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const getActionIcon = (action) => {
    switch (action) {
      case 'user:create':
      case 'user:update':
      case 'user:delete':
        return <User className="h-4 w-4" />;
      case 'course:create':
      case 'course:update':
      case 'course:delete':
        return <FileText className="h-4 w-4" />;
      case 'instructor:create':
      case 'instructor:update':
      case 'instructor:delete':
        return <Activity className="h-4 w-4" />;
      case 'login':
      case 'logout':
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getActionColor = (action) => {
    if (action.includes('create')) return 'bg-green-100 text-green-700';
    if (action.includes('update')) return 'bg-blue-100 text-blue-700';
    if (action.includes('delete')) return 'bg-red-100 text-red-700';
    if (action.includes('login')) return 'bg-green-100 text-green-700';
    if (action.includes('logout')) return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const totalPages = Math.ceil((pagination.total || 0) / (pagination.limit || limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Monitor system activities and user actions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-logs'] })}
            title="Refresh data"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            onClick={() => exportAuditLogsMutation.mutate({ format: 'csv' })}
            disabled={exportAuditLogsMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-400" />
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
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user:create">User Create</SelectItem>
                  <SelectItem value="user:update">User Update</SelectItem>
                  <SelectItem value="user:delete">User Delete</SelectItem>
                  <SelectItem value="course:create">Course Create</SelectItem>
                  <SelectItem value="course:update">Course Update</SelectItem>
                  <SelectItem value="course:delete">Course Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedAction('all');
                  setSelectedUser('all');
                  setDateRange('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs ({pagination.total})</CardTitle>
          <CardDescription>
            System activity log with real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {auditLogs.map((log) => (
                  <TableRow key={log._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.actorUsername || 'System'}</div>
                          <div className="text-sm text-gray-500">{log.actorEmail}</div>
                        </div>
                      </TableCell>
                    <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm font-medium truncate">{log.description}</div>
                          {log.meta && (
                            <div className="text-xs text-gray-500 mt-1">
                              {Object.keys(log.meta).length} metadata fields
                            </div>
                          )}
                      </div>
                    </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">{log.ip || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{formatDate(log.createdAt)}</div>
                          <div className="text-xs text-gray-500">{formatRelativeTime(log.createdAt)}</div>
                      </div>
                    </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status || 'success'}
                        </Badge>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Page {pagination.page || page} of {totalPages || 1} • {pagination.total || 0} results
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            disabled={(pagination.page || page) <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            disabled={(pagination.page || page) >= totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
          <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
