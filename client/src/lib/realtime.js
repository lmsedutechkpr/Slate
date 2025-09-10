import { io } from 'socket.io-client';
import { buildApiUrl } from './utils.js';

let socketRef = null;

export function getSocket(accessToken) {
  if (socketRef) return socketRef;
  const base = buildApiUrl('/');
  const url = new URL(base);
  const origin = `${url.protocol}//${url.host}`;
  socketRef = io(origin, { path: '/socket.io', transports: ['websocket'] });
  if (accessToken) {
    socketRef.emit('auth', accessToken);
  }
  return socketRef;
}

export function disconnectSocket() {
  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }
}


