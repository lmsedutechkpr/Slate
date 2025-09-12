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
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  // Socket.io for real-time updates
  const { initIo, getIo } = await import('./realtime.js');
  initIo(server);

  // Add admin room join on auth
  try {
    const { getIo } = await import('./realtime.js');
    const io = getIo();
    io?.on('connection', (socket) => {
      socket.on('auth', (token) => {
        try {
          const decoded = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString('utf8'));
          const role = decoded?.role;
          if (role === 'admin' || role === 'super-admin') socket.join('admin');
        } catch {}
      });
    });
  } catch {}

  // Patch notificationController.publish to emit
  try {
    const { publish } = await import('./controllers/notificationController.js');
    const originalPublish = publish;
    (await import('./controllers/notificationController.js')).publish = async (req, res) => {
      await originalPublish(req, res);
      const io = getIo();
      io?.to('admin').emit('notification', {
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
