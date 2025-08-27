import express from 'express';
import { createServer } from 'http';
import connectDB from './db.js';
import { seedAdmin } from './seed/seedAdmin.js';

// Import controllers
import * as authController from './controllers/authController.js';
import * as userController from './controllers/userController.js';
import * as courseController from './controllers/courseController.js';
import * as assignmentController from './controllers/assignmentController.js';
import * as liveSessionController from './controllers/liveSessionController.js';
import * as productController from './controllers/productController.js';
import * as recommendationService from './services/recommendationService.js';
import * as analyticsController from './controllers/analyticsController.js';

// Import middleware
import { authenticateToken, optionalAuth } from './middleware/auth.js';
import { requireAdmin, requireInstructorOrAdmin, requireStudent } from './middleware/rbac.js';

export async function registerRoutes(app) {
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
  app.put('/api/users/profile', authenticateToken, requireStudent, userController.updateStudentProfile);
  app.put('/api/users/password', authenticateToken, userController.changePassword);
  app.post('/api/users/email/change-request', authenticateToken, userController.requestEmailChange);
  app.post('/api/users/email/verify', authenticateToken, userController.verifyEmailChange);
  app.post('/api/users/avatar', authenticateToken, userController.uploadAvatarMiddleware, userController.uploadAvatar);
  
  // Admin user management
  app.post('/api/admin/instructors', authenticateToken, requireAdmin, userController.createInstructor);
  app.get('/api/admin/users', authenticateToken, requireAdmin, userController.getAllUsers);
  app.put('/api/admin/users/:userId/status', authenticateToken, requireAdmin, userController.updateUserStatus);
  app.get('/api/admin/users/:userId/progress', authenticateToken, requireAdmin, userController.getUserProgress);
  
  // Course routes
  app.post('/api/courses', authenticateToken, requireInstructorOrAdmin, courseController.uploadCourseCoverMiddleware, courseController.createCourse);
  app.put('/api/courses/:courseId/structure', authenticateToken, requireInstructorOrAdmin, courseController.updateCourseStructure);
  app.post('/api/courses/:courseId/lectures/upload', authenticateToken, requireInstructorOrAdmin, courseController.uploadLectureVideoMiddleware, courseController.uploadLectureVideo);
  app.put('/api/courses/:courseId', authenticateToken, requireInstructorOrAdmin, courseController.uploadCourseCoverMiddleware, courseController.updateCourse);
  app.get('/api/courses', optionalAuth, courseController.getAllCourses);
  app.get('/api/courses/:courseId', optionalAuth, courseController.getCourseById);
  app.post('/api/courses/:courseId/enroll', authenticateToken, requireStudent, courseController.enrollInCourse);
  app.get('/api/enrollments', authenticateToken, requireStudent, courseController.getMyEnrollments);
  app.put('/api/courses/:courseId/progress', authenticateToken, requireStudent, courseController.updateCourseProgress);
  app.put('/api/courses/:courseId/assign-instructor', authenticateToken, requireAdmin, courseController.assignInstructor);
  
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
