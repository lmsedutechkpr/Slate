import express from 'express';
import { registerRoutes } from './routes.js';
import { setupVite, serveStatic, log } from './vite.js';
import cors from 'cors';

const app = express();

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Development
      'http://localhost:3000', // Alternative dev port
      'https://edu-tech-rosy.vercel.app', // Your Vercel domain
      process.env.FRONTEND_URL // Custom frontend URL if set
    ].filter(Boolean);
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deployments
    if (origin && origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow any localhost in development
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Defensive CORS headers and universal preflight handling
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowList = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://edu-tech-rosy.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const isVercelPreview = typeof requestOrigin === 'string' && requestOrigin.includes('.vercel.app');
  const isAllowed = requestOrigin && (allowList.includes(requestOrigin) || isVercelPreview || (process.env.NODE_ENV === 'development' && requestOrigin.includes('localhost')));

  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);

      // Emit realtime events for non-GET API calls
      try {
        const io = req.app.get('io');
        if (io && req.method !== 'GET') {
          io.emit('api:update', { path, method: req.method, status: res.statusCode });
          // Emit topic-specific update based on first segment, e.g., /api/courses -> courses:update
          const first = (path.replace(/^\/api\//, '').split('/')[0] || '').trim();
          if (first) {
            io.emit(`${first}:update`, { path, method: req.method, status: res.statusCode });
          }
          
          // Emit instructor-specific events
          if (path.includes('/instructors')) {
            io.emit('instructors:update', { path, method: req.method, status: res.statusCode });
          }
          
          // Emit course-specific events
          if (path.includes('/courses')) {
            io.emit('courses:update', { path, method: req.method, status: res.statusCode });
            // Also emit instructor updates if course is assigned to instructor
            if (capturedJsonResponse?.instructor) {
              io.emit('instructors:update', { path, method: req.method, status: res.statusCode });
            }
            
            // Emit specific course deletion events
            if (path.includes('/courses') && method === 'DELETE') {
              io.emit('courses:delete', { path, method: req.method, status: res.statusCode, courseId: path.split('/').pop() });
            }
          }
          
          // Emit enrollment-specific events
          if (path.includes('/enrollments') || path.includes('/enroll')) {
            io.emit('enrollments:update', { path, method: req.method, status: res.statusCode });
            // Also emit instructor updates if enrollment affects instructor's courses
            if (capturedJsonResponse?.course?.instructor) {
              io.emit('instructors:update', { path, method: req.method, status: res.statusCode });
            }
          }
          
          // Emit user-specific events for instructor management
          if (path.includes('/users') && capturedJsonResponse?.role === 'instructor') {
            io.emit('instructors:update', { path, method: req.method, status: res.statusCode });
          }
          
          // Emit user ban/unban events
          if (path.includes('/users') && (path.includes('/ban') || path.includes('/unban'))) {
            io.emit('users:ban', { path, method: req.method, status: res.statusCode, userId: path.split('/').pop() });
            io.emit('users:update', { path, method: req.method, status: res.statusCode });
          }
          
          // Emit role-specific events
          if (path.includes('/roles')) {
            io.emit('roles:update', { path, method: req.method, status: res.statusCode });
            if (method === 'POST') {
              io.emit('roles:create', { path, method: req.method, status: res.statusCode });
            } else if (method === 'DELETE') {
              io.emit('roles:delete', { path, method: req.method, status: res.statusCode });
            } else if (path.includes('/permissions')) {
              io.emit('roles:permissions', { path, method: req.method, status: res.statusCode });
            }
          }
          
          // Emit audit log events
          if (path.includes('/audit-logs')) {
            io.emit('audit:update', { path, method: req.method, status: res.statusCode });
          }
        }
      } catch {}
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  // Socket.io for realtime notifications
  const { Server } = await import('socket.io');
  const io = new Server(server, { cors: { origin: '*' } });
  app.set('io', io);

  io.on('connection', (socket) => {
    socket.on('notifications:subscribe', () => {
      socket.join('admin');
    });
  });

  // Patch notificationController.publish to emit
  try {
    const { publish } = await import('./controllers/notificationController.js');
    const originalPublish = publish;
    (await import('./controllers/notificationController.js')).publish = async (req, res) => {
      await originalPublish(req, res);
      io.to('admin').emit('notification', {
        title: req.body?.title || 'Notification',
        message: req.body?.message || ''
      });
    };
  } catch {}

  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });
})();
