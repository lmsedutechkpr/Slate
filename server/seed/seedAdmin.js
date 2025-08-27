import { User } from '../models/index.js';
import { UserRoles } from '../constants.js';

export const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: UserRoles.ADMIN });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }
    
    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@edutech.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: UserRoles.ADMIN,
      profile: {
        firstName: 'System',
        lastName: 'Administrator'
      },
      status: 'active'
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully');
    console.log('Username:', adminUser.username);
    console.log('Email:', adminUser.email);
    
    return adminUser;
    
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
};

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import('../db.js').then(async ({ default: connectDB }) => {
    await connectDB();
    await seedAdmin();
    process.exit(0);
  });
}
