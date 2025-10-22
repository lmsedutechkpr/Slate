import connectDB from '../db.js';
import { seedAdmin } from './seedAdmin.js';
import { seedRoles } from './seedRoles.js';
import { seedAllData } from './seedData.js';
import { seedAdditionalData } from './seedAdditionalData.js';

const runSeeding = async () => {
  try {
    console.log('🚀 Starting database seeding process...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Seed roles first
    console.log('\n📋 Seeding roles...');
    await seedRoles();
    
    // Seed admin user
    console.log('\n👑 Seeding admin user...');
    await seedAdmin();
    
    // Seed all comprehensive data
    console.log('\n🌱 Seeding comprehensive data...');
    await seedAllData();
    
    // Seed additional data
    console.log('\n🌱 Seeding additional comprehensive data...');
    await seedAdditionalData();
    
    console.log('\n🎉 All seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin: admin@slate.com / Admin@123456');
    console.log('   Instructor: john.doe@example.com / Instructor123!');
    console.log('   Student: student1@example.com / Student123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeding();
}

export default runSeeding;
