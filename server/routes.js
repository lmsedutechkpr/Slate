import express from 'express';
import { createServer } from 'http';
import connectDB from './db.js';
import { seedAdmin } from './seed/seedAdmin.js';
import { seedRoles } from './seed/seedRoles.js';
import seedRoutes from './seed/seedRoutes.js';

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
import * as auditLogController from './controllers/auditLogController.js';

// Import middleware
import { authenticateToken, optionalAuth } from './middleware/auth.js';
import { requireAdmin, requireInstructorOrAdmin, requireStudent } from './middleware/rbac.js';

export async function registerRoutes(app) {
  // Health
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  
  // Test route for seeding
  app.get('/api/test', (_req, res) => res.json({ 
    message: 'Seeding API is working!', 
    timestamp: new Date().toISOString(),
    routes: {
      seedPage: '/seed',
      seedAPI: '/api/seed/seed-production',
      seedStatus: '/api/seed/seed-status'
    }
  }));
  
  // Simple verification endpoint
  app.get('/api/verify-seeding', async (req, res) => {
    try {
      const { User, Course, Product } = await import('../models/index.js');
      
      const userCount = await User.countDocuments();
      const courseCount = await Course.countDocuments();
      const productCount = await Product.countDocuments();
      const adminExists = await User.findOne({ role: 'admin' });
      
      res.json({
        success: true,
        seeded: userCount > 0 && courseCount > 0 && productCount > 0,
        counts: {
          users: userCount,
          courses: courseCount,
          products: productCount
        },
        adminExists: !!adminExists,
        loginCredentials: {
          admin: 'admin@slate.com / Admin@123456',
          instructor: 'john.doe@example.com / Instructor123!',
          student: 'alice.johnson@example.com / Student123!'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Seed routes for production deployment
  app.use('/api/seed', seedRoutes);
  
  // Serve seeding page
  app.get('/seed', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slate LMS - Production Seeding</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            text-align: center;
            margin-bottom: 30px;
        }
        .warning {
            background: #fef3cd;
            border: 1px solid #fecaca;
            color: #92400e;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .info {
            background: #dbeafe;
            border: 1px solid #93c5fd;
            color: #1e40af;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        input[type="text"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        button {
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        button:hover {
            background: #1d4ed8;
        }
        button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            display: none;
        }
        .success {
            background: #d1fae5;
            border: 1px solid #a7f3d0;
            color: #065f46;
        }
        .error {
            background: #fee2e2;
            border: 1px solid #fca5a5;
            color: #991b1b;
        }
        .credentials {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .credentials h3 {
            margin-top: 0;
            color: #374151;
        }
        .credentials ul {
            margin: 0;
            padding-left: 20px;
        }
        .credentials li {
            margin-bottom: 5px;
        }
        small {
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌱 Slate LMS - Production Seeding</h1>
        
        <div class="warning">
            <strong>⚠️ Warning:</strong> This will clear all existing data and replace it with comprehensive seed data. Only use this on a fresh deployment or when you want to reset all data.
        </div>
        
        <div class="info">
            <strong>ℹ️ Info:</strong> This tool will seed your production database with comprehensive test data including users, courses, materials, live sessions, products, and more.
        </div>
        
        <form id="seedForm">
            <div class="form-group">
                <label for="secret">Secret Key:</label>
                <input type="text" id="secret" name="secret" placeholder="Enter secret key" value="slate-seed-2024" required>
                <small>Default: slate-seed-2024</small>
            </div>
            
            <button type="submit" id="seedBtn">🚀 Seed Production Database</button>
        </form>
        
        <div id="result" class="result"></div>
        
        <div class="credentials" id="credentials" style="display: none;">
            <h3>📝 Login Credentials After Seeding:</h3>
            <ul>
                <li><strong>Admin:</strong> admin@slate.com / Admin@123456</li>
                <li><strong>Instructor:</strong> john.doe@example.com / Instructor123!</li>
                <li><strong>Student:</strong> alice.johnson@example.com / Student123!</li>
            </ul>
            <p><strong>Note:</strong> There are 5 instructors and 8 students total. All use the same password pattern: Instructor123! for instructors, Student123! for students.</p>
        </div>
    </div>

    <script>
        document.getElementById('seedForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const secret = document.getElementById('secret').value;
            const seedBtn = document.getElementById('seedBtn');
            const result = document.getElementById('result');
            const credentials = document.getElementById('credentials');
            
            seedBtn.disabled = true;
            seedBtn.textContent = '🔄 Seeding Database...';
            result.style.display = 'none';
            credentials.style.display = 'none';
            
            try {
                const response = await fetch('/api/seed/seed-production', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ secret })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.className = 'result success';
                    result.innerHTML = \`
                        <strong>✅ Success!</strong><br>
                        \${data.message}<br><br>
                        <strong>Database seeded with:</strong><br>
                        • 14 Users (1 admin, 5 instructors, 8 students)<br>
                        • 3 Comprehensive Courses with full content<br>
                        • 15+ Enrollments with progress tracking<br>
                        • 3 Assignments with due dates<br>
                        • 3 Live Sessions scheduled<br>
                        • 3 Products in store<br>
                        • 8 Orders with payments<br>
                        • 12+ Reviews with ratings<br>
                        • 30+ User Activities tracked<br>
                        • 30+ Audit Logs for monitoring
                    \`;
                    credentials.style.display = 'block';
                } else {
                    result.className = 'result error';
                    result.innerHTML = \`<strong>❌ Error:</strong> \${data.message}\`;
                }
            } catch (error) {
                result.className = 'result error';
                result.innerHTML = \`<strong>❌ Error:</strong> Failed to connect to server. Make sure your backend is running.\`;
            }
            
            result.style.display = 'block';
            seedBtn.disabled = false;
            seedBtn.textContent = '🚀 Seed Production Database';
        });
        
        // Check seeding status on page load
        window.addEventListener('load', async () => {
            try {
                const response = await fetch('/api/seed/seed-status');
                const data = await response.json();
                
                if (data.isSeeded) {
                    document.getElementById('result').className = 'result success';
                    document.getElementById('result').innerHTML = \`
                        <strong>✅ Database Status:</strong><br>
                        Database is already seeded with comprehensive data.<br><br>
                        <strong>Current Data:</strong><br>
                        • Users: \${data.counts.users}<br>
                        • Courses: \${data.counts.courses}<br>
                        • Products: \${data.counts.products}<br>
                        • Enrollments: \${data.counts.enrollments}<br>
                        • Assignments: \${data.counts.assignments}<br>
                        • Live Sessions: \${data.counts.liveSessions}<br>
                        • Reviews: \${data.counts.reviews}<br>
                        • Orders: \${data.counts.orders}
                    \`;
                    document.getElementById('result').style.display = 'block';
                    document.getElementById('credentials').style.display = 'block';
                }
            } catch (error) {
                console.log('Could not check seeding status:', error);
            }
        });
    </script>
</body>
</html>
    `);
  });
  

  
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
  
  // Audit log routes
  app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, auditLogController.getAllAuditLogs);
  app.get('/api/admin/audit-logs/:logId', authenticateToken, requireAdmin, auditLogController.getAuditLogById);
  app.delete('/api/admin/audit-logs/clear', authenticateToken, requireAdmin, auditLogController.clearAuditLogs);
  app.get('/api/admin/audit-logs/export', authenticateToken, requireAdmin, auditLogController.exportAuditLogs);
  app.get('/api/admin/audit-logs/stats', authenticateToken, requireAdmin, auditLogController.getAuditStats);
  
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
      const { Enrollment, Assignment, Product, LiveSession } = await import('./models/index.js');
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
      
      // Get live sessions
      const liveSessions = await LiveSession.find({
        isPublished: true,
        startTime: { $gte: new Date() }
      })
      .populate('instructorId', 'username profile')
      .sort({ startTime: 1 })
      .limit(3);
      
      // Get course-specific product recommendations
      const courseCategories = enrollments
        .map(e => e.courseId?.category)
        .filter(Boolean);
      
      const courseTags = enrollments
        .flatMap(e => e.courseId?.tags || [])
        .filter(Boolean);
      
      // Map course categories to product categories
      const categoryMapping = {
        'web-development': ['keyboard', 'mouse', 'monitor', 'headphones'],
        'mobile-development': ['stylus', 'headphones', 'camera'],
        'data-science': ['monitor', 'headphones', 'stylus'],
        'ai-ml': ['headphones', 'monitor', 'stylus'],
        'design': ['stylus', 'monitor', 'tablet', 'camera'],
        'photography': ['camera', 'tripod', 'lens', 'memory-card'],
        'video-editing': ['monitor', 'headphones', 'camera', 'microphone'],
        'podcasting': ['microphone', 'headphones', 'audio-interface'],
        'music': ['microphone', 'headphones', 'audio-interface', 'midi-keyboard']
      };
      
      let relevantProductCategories = new Set();
      courseCategories.forEach(category => {
        const mapped = categoryMapping[category?.toLowerCase()] || [];
        mapped.forEach(cat => relevantProductCategories.add(cat));
      });
      
      // Add general study accessories
      relevantProductCategories.add('headphones', 'stylus', 'notebook', 'chargers');
      
      const recommendedProducts = await Product.find({
        isActive: true,
        category: { $in: Array.from(relevantProductCategories) }
      })
      .sort({ rating: -1, createdAt: -1 })
      .limit(6);
      
      // Get general recommendations
      let recommendations = { courses: [], products: [] };
      try {
        const rec = await recommendationService.updateUserRecommendations(userId);
        recommendations = rec || recommendations;
      } catch {}
      
      // Calculate enhanced stats
      const totalXP = (enrollments || []).reduce((sum, e) => sum + (e.xp || 0), 0);
      const completedCourses = (enrollments || []).filter(e => e.isCompleted).length;
      const streaks = (enrollments || []).map(e => e.streakCount || 0);
      const currentStreak = streaks.length ? Math.max(...streaks) : 0;
      
      // Calculate weekly study time (mock data for now)
      const weeklyStudyTime = (enrollments || []).reduce((sum, e) => sum + (e.timeSpent || 0), 0);
      const dailyAverage = weeklyStudyTime / 7;
      const studyDays = (enrollments || []).filter(e => e.lastActivityAt && 
        new Date(e.lastActivityAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      res.json({
        enrollments,
        assignments: assignmentsWithStatus,
        liveSessions,
        recommendations: {
          courses: recommendations.courses || [],
          products: recommendedProducts
        },
        stats: {
          totalXP,
          completedCourses,
          currentStreak,
          weeklyStudyTime: Math.round(weeklyStudyTime / 60), // Convert to hours
          dailyAverage: Math.round(dailyAverage / 60), // Convert to hours
          studyDays,
          totalStudyTime: weeklyStudyTime
        }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.json({
        enrollments: [],
        assignments: [],
        liveSessions: [],
        recommendations: { courses: [], products: [] },
        stats: { 
          totalXP: 0, 
          completedCourses: 0, 
          currentStreak: 0, 
          weeklyStudyTime: 0,
          dailyAverage: 0,
          studyDays: 0,
          totalStudyTime: 0
        }
      });
    }
  });
    
  const httpServer = createServer(app);
  return httpServer;
}
