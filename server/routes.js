import express from 'express';
import { createServer } from 'http';
import connectDB from './db.js';
import { seedAdmin } from './seed/seedAdmin.js';

// Import controllers
import * as authController from './controllers/authController.js';
import * as userController from './controllers/userController.js';
import * as courseController from './controllers/courseController.js';
import * as assignmentController from './controllers/assignmentController.js';
import * as productController from './controllers/productController.js';
import * as recommendationService from './services/recommendationService.js';

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
  
  // Admin user management
  app.post('/api/admin/instructors', authenticateToken, requireAdmin, userController.createInstructor);
  app.get('/api/admin/users', authenticateToken, requireAdmin, userController.getAllUsers);
  app.put('/api/admin/users/:userId/status', authenticateToken, requireAdmin, userController.updateUserStatus);
  
  // Course routes
  app.post('/api/courses', authenticateToken, requireInstructorOrAdmin, courseController.createCourse);
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
  
  // Product routes
  app.post('/api/products', authenticateToken, requireAdmin, productController.createProduct);
  app.get('/api/products', productController.getAllProducts);
  app.get('/api/products/categories', productController.getProductCategories);
  app.get('/api/products/:productId', productController.getProductById);
  app.put('/api/products/:productId', authenticateToken, requireAdmin, productController.updateProduct);
  app.delete('/api/products/:productId', authenticateToken, requireAdmin, productController.deleteProduct);
  
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
      const { Assignment, Course } = await import('./models/index.js');
      const courseIds = enrollments.map(e => e.courseId._id);
      
      const assignments = await Assignment.find({
        courseId: { $in: courseIds },
        isPublished: true,
        dueAt: { $gte: new Date() }
      })
      .populate('courseId', 'title')
      .sort({ dueAt: 1 })
      .limit(5);
      
      // Add submission status
      const assignmentsWithStatus = assignments.map(assignment => {
        const submission = assignment.submissions.find(
          sub => sub.studentId.toString() === userId.toString()
        );
        
        return {
          ...assignment.toObject(),
          submissionStatus: submission ? submission.status : 'pending',
          submissions: undefined
        };
      });
      
      // Get recommendations
      const recommendations = await recommendationService.updateUserRecommendations(userId);
      
      // Calculate stats
      const totalXP = enrollments.reduce((sum, e) => sum + (e.xp || 0), 0);
      const completedCourses = enrollments.filter(e => e.isCompleted).length;
      const currentStreak = Math.max(...enrollments.map(e => e.streakCount || 0), 0);
      
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
      res.status(500).json({
        message: 'Failed to get dashboard data',
        error: error.message
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
