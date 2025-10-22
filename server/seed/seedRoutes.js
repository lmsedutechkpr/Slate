import express from 'express';
import connectDB from '../db.js';
import { seedAdmin } from './seedAdmin.js';
import { seedRoles } from './seedRoles.js';
import { seedComprehensiveData } from './seedComprehensiveData.js';

const router = express.Router();

// Secret key for seeding endpoint (you should change this)
const SEED_SECRET = process.env.SEED_SECRET || 'slate-seed-2024';

// Production seeding endpoint
router.post('/seed-production', async (req, res) => {
  try {
    const { secret } = req.body;
    
    // Verify secret key
    if (secret !== SEED_SECRET) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Invalid secret key.' 
      });
    }
    
    console.log('🚀 Starting production seeding via API...');
    
    // Connect to database
    await connectDB();
    
    // Check if data already exists
    const { User, Course, Product } = await import('../models/index.js');
    
    const existingUsers = await User.countDocuments();
    const existingCourses = await Course.countDocuments();
    const existingProducts = await Product.countDocuments();
    
    if (existingUsers > 0 || existingCourses > 0 || existingProducts > 0) {
      console.log('⚠️  Database already contains data, clearing...');
      
      // Clear existing data
      await User.deleteMany({});
      await Course.deleteMany({});
      await Product.deleteMany({});
      await import('../models/index.js').then(async ({ Enrollment, Assignment, LiveSession, Review, AuditLog, Order, UserActivity, AdminSettings }) => {
        await Enrollment.deleteMany({});
        await Assignment.deleteMany({});
        await LiveSession.deleteMany({});
        await Review.deleteMany({});
        await AuditLog.deleteMany({});
        await Order.deleteMany({});
        await UserActivity.deleteMany({});
        await AdminSettings.deleteMany({});
      });
    }
    
    // Seed data
    await seedRoles();
    await seedAdmin();
    await seedComprehensiveData();
    
    console.log('✅ Production seeding completed via API');
    
    res.json({
      success: true,
      message: 'Production database seeded successfully!',
      credentials: {
        admin: 'admin@slate.com / Admin@123456',
        instructor: 'john.doe@example.com / Instructor123!',
        student: 'alice.johnson@example.com / Student123!'
      }
    });
    
  } catch (error) {
    console.error('❌ Production seeding failed:', error);
    res.status(500).json({
      success: false,
      message: 'Seeding failed: ' + error.message
    });
  }
});

// Get seeding status
router.get('/seed-status', async (req, res) => {
  try {
    await connectDB();
    
    const { User, Course, Product, Enrollment, Assignment, LiveSession, Review, Order } = await import('../models/index.js');
    
    const counts = {
      users: await User.countDocuments(),
      courses: await Course.countDocuments(),
      products: await Product.countDocuments(),
      enrollments: await Enrollment.countDocuments(),
      assignments: await Assignment.countDocuments(),
      liveSessions: await LiveSession.countDocuments(),
      reviews: await Review.countDocuments(),
      orders: await Order.countDocuments()
    };
    
    const isSeeded = counts.users > 0 && counts.courses > 0;
    
    res.json({
      success: true,
      isSeeded,
      counts,
      message: isSeeded ? 'Database is seeded' : 'Database needs seeding'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check seeding status: ' + error.message
    });
  }
});

export default router;
