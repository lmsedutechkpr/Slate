import connectDB from '../db.js';
import { seedAdmin } from './seedAdmin.js';
import { seedRoles } from './seedRoles.js';
import { seedComprehensiveData } from './seedComprehensiveData.js';

const seedProduction = async () => {
  try {
    console.log('🚀 Starting production database seeding...');
    
    // Connect to production database
    await connectDB();
    console.log('✅ Connected to production database');
    
    // Check if data already exists
    const { User, Course, Product } = await import('../models/index.js');
    
    const existingUsers = await User.countDocuments();
    const existingCourses = await Course.countDocuments();
    const existingProducts = await Product.countDocuments();
    
    if (existingUsers > 0 || existingCourses > 0 || existingProducts > 0) {
      console.log('⚠️  Database already contains data:');
      console.log(`   Users: ${existingUsers}`);
      console.log(`   Courses: ${existingCourses}`);
      console.log(`   Products: ${existingProducts}`);
      console.log('🔄 Clearing existing data and reseeding...');
      
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
      
      console.log('✅ Cleared existing data');
    }
    
    // Seed roles first
    console.log('\n📋 Seeding roles...');
    await seedRoles();
    
    // Seed admin user
    console.log('\n👑 Seeding admin user...');
    await seedAdmin();
    
    // Seed comprehensive data
    console.log('\n🌱 Seeding comprehensive data...');
    await seedComprehensiveData();
    
    console.log('\n🎉 Production seeding completed successfully!');
    console.log('\n📝 Production Login Credentials:');
    console.log('   Admin: admin@slate.com / Admin@123456');
    console.log('   Instructor: john.doe@example.com / Instructor123!');
    console.log('   Student: alice.johnson@example.com / Student123!');
    console.log('\n🌐 Your deployed app now has complete seed data!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Production seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProduction();
}

export default seedProduction;
