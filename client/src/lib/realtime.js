import { io } from 'socket.io-client';
import { buildApiUrl } from './utils.js';

let socketRef = null;

export function getSocket(accessToken) {
  if (socketRef) return socketRef;
  const base = buildApiUrl('/');
  const url = new URL(base);
  const origin = `${url.protocol}//${url.host}`;
  socketRef = io(origin, { path: '/socket.io', transports: ['websocket'] });
  // Re-authenticate on connect to ensure token is applied
  socketRef.on('connect', () => {
    if (accessToken) {
      try { socketRef.emit('auth', accessToken); } catch {}
    }
  });
  if (accessToken) {
    try { socketRef.emit('auth', accessToken); } catch {}
  }
  return socketRef;
}

export function disconnectSocket() {
  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }
}


// Centralized, debounced invalidations for Admin Panel
export function setupAdminRealtimeInvalidations(queryClient, accessToken) {
  const socket = getSocket(accessToken);
  if (!socket) return () => {};
  let timer = null;
  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      try {
        // Core analytics and dashboard
        queryClient.invalidateQueries(['/api/admin/analytics/overview']);
        queryClient.invalidateQueries(['/api/admin/analytics/students']);
        // Users
        queryClient.invalidateQueries(['/api/admin/users']);
        // Courses
        queryClient.invalidateQueries(['/api/courses']);
        // Reports
        queryClient.invalidateQueries(['/api/admin/reports/sales']);
        queryClient.invalidateQueries(['/api/admin/reports/activity']);
        // Store
        queryClient.invalidateQueries(['/api/products/trending']);
      } catch {}
    }, 800);
  };

  const events = [
    'analytics:update',
    'orders:paid',
    'admin:courses:update',
    'admin:users:update',
    'admin:reports:update',
    'admin:products:update',
    'admin:inventory:low',
  ];
  events.forEach(ev => socket.on(ev, schedule));
  return () => {
    try { events.forEach(ev => socket.off(ev, schedule)); } catch {}
    if (timer) clearTimeout(timer);
  };
}


