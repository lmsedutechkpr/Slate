let socketPromise;

export function getSocket() {
  if (!socketPromise) {
    socketPromise = (async () => {
      const { io } = await import('socket.io-client');
      const socket = io('/', { path: '/socket.io' });
      return socket;
    })();
  }
  return socketPromise;
}

export async function subscribe(event, handler) {
  const socket = await getSocket();
  socket.on(event, handler);
  return () => socket.off(event, handler);
}


