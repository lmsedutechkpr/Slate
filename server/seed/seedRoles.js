import { Role } from '../models/index.js';

export const seedRoles = async () => {
  try {
    // Check if roles already exist
    const existingRoles = await Role.countDocuments();
    if (existingRoles > 0) {
      console.log('Roles already exist, skipping seed');
      return;
    }

    // Create system roles
    const systemRoles = [
      {
        name: 'Administrator',
        description: 'Full system access and control',
        color: '#DC2626',
        icon: 'shield',
        isSystemRole: true,
        permissions: [
          { module: 'USER_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'reset_password', 'ban_user'] },
          { module: 'INSTRUCTOR_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'assign_courses'] },
          { module: 'COURSE_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'publish', 'manage_content'] },
          { module: 'STORE_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'manage_inventory', 'issue_refunds', 'update_status'] },
          { module: 'PRODUCT_MANAGEMENT', actions: ['read', 'create', 'update', 'delete', 'manage_inventory'] },
          { module: 'ORDER_MANAGEMENT', actions: ['read', 'update_status', 'issue_refunds', 'export'] },
          { module: 'INVENTORY_MANAGEMENT', actions: ['read', 'update', 'manage_inventory'] },
          { module: 'ANALYTICS', actions: ['read', 'export', 'create_reports'] },
          { module: 'SYSTEM_SETTINGS', actions: ['read', 'update', 'manage_payment', 'configure_email', 'manage_integrations'] },
          { module: 'REPORTS', actions: ['read', 'create', 'export', 'schedule'] }
        ]
      },
      {
        name: 'Instructor',
        description: 'Can manage courses and students',
        color: '#2563EB',
        icon: 'users',
        isSystemRole: true,
        permissions: [
          { module: 'COURSE_MANAGEMENT', actions: ['read', 'create', 'update', 'manage_content'] },
          { module: 'ANALYTICS', actions: ['read'] },
          { module: 'REPORTS', actions: ['read', 'create'] }
        ]
      },
      {
        name: 'Student',
        description: 'Can access courses and learning materials',
        color: '#059669',
        icon: 'graduation-cap',
        isSystemRole: true,
        permissions: []
      }
    ];

    await Role.insertMany(systemRoles);
    console.log('System roles seeded successfully');
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
};

export default seedRoles;
