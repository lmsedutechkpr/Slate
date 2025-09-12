// Socket.io client library for real-time updates
import { io } from 'socket.io-client';

let socket = null;
const subscribers = new Map();

// Initialize socket connection
export const initializeSocket = (token) => {
  if (socket) {
    return socket;
  }

  const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  socket = io(serverUrl, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

// Subscribe to a specific event
export const subscribe = async (eventName, callback) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return () => {};
  }

  // Add callback to subscribers map
  if (!subscribers.has(eventName)) {
    subscribers.set(eventName, new Set());
  }
  subscribers.get(eventName).add(callback);

  // Set up event listener
  socket.on(eventName, callback);

  // Return unsubscribe function
  return () => {
    if (subscribers.has(eventName)) {
      subscribers.get(eventName).delete(callback);
      if (subscribers.get(eventName).size === 0) {
        subscribers.delete(eventName);
        socket.off(eventName);
      }
    }
  };
};

// Unsubscribe from an event
export const unsubscribe = (eventName, callback) => {
  if (subscribers.has(eventName)) {
    subscribers.get(eventName).delete(callback);
    if (subscribers.get(eventName).size === 0) {
      subscribers.delete(eventName);
      if (socket) {
        socket.off(eventName);
      }
    }
  }
};

// Emit an event to the server
export const emit = (eventName, data) => {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
  } else {
    console.warn('Socket not connected. Cannot emit event:', eventName);
  }
};

// Get socket connection status
export const isConnected = () => {
  return socket ? socket.connected : false;
};

// Disconnect socket
export const disconnect = () => {
  if (socket) {
    // Clear all subscribers
    subscribers.clear();
    socket.disconnect();
    socket = null;
  }
};

// Reconnect socket
export const reconnect = (token) => {
  disconnect();
  return initializeSocket(token);
};

// Get socket instance
export const getSocket = () => {
  return socket;
};

// Default export
export default {
  initializeSocket,
  subscribe,
  unsubscribe,
  emit,
  isConnected,
  disconnect,
  reconnect,
  getSocket
};
