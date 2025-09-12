import express from 'express';
import { createServer } from 'http';
import connectDB from './db.js';
import { seedAdmin } from './seed/seedAdmin.js';
import { seedRoles } from './seed/seedRoles.js';

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
import * as roleController from './controllers/roleController.js';
import * as instructorController from './controllers/instructorController.js';

// Import middleware
import { authenticateToken, optionalAuth } from './middleware/auth.js';
import { requireAdmin, requireInstructorOrAdmin, requireStudent } from './middleware/rbac.js';

export async function registerRoutes(app) {
  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  

  
  // Serve uploaded files (for local storage fallback)
  app.use('/uploads', express.static('uploads'));
  
  // API Info
  app.get('/api', (_req, res) => res.json({ 
    message: 'Slate LMS API',
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
  
  // Seed admin user and roles
  await seedAdmin();
  await seedRoles();
  
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
  app.get('/api/admin/users/:userId', authenticateToken, requireAdmin, userController.getUserById);
  app.put('/api/admin/users/:userId/status', authenticateToken, requireAdmin, userController.updateUserStatus);
  app.get('/api/admin/users/:userId/progress', authenticateToken, requireAdmin, userController.getUserProgress);
  app.post('/api/admin/users/bulk-action', authenticateToken, requireAdmin, userController.bulkUserAction);
  app.post('/api/admin/users/:userId/ban', authenticateToken, requireAdmin, userController.banUser);
  app.post('/api/admin/users/:userId/unban', authenticateToken, requireAdmin, userController.unbanUser);
  app.post('/api/admin/users/:userId/reset-password', authenticateToken, requireAdmin, userController.resetUserPassword);
  app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, userController.deleteUser);
  app.post('/api/admin/users/:userId/notes', authenticateToken, requireAdmin, userController.updateUserNotes);
  
  // Role management routes
  app.get('/api/admin/roles', authenticateToken, requireAdmin, roleController.getAllRoles);
  app.get('/api/admin/roles/:roleId', authenticateToken, requireAdmin, roleController.getRoleById);
  app.post('/api/admin/roles', authenticateToken, requireAdmin, roleController.createRole);
  app.put('/api/admin/roles/:roleId', authenticateToken, requireAdmin, roleController.updateRole);
  app.delete('/api/admin/roles/:roleId', authenticateToken, requireAdmin, roleController.deleteRole);
  app.post('/api/admin/roles/:roleId/permissions', authenticateToken, requireAdmin, roleController.updateRolePermissions);
  app.get('/api/admin/roles/:roleId/users', authenticateToken, requireAdmin, roleController.getRoleUsers);
  app.post('/api/admin/roles/initialize', authenticateToken, requireAdmin, roleController.initializeSystemRoles);
  
  // Instructor management routes
  app.get('/api/admin/instructors', authenticateToken, requireAdmin, instructorController.getAllInstructors);
  app.get('/api/admin/instructors/kpis', authenticateToken, requireAdmin, instructorController.getInstructorKPIs);
  app.get('/api/admin/instructors/:instructorId', authenticateToken, requireAdmin, instructorController.getInstructorById);
  app.put('/api/admin/instructors/:instructorId/status', authenticateToken, requireAdmin, instructorController.updateInstructorStatus);
  app.post('/api/admin/instructors/:instructorId/assign-courses', authenticateToken, requireAdmin, instructorController.assignCoursesToInstructor);
  app.put('/api/admin/instructors/:instructorId/payout-settings', authenticateToken, requireAdmin, instructorController.updateInstructorPayoutSettings);
  
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
  app.get('/api/enrollments/:courseId', authenticateToken, requireStudent, courseController.getEnrollmentByCourse);
  
  // Course Reviews
  app.get('/api/courses/:courseId/reviews', optionalAuth, courseController.getCourseReviews);
  app.post('/api/courses/:courseId/reviews', authenticateToken, requireStudent, courseController.createCourseReview);
  
  // Assignment routes
  app.post('/api/assignments', authenticateToken, requireInstructorOrAdmin, assignmentController.createAssignment);
  app.get('/api/courses/:courseId/assignments', authenticateToken, assignmentController.getAssignmentsByCourse);
  app.post('/api/assignments/:assignmentId/submit', authenticateToken, requireStudent, assignmentController.submitAssignment);
  app.put('/api/assignments/:assignmentId/submissions/:submissionId/grade', authenticateToken, requireInstructorOrAdmin, assignmentController.gradeSubmission);
  app.get('/api/students/assignments', authenticateToken, requireStudent, assignmentController.getStudentAssignments);
  app.get('/api/live-sessions/mine', authenticateToken, requireStudent, liveSessionController.getMyLiveSessions);

  // Instructor routes
  app.get('/api/instructor/courses', authenticateToken, requireInstructorOrAdmin, courseController.getInstructorCourses);
  app.get('/api/instructor/assignments', authenticateToken, requireInstructorOrAdmin, assignmentController.getInstructorAssignments);
  app.post('/api/instructor/assignments', authenticateToken, requireInstructorOrAdmin, assignmentController.createInstructorAssignment);
  app.delete('/api/instructor/assignments/:assignmentId', authenticateToken, requireInstructorOrAdmin, assignmentController.deleteInstructorAssignment);
  app.get('/api/instructor/live-sessions', authenticateToken, requireInstructorOrAdmin, liveSessionController.getInstructorLiveSessions);
  app.post('/api/instructor/live-sessions', authenticateToken, requireInstructorOrAdmin, liveSessionController.createInstructorLiveSession);
  app.put('/api/instructor/live-sessions/:sessionId', authenticateToken, requireInstructorOrAdmin, liveSessionController.updateInstructorLiveSession);
  app.delete('/api/instructor/live-sessions/:sessionId', authenticateToken, requireInstructorOrAdmin, liveSessionController.deleteInstructorLiveSession);
  app.get('/api/instructor/students', authenticateToken, requireInstructorOrAdmin, userController.getInstructorStudents);
  app.get('/api/instructor/analytics', authenticateToken, requireInstructorOrAdmin, analyticsController.getInstructorAnalytics);
  
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
    
  const httpServer = createServer(app);
  return httpServer;
}
