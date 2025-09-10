import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioRef = null;

export function initIo(server) {
  if (ioRef) return ioRef;
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('auth', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const userId = decoded?._id || decoded?.id || decoded?.userId;
        if (userId) {
          socket.join(`user:${userId}`);
        }
      } catch (err) {
        // ignore invalid tokens
      }
    });
  });

  ioRef = io;
  return ioRef;
}

export function getIo() {
  return ioRef;
}


