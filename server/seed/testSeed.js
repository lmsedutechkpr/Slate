import connectDB from '../db.js';
import { seedComprehensiveData } from './seedComprehensiveData.js';

const testSeeding = async () => {
  try {
    console.log('🧪 Testing comprehensive seed data...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Run comprehensive seeding
    await seedComprehensiveData();
    
    console.log('\n🎉 Seed data test completed successfully!');
    console.log('\n📝 Test Login Credentials:');
    console.log('   Admin: admin@slate.com / Admin@123456');
    console.log('   Instructor: john.doe@example.com / Instructor123!');
    console.log('   Student: alice.johnson@example.com / Student123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed data test failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSeeding();
}

export default testSeeding;
