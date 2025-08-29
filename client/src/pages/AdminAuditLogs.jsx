import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminAuditLogs = () => {
  const { accessToken } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [action, setAction] = useState('all');
  const [actor, setActor] = useState('');
  const [targetId, setTargetId] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/audit-logs', { page, limit, action, actor, targetId, query }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (action && action !== 'all') params.append('action', action);
      if (actor) params.append('actor', actor);
      if (targetId) params.append('targetId', targetId);
      if (query) params.append('q', query);
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Failed to load logs');
      return res.json();
    },
    enabled: !!accessToken
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page, limit, total: logs.length };

  const actions = [
    'course:create', 'course:update', 'course:structure:update', 'course:delete', 'course:bulk:publish', 'course:bulk:archive', 'course:assign-instructor',
    'admin:profile:update', 'user:password:update'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600">Review administrative actions across the system</p>
      </div>

      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-gray-500">Action</label>
              <Select value={action} onValueChange={(v)=> setAction(v)}>
                <SelectTrigger><SelectValue placeholder="All actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actions.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Actor (username/email)</label>
              <Input value={actor} onChange={(e)=> setActor(e.target.value)} placeholder="Search actor" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Target ID</label>
              <Input value={targetId} onChange={(e)=> setTargetId(e.target.value)} placeholder="e.g., course/user id" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Quick search</label>
              <Input value={query} onChange={(e)=> setQuery(e.target.value)} placeholder="action, actor, ip, ua..." />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={()=> { setAction('all'); setActor(''); setTargetId(''); setQuery(''); setPage(1); }}>Clear</Button>
              <Button onClick={()=> refetch()}>Apply</Button>
              <Button variant="outline" onClick={async ()=> {
                const params = new URLSearchParams();
                params.append('page', '1');
                params.append('limit', String(limit));
                if (action && action !== 'all') params.append('action', action);
                if (actor) params.append('actor', actor);
                if (targetId) params.append('targetId', targetId);
                if (query) params.append('q', query);
                params.append('format', 'csv');
                window.location.href = `/api/admin/audit-logs?${params.toString()}`;
              }}>Export CSV</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs ({pagination.total || logs.length})</CardTitle>
          <CardDescription>Most recent first</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No logs found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="hidden md:table-cell">Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.actorUsername || '-'}</span>
                        <span className="text-xs text-gray-500">{log.actorEmail || '-'}</span>
                        <span className="text-xs text-gray-400">{log.actorRole || ''}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.targetType}{log.targetId ? `: ${log.targetId}` : ''}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-gray-600">
                      <div className="space-y-1">
                        <div>{log.meta ? JSON.stringify(log.meta) : '-'}</div>
                        <div className="text-gray-400">{log.ip || ''} {log.userAgent ? `• ${log.userAgent}` : ''}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {pagination.page} of {Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || limit)))} • {pagination.total || logs.length} results</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={pagination.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
          <Button variant="outline" disabled={pagination.page >= Math.ceil((pagination.total || 0) / (pagination.limit || limit))} onClick={() => setPage(p => p + 1)}>Next</Button>
          <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
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


