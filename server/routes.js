import express from 'express';
import { createServer } from 'http';
import connectDB from './db.js';
import { seedAdmin } from './seed/seedAdmin.js';
import mongoose from 'mongoose';

// Import controllers
import * as authController from './controllers/authController.js';
import * as userController from './controllers/userController.js';
import * as courseController from './controllers/courseController.js';
import * as assignmentController from './controllers/assignmentController.js';
import * as liveSessionController from './controllers/liveSessionController.js';
import * as productController from './controllers/productController.js';
import * as recommendationService from './services/recommendationService.js';
import * as analyticsController from './controllers/analyticsController.js';
import * as notificationController from './controllers/notificationController.js';

// Import middleware
import { authenticateToken, optionalAuth } from './middleware/auth.js';
import { requireAdmin, requireInstructorOrAdmin, requireStudent } from './middleware/rbac.js';

export async function registerRoutes(app) {
  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  
  // Test route
  app.get('/api/test', (_req, res) => res.json({ message: 'Test route working', time: new Date().toISOString() }));
  
  // Debug route for course creation testing
  app.post('/api/courses/test', (req, res) => {
    console.log('=== TEST COURSE ROUTE ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('User agent:', req.get('User-Agent'));
    res.json({ 
      message: 'Test route hit successfully',
      received: {
        method: req.method,
        path: req.path,
        hasBody: !!req.body,
        bodyKeys: Object.keys(req.body || {}),
        hasFiles: !!req.files,
        contentType: req.get('Content-Type')
      }
    });
  });
  
  // Simple test route without authentication
  app.get('/api/courses/test-simple', (req, res) => {
    res.json({ 
      message: 'Simple test route working',
      time: new Date().toISOString(),
      method: req.method,
      path: req.path
    });
  });
  
  // Serve uploaded files (for local storage fallback)
  app.use('/uploads', express.static('uploads'));
  
  // API Info
  app.get('/api', (_req, res) => res.json({ 
    message: 'EduTech LMS API',
    version: '1.0.0',
    status: 'running',
    time: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      courses: '/api/courses/*',
      assignments: '/api/assignments/*',
      products: '/api/products/*',
      admin: '/api/admin/*',
      recommendations: '/api/recommendations',
      dashboard: '/api/dashboard'
    }
  }));

  // Initialize database connection
  await connectDB();
  
  // Seed admin user
  await seedAdmin();
  
  // Auth routes
  app.post('/api/auth/student/register', authController.registerStudent);
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/refresh', authController.refreshToken);
  app.post('/api/auth/logout', authController.logout);
  app.get('/api/auth/user', authenticateToken, authController.getCurrentUser);
  
  // User routes
  app.get('/api/users/profile', authenticateToken, userController.getStudentProfile);
  // Allow admins to update their own profile; students use student updater
  app.put('/api/users/profile', authenticateToken, (req, res, next) => {
    if (req.user?.role === 'admin' || req.user?.role === 'super-admin') return userController.updateAdminProfile(req, res);
    return requireStudent(req, res, () => userController.updateStudentProfile(req, res));
  });
  app.put('/api/users/password', authenticateToken, userController.changePassword);
  app.post('/api/users/email/change-request', authenticateToken, userController.requestEmailChange);
  app.post('/api/users/email/verify', authenticateToken, userController.verifyEmailChange);
  app.post('/api/users/avatar', authenticateToken, userController.uploadAvatarMiddleware, userController.uploadAvatar);
  
  // Admin user management
  app.post('/api/admin/instructors', authenticateToken, requireAdmin, userController.createInstructor);
  app.get('/api/admin/users', authenticateToken, requireAdmin, userController.getAllUsers);
  app.put('/api/admin/users/:userId/status', authenticateToken, requireAdmin, userController.updateUserStatus);
  app.get('/api/admin/users/:userId/progress', authenticateToken, requireAdmin, userController.getUserProgress);
  
  // Course routes - Specific routes first (with parameters)
  app.post('/api/courses/:courseId/lectures/upload', authenticateToken, requireInstructorOrAdmin, courseController.uploadLectureVideoMiddleware, courseController.uploadLectureVideo);
  app.put('/api/courses/:courseId/structure', authenticateToken, requireInstructorOrAdmin, courseController.updateCourseStructure);
  app.put('/api/courses/:courseId', authenticateToken, requireInstructorOrAdmin, courseController.uploadCourseCoverMiddleware, courseController.updateCourse);
  app.delete('/api/courses/:courseId', authenticateToken, requireInstructorOrAdmin, courseController.deleteCourse);
  app.post('/api/courses/:courseId/enroll', authenticateToken, requireStudent, courseController.enrollInCourse);
  app.put('/api/courses/:courseId/progress', authenticateToken, requireStudent, courseController.updateCourseProgress);
  app.put('/api/courses/:courseId/assign-instructor', authenticateToken, requireAdmin, courseController.assignInstructor);
  
  // Course routes - General routes after (without parameters)
  app.post('/api/courses', authenticateToken, requireInstructorOrAdmin, courseController.uploadCourseCoverMiddleware, courseController.createCourse);
  app.get('/api/courses', optionalAuth, courseController.getAllCourses);
  app.get('/api/courses/:courseId', optionalAuth, courseController.getCourseById);
  
  app.post('/api/admin/courses/bulk/publish', authenticateToken, requireAdmin, courseController.bulkPublishCourses);
  app.post('/api/admin/courses/bulk/archive', authenticateToken, requireAdmin, courseController.bulkArchiveCourses);
  app.get('/api/enrollments', authenticateToken, requireStudent, courseController.getMyEnrollments);
  
  // Assignment routes
  app.post('/api/assignments', authenticateToken, requireInstructorOrAdmin, assignmentController.createAssignment);
  app.get('/api/courses/:courseId/assignments', authenticateToken, assignmentController.getAssignmentsByCourse);
  app.post('/api/assignments/:assignmentId/submit', authenticateToken, requireStudent, assignmentController.submitAssignment);
  app.put('/api/assignments/:assignmentId/submissions/:submissionId/grade', authenticateToken, requireInstructorOrAdmin, assignmentController.gradeSubmission);
  app.get('/api/students/assignments', authenticateToken, requireStudent, assignmentController.getStudentAssignments);
  app.get('/api/live-sessions/mine', authenticateToken, requireStudent, liveSessionController.getMyLiveSessions);
  
  // Product routes
  app.post('/api/products', authenticateToken, requireAdmin, productController.createProduct);
  app.get('/api/products', productController.getAllProducts);
  app.get('/api/products/categories', productController.getProductCategories);
  app.get('/api/products/:productId', productController.getProductById);
  app.put('/api/products/:productId', authenticateToken, requireAdmin, productController.updateProduct);
  app.delete('/api/products/:productId', authenticateToken, requireAdmin, productController.deleteProduct);
  
  // Admin analytics
  app.get('/api/admin/analytics/overview', authenticateToken, requireAdmin, analyticsController.getOverview);
  app.get('/api/admin/analytics/students', authenticateToken, requireAdmin, analyticsController.getStudentAnalytics);
  app.get('/api/admin/analytics/courses/:courseId', authenticateToken, requireAdmin, analyticsController.getCourseAnalytics);
  app.get('/api/admin/analytics/instructors/:instructorId', authenticateToken, requireAdmin, analyticsController.getInstructorAnalytics);

  // Audit logs
  app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { AuditLog, User } = await import('./models/index.js');
      const { page = 1, limit = 20, action, actor, targetId, q, format } = req.query;
      const filter = {};
      if (action) filter.action = action;
      if (targetId) filter.targetId = targetId;
      if (actor) {
        const rx = new RegExp(actor, 'i');
        const actors = await User.find({ $or: [{ username: rx }, { email: rx }] }).select('_id');
        filter.actorId = { $in: actors.map(a => a._id) };
      }
      if (q) {
        const rx = new RegExp(q, 'i');
        filter.$or = [
          { action: rx },
          { actorUsername: rx },
          { actorEmail: rx },
          { targetId: rx },
          { targetType: rx },
          { ip: rx },
          { userAgent: rx },
        ];
      }
      const logs = await AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
      const total = await AuditLog.countDocuments(filter);
      if (String(format).toLowerCase() === 'csv') {
        const fields = ['createdAt','action','actorUsername','actorEmail','actorRole','ip','userAgent','targetType','targetId','meta'];
        const esc = (v) => {
          if (v == null) return '';
          const s = typeof v === 'string' ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v));
          const needs = /[",\n]/.test(s);
          return needs ? '"' + s.replace(/"/g, '""') + '"' : s;
        };
        const header = fields.join(',');
        const rows = logs.map(l => [
          l.createdAt?.toISOString?.() || '',
          l.action,
          l.actorUsername,
          l.actorEmail,
          l.actorRole,
          l.ip,
          l.userAgent,
          l.targetType,
          l.targetId,
          l.meta || ''
        ].map(esc).join(','));
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        return res.send(csv);
      }
      res.json({ logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (e) {
      res.status(500).json({ message: 'Failed to load audit logs', error: e.message });
    }
  });
  
  // Simple notifications (polling)
  app.get('/api/admin/notifications', authenticateToken, requireAdmin, notificationController.list);
  app.post('/api/admin/notifications', authenticateToken, requireAdmin, notificationController.publish);
  
  // Recommendation routes
  app.get('/api/recommendations', authenticateToken, async (req, res) => {
    try {
      const recommendations = await recommendationService.updateUserRecommendations(req.user._id);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to get recommendations',
        error: error.message
      });
    }
  });
  
  // Dashboard data route
  app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
      const userId = req.user._id;
      
      // Get user's enrollments with progress
      const { Enrollment } = await import('./models/index.js');
      const enrollments = await Enrollment.find({ studentId: userId })
        .populate({
          path: 'courseId',
          populate: {
            path: 'assignedInstructor',
            select: 'username profile'
          }
        })
        .sort({ lastActivityAt: -1 })
        .limit(5);
      
      // Get upcoming assignments
      const { Assignment } = await import('./models/index.js');
      const courseIds = enrollments
        .map(e => (e && e.courseId ? e.courseId._id : null))
        .filter(Boolean);
      
      const assignments = courseIds.length === 0 ? [] : await Assignment.find({
        courseId: { $in: courseIds },
        isPublished: true,
        dueAt: { $gte: new Date() }
      })
      .populate('courseId', 'title')
      .sort({ dueAt: 1 })
      .limit(5);
      
      // Add submission status
      const assignmentsWithStatus = (assignments || []).map(assignment => {
        const submission = (assignment.submissions || []).find(
          sub => sub.studentId && sub.studentId.toString() === userId.toString()
        );
        
        return {
          ...assignment.toObject(),
          submissionStatus: submission ? submission.status : 'pending',
          submissions: undefined
        };
      });
      
      // Get recommendations
      let recommendations = { courses: [], products: [] };
      try {
        const rec = await recommendationService.updateUserRecommendations(userId);
        recommendations = rec || recommendations;
      } catch {}
      
      // Calculate stats
      const totalXP = (enrollments || []).reduce((sum, e) => sum + (e.xp || 0), 0);
      const completedCourses = (enrollments || []).filter(e => e.isCompleted).length;
      const streaks = (enrollments || []).map(e => e.streakCount || 0);
      const currentStreak = streaks.length ? Math.max(...streaks) : 0;
      
      res.json({
        enrollments,
        assignments: assignmentsWithStatus,
        recommendations,
        stats: {
          totalXP,
          completedCourses,
          currentStreak,
          weeklyHours: 12.5 // This would come from actual activity tracking
        }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.json({
        enrollments: [],
        assignments: [],
        recommendations: { courses: [], products: [] },
        stats: { totalXP: 0, completedCourses: 0, currentStreak: 0, weeklyHours: 0 }
      });
    }
  });
  
  // Debug route to test POST /api/courses
  app.post('/api/courses/test', (req, res) => {
    res.json({ message: 'POST /api/courses/test is working', method: req.method, path: req.path });
  });
  
  // Debug route to test database connectivity and show real data
  app.get('/api/debug/db-test', async (req, res) => {
    try {
      console.log('=== DATABASE DEBUG TEST ===');
      
      // Test database connection
      const dbState = mongoose.connection.readyState;
      const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      console.log('Database state:', dbStates[dbState]);
      
      // Test basic collections
      const userCount = await User.countDocuments({});
      const courseCount = await Course.countDocuments({});
      const enrollmentCount = await Enrollment.countDocuments({});
      
      console.log('Collection counts:', { userCount, courseCount, enrollmentCount });
      
      // Get sample data
      const sampleUsers = await User.find({}).limit(3).select('username email role createdAt');
      const sampleCourses = await Course.find({}).limit(3).select('title description category createdAt');
      
      res.json({
        message: 'Database debug test',
        time: new Date().toISOString(),
        database: {
          state: dbStates[dbState],
          connected: dbState === 1,
          collections: {
            users: userCount,
            courses: courseCount,
            enrollments: enrollmentCount
          }
        },
        sampleData: {
          users: sampleUsers,
          courses: sampleCourses
        }
      });
    } catch (error) {
      console.error('Database debug test failed:', error);
      res.status(500).json({
        message: 'Database debug test failed',
        error: error.message,
        stack: error.stack
      });
    }
  });

  // Comprehensive debug route to test environment and data flow
  app.get('/api/debug/comprehensive', async (req, res) => {
    try {
      console.log('=== COMPREHENSIVE DEBUG TEST ===');
      
      // Check environment variables
      const envVars = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        MONGO_URI: process.env.MONGO_URI ? 'Set (hidden)' : 'Not set',
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set (hidden)' : 'Not set',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'Set (hidden)' : 'Not set',
        CLOUDINARY_URL: process.env.CLOUDINARY_URL ? 'Set (hidden)' : 'Not set'
      };
      
      // Check database connection
      const dbState = mongoose.connection.readyState;
      const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      const dbConnected = dbState === 1;
      
      // Test database operations
      let dbTestResults = {};
      if (dbConnected) {
        try {
          const userCount = await User.countDocuments({});
          const courseCount = await Course.countDocuments({});
          const enrollmentCount = await Enrollment.countDocuments({});
          
          dbTestResults = {
            success: true,
            counts: { userCount, courseCount, enrollmentCount }
          };
        } catch (dbError) {
          dbTestResults = {
            success: false,
            error: dbError.message
          };
        }
      } else {
        dbTestResults = {
          success: false,
          error: 'Database not connected'
        };
      }
      
      // Check if we can create and read data
      let dataTestResults = {};
      if (dbConnected) {
        try {
          // Try to create a test document
          const testUser = new User({
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@test.com`,
            password: 'testpass123',
            role: 'student'
          });
          
          const savedUser = await testUser.save();
          console.log('Test user created:', savedUser._id);
          
          // Try to read it back
          const fetchedUser = await User.findById(savedUser._id);
          
          // Clean up
          await User.findByIdAndDelete(savedUser._id);
          
          dataTestResults = {
            success: true,
            create: 'success',
            read: 'success',
            delete: 'success'
          };
        } catch (dataError) {
          dataTestResults = {
            success: false,
            error: dataError.message
          };
        }
      }
      
      res.json({
        message: 'Comprehensive debug test',
        time: new Date().toISOString(),
        environment: envVars,
        database: {
          state: dbStates[dbState],
          connected: dbConnected,
          testResults: dbTestResults
        },
        dataOperations: dataTestResults,
        mongoose: {
          version: mongoose.version,
          models: Object.keys(mongoose.models)
        }
      });
      
    } catch (error) {
      console.error('Comprehensive debug test failed:', error);
      res.status(500).json({
        message: 'Comprehensive debug test failed',
        error: error.message,
        stack: error.stack
      });
    }
  });

  // Test route to create a course and verify database save
  app.post('/api/debug/create-test-course', async (req, res) => {
    try {
      console.log('=== TEST COURSE CREATION ===');
      console.log('Request body:', req.body);
      console.log('User:', req.user);
      
      // Create a test course
      const testCourse = new Course({
        title: `Test Course ${Date.now()}`,
        description: 'This is a test course to verify database connectivity',
        category: 'test',
        level: 'beginner',
        language: 'English',
        price: 0,
        createdBy: req.user?._id || '000000000000000000000000', // Use dummy ID if no user
        isPublished: false,
        status: 'draft'
      });
      
      console.log('Test course object:', testCourse);
      
      // Save to database
      const savedCourse = await testCourse.save();
      console.log('Course saved successfully:', savedCourse._id);
      
      // Verify it was saved by fetching it back
      const fetchedCourse = await Course.findById(savedCourse._id);
      console.log('Fetched course from database:', fetchedCourse);
      
      // Get updated count
      const newCourseCount = await Course.countDocuments({});
      
      res.json({
        message: 'Test course created successfully',
        course: savedCourse,
        fetchedCourse: fetchedCourse,
        newCourseCount,
        success: true
      });
      
    } catch (error) {
      console.error('Test course creation failed:', error);
      res.status(500).json({
        message: 'Test course creation failed',
        error: error.message,
        stack: error.stack,
        success: false
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
